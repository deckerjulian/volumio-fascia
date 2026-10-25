'use strict';

// Schneller Selbsttest ohne Volumio: Webserver, Pfadschutz und Kiosk-Ersetzung.

var assert = require('assert');
var http = require('http');
var path = require('path');
var createServer = require('../lib/server');
var kiosk = require('../lib/kiosk');
var songinfo = require('../lib/songinfo');

function post(port, p, body, type) {
  return new Promise(function (resolve, reject) {
    var req = http.request({ host: '127.0.0.1', port: port, path: p, method: 'POST', headers: { 'Content-Type': type || 'application/json' } }, function (res) {
      var data = '';
      res.on('data', function (c) { data += c; });
      res.on('end', function () { resolve({ status: res.statusCode, body: data }); });
    });
    req.on('error', reject);
    req.end(body);
  });
}

function get(port, p) {
  return new Promise(function (resolve, reject) {
    http.get({ host: '127.0.0.1', port: port, path: p }, function (res) {
      var body = '';
      res.on('data', function (c) { body += c; });
      res.on('end', function () { resolve({ status: res.statusCode, type: res.headers['content-type'], headers: res.headers, body: body }); });
    }).on('error', reject);
  });
}

// --- Kiosk-Skript (Aufbau wie beim Touch-Display-Plugin von Volumio 3)
var original = [
  '#!/bin/bash',
  'while true; do timeout 3 bash -c "</dev/tcp/127.0.0.1/3000" >/dev/null 2>&1 && break; done',
  'sed -i \'s/"exited_cleanly":false/"exited_cleanly":true/\' /data/volumiokiosk/Default/Preferences',
  '/usr/bin/chromium-browser \\',
  '    --kiosk \\',
  '    --user-data-dir=\'/data/volumiokiosk\' \\',
  '    http://localhost:3000',
  ''
].join('\n');

var patched = kiosk.patch(original, 4005);
assert.ok(patched.indexOf('http://localhost:4005/?kiosk=touchbar') !== -1, 'URL ersetzt');
assert.ok(patched.indexOf('/dev/tcp/127.0.0.1/4005') !== -1, 'Warteschleife ersetzt');
assert.ok(patched.indexOf('localhost:3000') === -1, 'keine alte URL mehr');
assert.strictEqual(kiosk.patch(patched, 4005), patched, 'idempotent');
assert.ok(kiosk.patch(patched, 4100).indexOf('http://localhost:4100/?kiosk=touchbar') !== -1, 'Portwechsel');
assert.strictEqual(kiosk.restore(patched), original, 'Wiederherstellung');
assert.strictEqual(kiosk.restore(original), original, 'fremde Skripte bleiben unberührt');
var nowPlaying = original.replace('http://localhost:3000', 'http://localhost:4004');
assert.strictEqual(kiosk.restore(nowPlaying), nowPlaying, 'andere Kiosk-Plugins bleiben unberührt');

// --- Titel für die Suche nach Songtext und Infos
assert.strictEqual(songinfo.clean('Let It Be - Remastered 2009'), 'Let It Be');
assert.strictEqual(songinfo.clean('Get Lucky (Radio Edit)'), 'Get Lucky');
assert.strictEqual(songinfo.norm('Beyoncé & Jay-Z'), 'beyonce and jay z');
assert.strictEqual(songinfo.norm('Группа крови'), 'группа крови', 'nicht-lateinische Titel bleiben erhalten');

// --- Webserver
var themeSettings = { accentMode: 'cover', lyricsInline: false };
var asked = null;
var server = createServer({
  root: path.join(__dirname, '..', 'app'),
  proxy: false,
  getSettings: function () { return themeSettings; },
  onSettings: function (patch) { themeSettings.lyricsInline = !!patch.lyricsInline; },
  songInfo: {
    lyrics: function (q) { asked = q; return Promise.resolve({ data: { synced: '[00:01.00] Hallo' } }); },
    info: function () { return Promise.resolve({ data: null }); }
  }
});

server.start(0).then(function (port) {
  return Promise.all([
    get(port, '/'),
    get(port, '/app.js'),
    get(port, '/api/settings'),
    get(port, '/../package.json'),
    get(port, '/%2e%2e/index.js'),
    get(port, '/fonts/inter-400.woff2')
  ]).then(function (r) {
    assert.strictEqual(r[0].status, 200);
    assert.ok(/text\/html/.test(r[0].type));
    assert.strictEqual(r[1].status, 200);
    assert.deepStrictEqual(JSON.parse(r[2].body), { accentMode: 'cover', lyricsInline: false });
    assert.strictEqual(r[3].status, 404, 'kein Zugriff außerhalb von app/');
    assert.strictEqual(r[4].status, 404, 'kein Zugriff außerhalb von app/ (kodiert)');
    assert.strictEqual(r[5].type, 'font/woff2');
    return Promise.all([
      post(port, '/api/settings', JSON.stringify({ lyricsInline: true })),
      post(port, '/api/settings', 'kein json'),
      post(port, '/app.js', ''),
      post(port, '/api/settings', JSON.stringify({ lyricsInline: false }), 'text/plain'),
      get(port, '/api/lyrics?artist=A&title=B&duration=120'),
      get(port, '/api/info?artist=A')
    ]);
  }).then(function (r) {
    assert.strictEqual(JSON.parse(r[0].body).lyricsInline, true, 'Einstellung per POST');
    assert.strictEqual(r[1].status, 400);
    assert.strictEqual(r[2].status, 405, 'sonst kein POST');
    assert.strictEqual(r[3].status, 415, 'nur JSON (keine Formulare fremder Seiten)');
    assert.strictEqual(themeSettings.lyricsInline, true);
    assert.strictEqual(JSON.parse(r[4].body).data.synced, '[00:01.00] Hallo');
    assert.strictEqual(asked.title, 'B');
    assert.strictEqual(asked.duration, '120');
    assert.deepStrictEqual(JSON.parse(r[5].body), { data: null });
  });
}).then(function () {
  return server.stop();
}).then(function () {
  // /api/host: Volumios Adresse bekommt Volumios Port, damit dessen Oberfläche nicht über Port 80
  // (Theme) zu verbinden versucht
  var fake = http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ host: 'http://192.168.1.5' }));
  });
  return new Promise(function (resolve) { fake.listen(0, resolve); }).then(function () {
    var fakePort = fake.address().port;
    var proxied = createServer({
      root: path.join(__dirname, '..', 'app'),
      volumioHost: '127.0.0.1',
      volumioPort: fakePort,
      getSettings: function () { return {}; }
    });
    return proxied.start(0).then(function (port) {
      return get(port, '/api/host');
    }).then(function (r) {
      assert.strictEqual(r.status, 200);
      assert.strictEqual(JSON.parse(r.body).host, 'http://192.168.1.5:' + fakePort);
      assert.strictEqual(r.headers['access-control-allow-origin'], '*');
      fake.close();
      return proxied.stop();
    });
  });
}).then(function () {
  console.log('Smoke-Test OK');
}).catch(function (err) {
  console.error(err);
  process.exit(1);
});
