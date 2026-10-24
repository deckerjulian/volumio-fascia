// Simuliertes Volumio für den Demo-Modus (index.html?demo).
// Bildet die benutzten Socket.IO-Ereignisse mit Beispieldaten nach.
(function () {
  'use strict';

  function cover(c1, c2, label) {
    var svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'>" +
      "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
      "<stop offset='0' stop-color='" + c1 + "'/><stop offset='1' stop-color='" + c2 + "'/></linearGradient></defs>" +
      "<rect width='300' height='300' fill='url(#g)'/>" +
      "<circle cx='215' cy='85' r='62' fill='rgba(255,255,255,.18)'/>" +
      "<circle cx='70' cy='200' r='120' fill='rgba(0,0,0,.12)'/>" +
      "<text x='24' y='272' font-family='Helvetica,Arial,sans-serif' font-size='30' font-weight='700' fill='rgba(255,255,255,.9)'>" + label + "</text></svg>";
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  var ALBUMS = [
    { id: 'nachtfahrt', title: 'Nachtfahrt', artist: 'Lena Morgenrot', art: cover('#ff7a59', '#7b2ff7', 'NACHTFAHRT'), q: ['flac', '24 bit', '96 kHz'],
      tracks: [['Wenn die Lichter der Stadt langsam verschwinden (Extended Mix)', 412], ['Autobahn bei Nacht', 238], ['Neonblau', 201], ['Raststätte 3 Uhr', 264], ['Heimweg', 297]] },
    { id: 'bluehour', title: 'Blue Hour Sessions', artist: 'The Quiet Harbour', art: cover('#2bc0e4', '#1a2a6c', 'BLUE HOUR'), q: ['flac', '16 bit', '44.1 kHz'],
      tracks: [['Low Tide', 245], ['Lantern Light', 312], ['Fog Over the Pier', 278], ['Last Ferry', 356]] },
    { id: 'fernweh', title: 'Fernweh', artist: 'Kiel & Konsorten', art: cover('#f7b733', '#fc4a1a', 'FERNWEH'), q: ['mp3', '', '44.1 kHz'],
      tracks: [['Leuchtturm', 214], ['Möwen über Laboe', 189], ['Sandbank', 233], ['Küstenwind', 251]] },
    { id: 'stilles', title: 'Stilles Wasser', artist: 'Ada Lindqvist', art: cover('#43e97b', '#0f3443', 'STILLES WASSER'), q: ['flac', '24 bit', '192 kHz'],
      tracks: [['Morgennebel', 321], ['Birkenwald', 287], ['Spiegelung', 402]] }
  ];

  var RADIOS = [
    { title: 'Radio Seewind', uri: 'http://radio.example/seewind', art: cover('#00c6ff', '#0072ff', 'SEEWIND') },
    { title: 'Jazz Lounge FM', uri: 'http://radio.example/jazz', art: cover('#c471f5', '#fa71cd', 'JAZZ FM') }
  ];

  function song(album, i) {
    var tr = album.tracks[i];
    return {
      service: 'mpd', type: 'song', uri: 'music-library/' + album.id + '/' + (i + 1),
      title: tr[0], name: tr[0], artist: album.artist, album: album.title, albumart: album.art,
      duration: tr[1], trackType: album.q[0], bitdepth: album.q[1], samplerate: album.q[2]
    };
  }

  function albumSongs(album) { return album.tracks.map(function (_, i) { return song(album, i); }); }

  function albumItem(a) {
    return { service: 'mpd', type: 'folder', title: a.title, artist: a.artist, albumart: a.art, uri: 'albums://' + a.id };
  }

  function radioItem(r) {
    return { service: 'webradio', type: 'webradio', title: r.title, name: r.title, uri: r.uri, albumart: r.art };
  }

  var allSongs = [];
  ALBUMS.forEach(function (a) { allSongs = allSongs.concat(albumSongs(a)); });

  function browse(uri) {
    var lists = [];
    var info = null;
    var prev = '/';
    var m;
    if (uri === 'music-library') {
      lists = [{ items: [
        { service: 'mpd', type: 'folder', title: 'NAS', icon: 'fa fa-server', uri: 'music-library/NAS' },
        { service: 'mpd', type: 'folder', title: 'USB-Stick', icon: 'fa fa-usb', uri: 'music-library/USB' }
      ] }];
    } else if (uri === 'music-library/NAS' || uri === 'albums://') {
      prev = uri === 'albums://' ? '/' : 'music-library';
      lists = [{ items: ALBUMS.map(albumItem) }];
    } else if (uri === 'music-library/USB') {
      prev = 'music-library';
      lists = [{ items: [] }];
    } else if ((m = /^albums:\/\/(.+)$/.exec(uri))) {
      var album = ALBUMS.filter(function (a) { return a.id === m[1]; })[0];
      prev = 'albums://';
      if (album) {
        info = { title: album.title, album: album.title, artist: album.artist, albumart: album.art, uri: uri, type: 'album' };
        lists = [{ items: albumSongs(album) }];
      }
    } else if (uri === 'artists://') {
      var artists = [];
      ALBUMS.forEach(function (a) { if (artists.indexOf(a.artist) === -1) artists.push(a.artist); });
      lists = [{ items: artists.map(function (n) {
        return { service: 'mpd', type: 'folder', title: n, icon: 'fa fa-user', uri: 'artists://' + encodeURIComponent(n) };
      }) }];
    } else if ((m = /^artists:\/\/(.+)$/.exec(uri))) {
      var name = decodeURIComponent(m[1]);
      var own = ALBUMS.filter(function (a) { return a.artist === name; });
      prev = 'artists://';
      lists = [
        { title: 'Alben', items: own.map(albumItem) },
        { title: 'Titel', items: [].concat.apply([], own.map(albumSongs)) }
      ];
    } else if (uri === 'radio') {
      lists = [{ items: RADIOS.map(radioItem) }];
    } else if (uri === 'playlists') {
      lists = [{ items: [{ service: 'mpd', type: 'playlist', title: 'Lieblingssongs', uri: 'playlists/fav' }] }];
    } else if (uri === 'playlists/fav' || uri === 'favourites') {
      prev = uri === 'favourites' ? '/' : 'playlists';
      lists = [{ items: [allSongs[0], allSongs[6], allSongs[10], allSongs[14]] }];
    }
    return { navigation: { prev: { uri: prev }, info: info, lists: lists } };
  }

  function search(q) {
    q = q.toLowerCase();
    var hit = function (s) { return String(s || '').toLowerCase().indexOf(q) !== -1; };
    var lists = [];
    var artists = [];
    ALBUMS.forEach(function (a) { if (hit(a.artist) && artists.indexOf(a.artist) === -1) artists.push(a.artist); });
    if (artists.length) {
      lists.push({ title: 'Künstler', items: artists.map(function (n) {
        return { service: 'mpd', type: 'folder', title: n, icon: 'fa fa-user', uri: 'artists://' + encodeURIComponent(n) };
      }) });
    }
    var albums = ALBUMS.filter(function (a) { return hit(a.title) || hit(a.artist); });
    if (albums.length) lists.push({ title: 'Alben', items: albums.map(albumItem) });
    var songs = allSongs.filter(function (s) { return hit(s.title) || hit(s.artist) || hit(s.album); });
    if (songs.length) lists.push({ title: 'Titel', items: songs });
    return { navigation: { prev: { uri: '/' }, lists: lists } };
  }

  window.createMockSocket = function () {
    var handlers = {};
    var queue = albumSongs(ALBUMS[0]).concat(albumSongs(ALBUMS[1]));
    var st = {
      status: 'play', position: 0, volume: 62, mute: false,
      random: false, repeat: false, repeatSingle: false
    };
    var seekMs = 87000;
    var kitchenVolume = 35;
    var btEnabled = false;
    var seekAt = Date.now();

    function seekNow() {
      return st.status === 'play' ? seekMs + (Date.now() - seekAt) : seekMs;
    }
    function setSeek(ms) { seekMs = ms; seekAt = Date.now(); }

    function fire(ev, data) {
      setTimeout(function () {
        (handlers[ev] || []).forEach(function (fn) { fn(data); });
      }, 40);
    }

    function pushState() {
      var tr = queue[st.position];
      var s = Object.assign({}, st, {
        seek: tr ? Math.round(seekNow()) : 0,
        title: tr ? tr.title || tr.name : '',
        artist: tr ? tr.artist || '' : '',
        album: tr ? tr.album || '' : '',
        albumart: tr ? tr.albumart : '',
        uri: tr ? tr.uri : '',
        duration: tr ? tr.duration || 0 : 0,
        service: tr ? tr.service : '',
        trackType: tr ? (tr.service === 'webradio' ? 'webradio' : tr.trackType) : '',
        samplerate: tr ? tr.samplerate || '' : '',
        bitdepth: tr ? tr.bitdepth || '' : '',
        bitrate: tr && tr.service === 'webradio' ? '320 kbps' : ''
      });
      if (!tr) s.status = 'stop';
      fire('pushState', s);
    }

    function pushQueue() {
      fire('pushQueue', queue.map(function (q) {
        return { uri: q.uri, service: q.service, name: q.title || q.name, artist: q.artist, album: q.album, albumart: q.albumart, duration: q.duration };
      }));
    }

    function go(pos) {
      if (!queue.length) { st.position = 0; st.status = 'stop'; return pushState(); }
      st.position = (pos + queue.length) % queue.length;
      st.status = 'play';
      setSeek(0);
      pushState();
    }

    function toast(msg) { fire('pushToastMessage', { type: 'success', title: msg, message: '' }); }

    var api = {
      on: function (ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); },
      emit: function (ev, data) {
        switch (ev) {
          case 'getState': pushState(); break;
          case 'getQueue': pushQueue(); break;
          case 'getBrowseSources':
            fire('pushBrowseSources', [
              { name: 'Musikbibliothek', uri: 'music-library', plugin_type: '', icon: 'fa fa-folder-open-o' },
              { name: 'Alben', uri: 'albums://', icon: 'fa fa-dot-circle-o' },
              { name: 'Künstler', uri: 'artists://', icon: 'fa fa-microphone' },
              { name: 'Playlists', uri: 'playlists', icon: 'fa fa-list-ol' },
              { name: 'Favoriten', uri: 'favourites', icon: 'fa fa-heart' },
              { name: 'Webradio', uri: 'radio', icon: 'fa fa-microphone', type: 'radio-category' }
            ]);
            break;
          case 'getMultiRoomDevices':
            fire('pushMultiRoomDevices', { list: [
              { id: 'self', name: 'Wohnzimmer', isSelf: true, type: 'device', host: 'http://localhost', volumeAvailable: true, state: { volume: st.volume, mute: st.mute } },
              { id: 'kueche', name: 'Küche', isSelf: false, type: 'device', host: 'http://kueche.local', volumeAvailable: true,
                state: { status: 'play', volume: kitchenVolume, artist: 'Ada Lindqvist', track: 'Morgennebel' } }
            ] });
            break;
          case 'getAudioOutputs':
            fire('pushAudioOutputs', { availableOutputs: [
              { id: 'bt-box', name: 'Bluetooth-Box', type: 'bluetooth', plugin: 'audio_interface/bluetooth', enabled: btEnabled, available: true, volume: 40 }
            ] });
            break;
          case 'getOutputDevices':
            fire('pushOutputDevices', { devices: { active: { id: '5', name: 'D50s' }, available: [{ id: '5', name: 'D50s' }] } });
            break;
          case 'setAudioOutputVolume': if (data.id === 'kueche') kitchenVolume = data.volume; break;
          case 'enableAudioOutput': btEnabled = true; api.emit('getAudioOutputs'); break;
          case 'disableAudioOutput': btEnabled = false; api.emit('getAudioOutputs'); break;
          case 'updateDb': case 'rescanDb': break;
          case 'getMenuItems':
            fire('pushMenuItems', [
              { id: 'mymusic', name: 'Quellen', state: 'volumio.plugin', params: { pluginName: 'miscellanea/my_music' } },
              { id: 'playback_options', name: 'Wiedergabe', state: 'volumio.plugin', params: { pluginName: 'audio_interface/alsa_controller' } },
              { id: 'appearance', name: 'Erscheinungsbild', state: 'volumio.plugin', params: { pluginName: 'miscellanea/appearance' } },
              { id: 'network', name: 'Netzwerk', state: 'volumio.plugin', params: { pluginName: 'system_controller/network' } },
              { id: 'system', name: 'System', state: 'volumio.plugin', params: { pluginName: 'system_controller/system' } },
              { id: 'plugin-manager', name: 'Plugins', state: 'volumio.plugin-manager' }
            ]);
            break;
          case 'browseLibrary': setTimeout(function () { fire('pushBrowseLibrary', browse(data.uri)); }, 150); break;
          case 'search': setTimeout(function () { fire('pushBrowseLibrary', search(data.value)); }, 250); break;
          case 'play':
            if (data && data.value != null) go(+data.value);
            else { if (st.status !== 'play') setSeek(seekMs); st.status = 'play'; pushState(); }
            break;
          case 'pause': setSeek(seekNow()); st.status = 'pause'; pushState(); break;
          case 'stop': setSeek(0); st.status = 'stop'; pushState(); break;
          case 'toggle': api.emit(st.status === 'play' ? 'pause' : 'play'); break;
          case 'next': go(st.position + 1); break;
          case 'prev': if (seekNow() > 3000) { setSeek(0); pushState(); } else go(st.position - 1); break;
          case 'seek': setSeek(data * 1000); pushState(); break;
          case 'volume': st.volume = data; st.mute = false; pushState(); break;
          case 'mute': st.mute = true; pushState(); break;
          case 'unmute': st.mute = false; pushState(); break;
          case 'setRandom': st.random = !!data.value; pushState(); break;
          case 'setRepeat': st.repeat = !!data.value; st.repeatSingle = !!(data.value && data.repeatSingle); pushState(); break;
          case 'playItemsList':
            queue = data.list.slice();
            pushQueue();
            go(data.index || 0);
            break;
          case 'replaceAndPlay':
            if (data.type === 'webradio') queue = [radioItem({ title: data.title, uri: data.uri, art: data.albumart })];
            else {
              var b = browse(data.uri).navigation.lists;
              queue = b.length ? b[b.length - 1].items.filter(function (i) { return i.type === 'song'; }) : [];
            }
            pushQueue();
            go(0);
            break;
          case 'addToQueue':
            if (data.type === 'song' || data.type === 'webradio') queue.push(data);
            else {
              var l = browse(data.uri).navigation.lists;
              if (l.length) queue = queue.concat(l[l.length - 1].items.filter(function (i) { return i.type === 'song'; }));
            }
            pushQueue();
            toast('Zur Warteschlange hinzugefügt');
            break;
          case 'removeFromQueue':
            queue.splice(data.value, 1);
            if (data.value < st.position) st.position--;
            pushQueue();
            pushState();
            break;
          case 'clearQueue': queue = []; st.position = 0; st.status = 'stop'; pushQueue(); pushState(); break;
        }
      }
    };

    // Automatisch zum nächsten Titel wechseln
    setInterval(function () {
      var tr = queue[st.position];
      if (st.status === 'play' && tr && tr.duration && seekNow() >= tr.duration * 1000) {
        if (st.repeat && st.repeatSingle) go(st.position);
        else if (st.position + 1 < queue.length || st.repeat) go(st.position + 1);
        else { st.status = 'stop'; setSeek(0); pushState(); }
      }
    }, 1000);

    setTimeout(function () { fire('connect'); }, 50);
    return api;
  };
})();
