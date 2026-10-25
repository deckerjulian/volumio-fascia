'use strict';

// Songtexte (LRCLIB, mit Zeitstempeln pro Zeile) und Hintergrundinfos (Wikipedia) zum laufenden
// Titel. Abgefragt wird vom Pi aus: das Display braucht so keinen eigenen Internetzugang und
// stößt nicht an CORS-Grenzen (Kiosk, Handy, iOS-App). Ergebnisse landen auf der Platte, damit
// jeder Titel nur einmal abgefragt wird; "nichts gefunden" wird einen Tag lang gemerkt.

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var UA = 'fascia (Volumio plugin; https://github.com/deckerjulian/volumio-fascia)';
var TIMEOUT = 8000;
var MISS_TTL = 24 * 3600 * 1000;
var HIT_TTL = 180 * 24 * 3600 * 1000;
var MEM_MAX = 300;
// Bei geänderter Suche erhöhen: alte Einträge auf der Platte werden dann nicht mehr benutzt
var KEY_VERSION = 'v2';
var CACHE_MAX_FILES = 3000;

// Zusätze wie "(Remastered 2009)", "- Live", "[Deluxe Edition]" stören beim Suchen
var NOISE = /\s*[([][^)\]]*(remaster|live|version|edit|mono|stereo|deluxe|bonus|mix|anniversary|explicit)[^)\]]*[)\]]|\s+-\s+.*(remaster|live|version|edit|mono|stereo|mix).*$/gi;

function clean(s) {
  return String(s || '').replace(NOISE, '').trim();
}

function norm(s) {
  return clean(s).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    // Unicode-Buchstaben behalten: kyrillische, japanische … Titel dürfen nicht leer werden
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function getJson(url, retried) {
  return fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT)
  }).then(function (r) {
    if (r.status === 404) return null;
    // Kurze Überlastung (LRCLIB antwortet gelegentlich 503): einmal nachfassen
    if (r.status >= 500 && !retried) {
      return new Promise(function (res) { setTimeout(res, 1000); }).then(function () { return getJson(url, true); });
    }
    if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
    return r.json();
  });
}

function qs(params) {
  return Object.keys(params).filter(function (k) { return params[k] !== '' && params[k] != null; })
    .map(function (k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
}

// ------------------------------------------------------------------ Songtexte (LRCLIB)

function fetchLyrics(q) {
  var duration = Math.round(Number(q.duration) || 0);
  var get = 'https://lrclib.net/api/get?' + qs({
    artist_name: q.artist, track_name: q.title, album_name: q.album, duration: duration || ''
  });
  // /api/get antwortet bei manchen unbekannten Titeln dauerhaft mit 503 statt 404; dann suchen
  return getJson(get).catch(function () { return null; }).then(function (hit) {
    if (hit && (hit.syncedLyrics || hit.plainLyrics || hit.instrumental)) return hit;
    // Kein exakter Treffer (anderes Album, abweichende Länge, Zusätze im Titel): suchen
    var search = 'https://lrclib.net/api/search?' + qs({ artist_name: clean(q.artist), track_name: clean(q.title) });
    return getJson(search).then(function (list) {
      list = (list || []).filter(function (x) { return x.syncedLyrics || x.plainLyrics; });
      function close(x) { return !duration || Math.abs((x.duration || 0) - duration) <= 3; }
      return list.filter(function (x) { return x.syncedLyrics && close(x); })[0] ||
        list.filter(function (x) { return x.syncedLyrics; })[0] ||
        list.filter(close)[0] || list[0] || null;
    });
  }).then(function (hit) {
    if (!hit) return null;
    return { synced: hit.syncedLyrics || null, plain: hit.plainLyrics || null, instrumental: !!hit.instrumental };
  });
}

// ------------------------------------------------------------------ Hintergrundinfos (Wikipedia)

var MUSICIAN = /band|musician|singer|songwriter|rapper|composer|pianist|guitarist|drummer|orchestra|ensemble|group|duo|trio|quartet|DJ|producer|conductor|vocalist|Band|Musiker|Sänger|Komponist|Pianist|Gitarrist|Schlagzeuger|Rapper|Orchester|Gruppe|Duo|Trio|Quartett|Produzent|Dirigent|Liedermacher|Interpret/;

// Artikeltitel ohne Klammerzusatz: "Let It Be (song)" -> "let it be"
function baseTitle(t) { return norm(String(t).replace(/\s*\([^)]*\)\s*$/, '')); }
// Klammerzusatz: "Bohemian Rhapsody (Film)" -> "film"
function qualifier(t) { var m = String(t).match(/\(([^)]*)\)\s*$/); return m ? m[1].toLowerCase() : ''; }

