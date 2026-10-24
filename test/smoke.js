'use strict';

// Schneller Selbsttest ohne Volumio: Webserver, Pfadschutz und Kiosk-Ersetzung.

var assert = require('assert');
var http = require('http');
var path = require('path');
var createServer = require('../lib/server');
var kiosk = require('../lib/kiosk');

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

// --- Webserver
var server = createServer({
  root: path.join(__dirname, '..', 'app'),
  proxy: false,
  getSettings: function () { return { accentMode: 'cover' }; }
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
    assert.deepStrictEqual(JSON.parse(r[2].body), { accentMode: 'cover' });
    assert.strictEqual(r[3].status, 404, 'kein Zugriff außerhalb von app/');
    assert.strictEqual(r[4].status, 404, 'kein Zugriff außerhalb von app/ (kodiert)');
    assert.strictEqual(r[5].type, 'font/woff2');
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
