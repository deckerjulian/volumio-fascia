'use strict';

// Theme unter http://volumio.local (Port 80) anbieten.
// Volumio leitet Port 80 per iptables auf seine Oberfläche (Port 3000) um; die Regel setzt
// iptables.service beim Start. Eine systemd-Ergänzung (Drop-in) biegt sie auf das Theme um.
// Volumios eigene Oberfläche bleibt unter Port 3000 erreichbar (auch für die eingebetteten
// Einstellungsseiten). Benutzt nur Befehle, die der Benutzer volumio ohne Passwort darf.

var exec = require('child_process').exec;
var execFile = require('child_process').execFile;

var DROPIN_DIR = '/etc/systemd/system/iptables.service.d';
var DROPIN = DROPIN_DIR + '/touchbar.conf';
var VOLUMIO_PORT = 3000;

function run(cmd) {
  return new Promise(function (resolve, reject) {
    exec(cmd, { timeout: 20000 }, function (err, stdout) {
      if (err) return reject(err);
      resolve(stdout);
    });
  });
}

function writeRoot(file, content) {
  return new Promise(function (resolve, reject) {
    var child = execFile('sudo', ['-n', '/usr/bin/tee', file], { timeout: 20000 }, function (err) {
      if (err) return reject(err);
      resolve();
    });
    child.stdin.end(content);
  });
}

function rule(action, port) {
  return '/sbin/iptables -t nat ' + action + ' PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports ' + port;
}

// Entfernt vorhandene Umleitungen auf beide Ports, dann genau eine neue Regel
function dropin(themePort, target) {
  return [
    '# Touch Bar Theme: Port 80 -> ' + target,
    '[Service]',
    'ExecStartPre=-' + rule('-D', VOLUMIO_PORT),
    'ExecStartPre=-' + rule('-D', themePort),
    'ExecStart=',
    'ExecStart=' + rule('-I', target),
    ''
  ].join('\n');
}

function reload() {
  return run('sudo -n /bin/systemctl daemon-reload')
    .then(function () { return run('sudo -n /bin/systemctl restart iptables.service'); });
}

module.exports = {
  apply: function (themePort) {
    var wanted = dropin(themePort, themePort);
    var current = null;
    try { current = require('fs').readFileSync(DROPIN, 'utf8'); } catch (e) { /* noch nicht eingerichtet */ }
    if (current === wanted) return Promise.resolve();  // gilt schon (auch nach jedem Neustart)
    return run('sudo -n /usr/bin/mkdir -p ' + DROPIN_DIR)
      .then(function () { return writeRoot(DROPIN, dropin(themePort, themePort)); })
      .then(reload);
  },
  // Zurück auf Volumios Oberfläche; die Ergänzung entfernt erst danach die eigene Regel
  reset: function (themePort) {
    return run('test -f ' + DROPIN).then(function () {
      return writeRoot(DROPIN, dropin(themePort, VOLUMIO_PORT))
        .then(reload)
        .then(function () { return run('sudo -n /bin/rm -f ' + DROPIN); })
        .then(function () { return run('sudo -n /bin/systemctl daemon-reload'); });
    }, function () { /* nichts eingerichtet */ });
  },
  dropin: dropin
};
