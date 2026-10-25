'use strict';

// Anbindung an das Touch-Display-Plugin von Volumio.
// Dessen Kiosk-Skript startet Chromium mit http://localhost:3000. Wir tauschen diese URL gegen
// die des Themes aus (und warten beim Start auf unseren Port statt auf 3000). Die Marke
// "?kiosk=fascia" macht unsere URL eindeutig, damit wir beim Zurücksetzen nur unsere eigene
// Änderung rückgängig machen. Bis Version 1.x hieß das Plugin "Touch Bar Theme" und markierte mit
// "?kiosk=touchbar"; solche URLs gelten ebenfalls als unsere (Umstieg ohne Reste).

var fs = require('fs');
var exec = require('child_process').exec;
var execFile = require('child_process').execFile;

var SCRIPT = '/opt/volumiokiosk.sh';
var MARK = '?kiosk=fascia';
var DEFAULT_PORT = 3000;

var URL_RE = /http:\/\/(?:localhost|127\.0\.0\.1):\d+\/?(?:\?kiosk=(?:fascia|touchbar))?(?=[\s"'\\]|$)/gm;
var OWN_URL_RE = /http:\/\/localhost:\d+\/\?kiosk=(?:fascia|touchbar)/g;
var OWN_MARK_RE = /\?kiosk=(?:fascia|touchbar)\b/;
var WAIT_RE = /\/dev\/tcp\/127\.0\.0\.1\/\d+/g;

function themeUrl(port) {
  return 'http://localhost:' + port + '/' + MARK;
}

function patch(content, port) {
  return content
    .replace(URL_RE, themeUrl(port))
    .replace(WAIT_RE, '/dev/tcp/127.0.0.1/' + port);
}

function restore(content) {
  if (!OWN_MARK_RE.test(content)) return content;
  return content
    .replace(OWN_URL_RE, 'http://localhost:' + DEFAULT_PORT)
    .replace(WAIT_RE, '/dev/tcp/127.0.0.1/' + DEFAULT_PORT);
}

function run(cmd) {
  return new Promise(function (resolve, reject) {
    exec(cmd, { timeout: 20000 }, function (err, stdout) {
      if (err) return reject(err);
      resolve(stdout);
    });
  });
}

// Volumio erlaubt dem Benutzer "volumio" nur ausgewählte Befehle ohne Passwort, darunter tee
// und systemctl (nicht cp). tee überschreibt nur den Inhalt, Rechte und Besitzer bleiben.
// -n: lieber sofort scheitern als auf eine Passwortabfrage warten.
function writeScript(content) {
  return new Promise(function (resolve, reject) {
    var child = execFile('sudo', ['-n', '/usr/bin/tee', SCRIPT], { timeout: 20000 }, function (err) {
      if (err) return reject(err);
      resolve();
    });
    child.stdin.end(content);
  });
}

function restartKiosk() {
  return run('systemctl is-active --quiet volumio-kiosk && sudo -n /bin/systemctl restart volumio-kiosk || true');
}

// Ergebnis: 'missing' (kein Touch-Display-Plugin), 'unchanged' oder 'changed'
function update(transform) {
  var content;
  try {
    content = fs.readFileSync(SCRIPT, 'utf8');
  } catch (e) {
    return Promise.resolve('missing');
  }
  var next = transform(content);
  if (next === content) return Promise.resolve('unchanged');
  return writeScript(next)
    .then(restartKiosk)
    .then(function () { return 'changed'; });
}

module.exports = {
  SCRIPT: SCRIPT,
  themeUrl: themeUrl,
  patch: patch,
  restore: restore,
  apply: function (port) {
    return update(function (c) { return patch(c, port); });
  },
  reset: function () {
    return update(restore);
  },
  restart: restartKiosk
};
