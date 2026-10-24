'use strict';

// Kleiner Webserver ohne externe Abhängigkeiten:
// - liefert die Oberfläche aus app/ aus
// - /api/settings liefert die Theme-Einstellungen
// - alles andere (Cover unter /albumart, Quellen-Icons, socket.io-Client) wird an Volumio
//   durchgereicht. So stammen Cover vom selben Origin und die Akzentfarbe lässt sich per
//   Canvas daraus berechnen.

var http = require('http');
var fs = require('fs');
var path = require('path');

var MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

var PASS_HEADERS = ['content-type', 'content-length', 'cache-control', 'etag', 'last-modified', 'expires', 'location'];

function createServer(options) {
  var root = path.resolve(options.root);
  var volumioHost = options.volumioHost || 'localhost';
  var volumioPort = options.volumioPort || 3000;
  var log = options.logger || console;
  var server = null;

  function sendJson(res, data) {
    var body = JSON.stringify(data);
    res.writeHead(200, {
      'Content-Type': MIME['.json'],
      'Content-Length': Buffer.byteLength(body),
      'Cache-Control': 'no-store'
    });
    res.end(body);
  }

  function proxy(req, res) {
    var upstream = http.request({
      host: volumioHost,
      port: volumioPort,
      path: req.url,
      method: req.method,
      headers: { accept: req.headers.accept || '*/*' }
    }, function (upstreamRes) {
      var headers = {};
      PASS_HEADERS.forEach(function (h) {
        if (upstreamRes.headers[h]) headers[h] = upstreamRes.headers[h];
      });
      res.writeHead(upstreamRes.statusCode || 502, headers);
      upstreamRes.pipe(res);
    });
    upstream.setTimeout(15000, function () { upstream.destroy(new Error('timeout')); });
    upstream.on('error', function () {
      if (!res.headersSent) res.writeHead(502);
      res.end();
    });
    upstream.end();
  }

  function serveStatic(req, res, pathname, fallback) {
    var rel;
    try {
      rel = decodeURIComponent(pathname);
    } catch (e) {
      res.writeHead(400);
      return res.end();
    }
    if (rel === '/' || rel === '') rel = '/index.html';
    var file = path.normalize(path.join(root, rel));
    if (file !== root && file.indexOf(root + path.sep) !== 0) {
      res.writeHead(404);
      return res.end();
    }
    fs.stat(file, function (err, stat) {
      if (err || !stat.isFile()) return fallback();
      var ext = path.extname(file).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Content-Length': stat.size,
        // Schriften ändern sich nie, alles andere soll nach einem Update sofort neu geladen werden
        'Cache-Control': ext === '.woff2' ? 'public, max-age=31536000, immutable' : 'no-cache'
      });
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(file).pipe(res);
    });
  }

  function handle(req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405);
      return res.end();
    }
    var pathname = req.url.split('?')[0];
    if (pathname === '/api/settings') return sendJson(res, options.getSettings());
    if (pathname === '/api/spectrum') {
      if (options.onSpectrum) return options.onSpectrum(req, res);
      res.writeHead(404);
      return res.end();
    }
    serveStatic(req, res, pathname, function () {
      if (options.proxy === false) {
        res.writeHead(404);
        return res.end();
      }
      proxy(req, res);
    });
  }

  return {
    start: function (port) {
      return new Promise(function (resolve, reject) {
        server = http.createServer(handle);
        server.once('error', reject);
        server.listen(port, function () {
          server.removeListener('error', reject);
          server.on('error', function (err) { log.error('[touch_bar_theme] server error: ' + err.message); });
          resolve(server.address().port);
        });
      });
    },
    stop: function () {
      return new Promise(function (resolve) {
        if (!server) return resolve();
        var s = server;
        server = null;
        s.close(function () { resolve(); });
        // Offene Keep-Alive-Verbindungen (Kiosk-Browser) nicht abwarten
        setTimeout(resolve, 1500);
      });
    }
  };
}

module.exports = createServer;
