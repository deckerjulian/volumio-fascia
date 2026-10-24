'use strict';

// Verteilt die Bandpegel des Analyse-Prozesses per Server-Sent Events an alle offenen Anzeigen.
// Der Prozess läuft nur, solange mindestens eine Anzeige verbunden ist.

var path = require('path');
var fork = require('child_process').fork;

function createSpectrumHub(options) {
  var log = options.logger || console;
  var clients = [];
  var child = null;
  var stopTimer = null;
  var keepAlive = null;
  var buffer = '';

  function broadcast(line) {
    var msg = 'data: ' + line + '\n\n';
    clients.forEach(function (res) { res.write(msg); });
  }

  function startChild() {
    if (child) return;
    buffer = '';
    child = fork(path.join(__dirname, 'spectrum-worker.js'), [options.fifo, options.rateFile || ''], {
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      env: Object.assign({}, process.env, { UV_USE_IO_URING: '0' })
    });
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function (chunk) {
      buffer += chunk;
      var lines = buffer.split('\n');
      buffer = lines.pop();
      // Bei einem Rückstau nur die neueste Zeile weitergeben
      if (lines.length) broadcast(lines[lines.length - 1]);
    });
    child.stderr.on('data', function (d) { log.error('[touch_bar_theme] analyzer: ' + String(d).trim()); });
    child.on('exit', function () {
      child = null;
      // Unerwartet beendet, aber noch jemand verbunden: neu starten
      if (clients.length) setTimeout(startChild, 2000);
    });
    keepAlive = keepAlive || setInterval(function () {
      clients.forEach(function (res) { res.write(': ping\n\n'); });
    }, 15000);
  }

  function stopChild() {
    clearInterval(keepAlive);
    keepAlive = null;
    if (!child) return;
    var c = child;
    child = null;
    c.removeAllListeners('exit');
    c.kill();
  }

  return {
    handle: function (req, res) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      });
      res.write('retry: 2000\n\n');
      clients.push(res);
      clearTimeout(stopTimer);
      startChild();
      req.on('close', function () {
        clients = clients.filter(function (r) { return r !== res; });
        if (!clients.length) stopTimer = setTimeout(stopChild, 5000);
      });
    },
    stop: function () {
      clearTimeout(stopTimer);
      clients.forEach(function (res) { res.end(); });
      clients = [];
      stopChild();
    }
  };
}

module.exports = createSpectrumHub;