var NOT_TRACK = /film|movie|album|novel|roman|buch|book|tv|serie|episode|musical|band|group|gruppe|sänger|singer|rapper|musician|musiker/;
var NOT_ALBUM = /film|movie|song|lied|single|novel|roman|buch|book|tv|serie|band|group|gruppe/;
var NOT_ARTIST = /album|song|lied|single|film|movie|novel|roman|buch|book|tv|serie|episode/;

function mentions(text, name) {
  var n = norm(name).replace(/^the /, '');
  return !!n && (' ' + norm(text) + ' ').indexOf(' ' + n + ' ') !== -1;
}

function summary(lang, title) {
  var url = 'https://' + lang + '.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title.replace(/ /g, '_'));
  return getJson(url);
}

// Sucht einen Artikel, dessen Titel genau passt und der die Prüfung besteht. Lieber nichts als
// ein falscher Artikel (bei Coverversionen und mehrdeutigen Namen passiert das sonst schnell).
// "reject" schließt Artikel über anderes aus (Klammerzusatz oder Kurzbeschreibung, z. B. der Film
// zum Song), "prefer" zieht passende Zusätze ("(Lied)", "(Band)") vor.
function findArticle(lang, query, name, accept, reject, prefer) {
  var url = 'https://' + lang + '.wikipedia.org/w/api.php?' + qs({
    action: 'query', list: 'search', format: 'json', srlimit: 8, srsearch: query
  });
  return getJson(url).then(function (res) {
    var want = norm(name);
    var hits = ((res && res.query && res.query.search) || []).filter(function (h) {
      return baseTitle(h.title) === want && !reject.test(qualifier(h.title));
    });
    function rank(h) { var q = qualifier(h.title); return prefer.test(q) ? 0 : q ? 2 : 1; }
    hits.sort(function (a, b) { return rank(a) - rank(b); });
    return hits.reduce(function (p, h) {
      return p.then(function (found) {
        if (found) return found;
        return summary(lang, h.title).then(function (s) {
          if (!s || s.type === 'disambiguation' || !s.extract) return null;
          if (reject.test(String(s.description || '').toLowerCase())) return null;
          return accept(s.extract + ' ' + (s.description || '')) ? s : null;
        });
      });
    }, Promise.resolve(null));
  });
}

function fetchInfo(q) {
  var langs = [q.lang || 'en', 'en'].filter(function (l, i, a) { return /^[a-z]{2,3}$/.test(l) && a.indexOf(l) === i; });
  var artist = clean(q.artist);
  var title = clean(q.title);
  var album = clean(q.album);
  var kinds = [];
  if (title && artist) {
    kinds.push({ kind: 'track', query: title + ' ' + artist, name: title, reject: NOT_TRACK, prefer: /song|lied|single/,
      accept: function (text) { return mentions(text, artist); } });
  }
  if (album && artist && norm(album) !== norm(title)) {
    kinds.push({ kind: 'album', query: album + ' ' + artist, name: album, reject: NOT_ALBUM, prefer: /album/,
      accept: function (text) { return mentions(text, artist) && /album/i.test(text); } });
  }
  if (artist) {
    kinds.push({ kind: 'artist', query: artist, name: artist, reject: NOT_ARTIST, prefer: /band|musik|music|sänger|singer|rapper|komponist|composer|gruppe|group/,
      accept: function (text) { return MUSICIAN.test(text); } });
  }
  var failed = 0;
  return Promise.all(kinds.map(function (k) {
    return langs.reduce(function (p, lang) {
      return p.then(function (found) { return found || findArticle(lang, k.query, k.name, k.accept, k.reject, k.prefer); });
    }, Promise.resolve(null)).catch(function (err) {
      // Eine fehlgeschlagene Karte (z. B. 429) soll die anderen nicht verwerfen
      failed++;
      if (failed === kinds.length) throw err;
      return null;
    }).then(function (s) {
      if (!s) return null;
      return {
        kind: k.kind,
        title: s.title,
        description: s.description || '',
        extract: s.extract,
        url: s.content_urls && s.content_urls.desktop ? s.content_urls.desktop.page : '',
        thumb: s.thumbnail ? s.thumbnail.source : '',
        lang: s.lang || ''
      };
    });
  })).then(function (sections) {
    sections = sections.filter(Boolean);
    if (!sections.length && !failed) return null;
    // Unvollständig: anzeigen, aber nicht speichern (beim nächsten Öffnen erneut fragen)
    return { sections: sections, incomplete: failed > 0 };
  });
}

