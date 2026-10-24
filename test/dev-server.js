'use strict';

// Lokaler Entwicklungsserver.
//   npm run dev                         -> http://localhost:4005/?demo  (ohne Volumio)
//   VOLUMIO=volumio.local npm run dev   -> http://localhost:4005/?volumio=http://volumio.local:3000

var path = require('path');
var createServer = require('../lib/server');
var defaults = require('../config.json');

var settings = { language: process.env.LANG_CODE || 'de' };
Object.keys(defaults).forEach(function (k) { settings[k] = defaults[k].value; });

var port = Number(process.env.PORT) || 4005;
var server = createServer({
  root: path.join(__dirname, '..', 'app'),
  volumioHost: process.env.VOLUMIO || 'localhost',
  volumioPort: 3000,
  getSettings: function () { return settings; }
});

server.start(port).then(function (p) {
  console.log('Touch Bar Theme: http://localhost:' + p + '/?demo');
  if (process.env.VOLUMIO) {
    console.log('Mit Volumio:     http://localhost:' + p + '/?volumio=http://' + process.env.VOLUMIO + ':3000');
  }
});