// ------------------------------------------------------------------ Zwischenspeicher

function createSongInfo(options) {
  var dir = options.cacheDir;
  var log = options.logger || console;
  var mem = new Map();
  var pending = new Map();

  function file(key) { return path.join(dir, crypto.createHash('sha1').update(key).digest('hex') + '.json'); }

  // Beim Start aufräumen: alte Einträge und alles über CACHE_MAX_FILES (die ältesten zuerst)
  fs.promises.readdir(dir).then(function (names) {
    return Promise.all(names.map(function (n) {
      var f = path.join(dir, n);
      return fs.promises.stat(f).then(function (st) { return { f: f, t: st.mtimeMs }; }, function () { return null; });
    }));
  }).then(function (list) {
    list = list.filter(Boolean).sort(function (a, b) { return b.t - a.t; });
    var old = Date.now() - HIT_TTL;
    list.forEach(function (e, i) {
      if (i >= CACHE_MAX_FILES || e.t < old) fs.promises.unlink(e.f).catch(function () {});
    });
  }).catch(function () { /* noch kein Verzeichnis */ });

  function remember(key, entry) {
    mem.delete(key);
    mem.set(key, entry);
    if (mem.size > MEM_MAX) mem.delete(mem.keys().next().value);
  }

  function readCache(key) {
    if (mem.has(key)) return Promise.resolve(mem.get(key));
    return fs.promises.readFile(file(key), 'utf8').then(function (txt) {
      var entry = JSON.parse(txt);
      remember(key, entry);
      return entry;
    }).catch(function () { return null; });
  }

  function writeCache(key, entry) {
    remember(key, entry);
    return fs.promises.mkdir(dir, { recursive: true })
      .then(function () { return fs.promises.writeFile(file(key), JSON.stringify(entry)); })
      .catch(function (err) { log.error('[fascia] song info cache: ' + err.message); });
  }

  // Liefert { data } (data = null: nichts gefunden) oder { offline: true }
  function cached(key, load) {
    if (pending.has(key)) return pending.get(key);
    var p = readCache(key).then(function (entry) {
      if (entry && Date.now() - entry.at < (entry.data ? HIT_TTL : MISS_TTL)) return { data: entry.data };
      return load().then(function (data) {
        if (!(data && data.incomplete)) writeCache(key, { at: Date.now(), data: data });
        return { data: data };
      }, function (err) {
        log.error('[fascia] song info: ' + err.message);
        return { offline: true };
      });
    });
    pending.set(key, p);
    p.then(function () { pending.delete(key); });
    return p;
  }

  return {
    lyrics: function (q) {
      if (!q.title) return Promise.resolve({ data: null });
      var key = KEY_VERSION + '|lyrics|' + norm(q.artist) + '|' + norm(q.title) + '|' + Math.round(Number(q.duration) || 0);
      return cached(key, function () { return fetchLyrics(q); });
    },
    info: function (q) {
      if (!q.artist && !q.title) return Promise.resolve({ data: null });
      var key = KEY_VERSION + '|info|' + (q.lang || '') + '|' + norm(q.artist) + '|' + norm(q.title) + '|' + norm(q.album);
      return cached(key, function () { return fetchInfo(q); });
    }
  };
}

module.exports = createSongInfo;
module.exports.norm = norm;
module.exports.clean = clean;
