'use strict';

var libQ = require('kew');
var fs = require('fs');
var os = require('os');
var path = require('path');
var createServer = require('./lib/server');
var execFile = require('child_process').execFile;
var createSpectrumHub = require('./lib/spectrum');
var kiosk = require('./lib/kiosk');
var port80 = require('./lib/port80');

var MPD_CONF = '/etc/mpd.conf';
var ANALYZER_FIFO = '/tmp/touchbar_alsa.fifo';
var ANALYZER_RATE = '/tmp/touchbar_alsa.rate';
var ALSA_CONTRIBUTION = 'touchbar_meter.touchbar_out.conf';
// Frühere Versionen nutzten einen FIFO-Ausgang in MPD; der wird nur noch aufgeräumt
var OLD_MPD_OUTPUT = 'touchbar_analyzer';

module.exports = TouchBarTheme;

function TouchBarTheme(context) {
  this.context = context;
  this.commandRouter = this.context.coreCommand;
  this.logger = this.context.logger;
  this.configManager = this.context.configManager;
  this.server = null;
  this.spectrum = null;
}

// kew-Promise für Volumio aus einem nativen Promise machen
function kewify(promise) {
  var defer = libQ.defer();
  promise.then(function (v) { defer.resolve(v); }, function (e) { defer.reject(e); });
  return defer.promise;
}

function findField(section, id) {
  for (var i = 0; i < section.content.length; i++) {
    if (section.content[i].id === id) return section.content[i];
  }
  return null;
}

function setSelect(field, value) {
  var opt = field.options.filter(function (o) { return o.value === value; })[0] || field.options[0];
  field.value = { value: opt.value, label: opt.label };
}

function selectValue(v) {
  return v && typeof v === 'object' ? v.value : v;
}

// ---------------------------------------------------------------------------
// Lebenszyklus

TouchBarTheme.prototype.onVolumioStart = function () {
  var configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
  this.config = new (require('v-conf'))();
  this.config.loadFile(configFile);
  // Bei einem Update bleibt die gespeicherte Konfiguration erhalten; neue Einstellungen ergänzen
  var defaults = require('./config.json');
  for (var key in defaults) {
    if (this.config.get(key) === undefined) this.config.set(key, defaults[key].value);
  }
  return libQ.resolve();
};

TouchBarTheme.prototype.getConfigurationFiles = function () {
  return ['config.json'];
};

TouchBarTheme.prototype.onStart = function () {
  var self = this;
  self.loadI18n();
  return kewify(self.startServer()
    .then(function () {
      if (self.config.get('kiosk')) return self.applyKiosk(false);
    })
    .then(function () {
      if (self.config.get('port80')) return self.applyPort80(false);
    })
    .then(function () {
      self.cleanupMpdOutput();
      return self.syncAnalyzer();
    })
    .catch(function (err) {
      self.logger.error('[touch_bar_theme] start failed: ' + err.message);
      self.toast('error', self.str('SERVER_ERROR'), err.message);
      throw err;
    }));
};

TouchBarTheme.prototype.onStop = function () {
  var self = this;
  self.cleanupMpdOutput();
  // ALSA-Baustein entfernen, bevor das Plugin (und damit die Bibliothek) verschwindet
  var analyzerOff = self.removeAlsaContribution().catch(function (err) {
    self.logger.error('[touch_bar_theme] removing ALSA contribution failed: ' + err.message);
  });
  var chain = self.config.get('kiosk') ? kiosk.reset().catch(function (err) {
    self.logger.error('[touch_bar_theme] kiosk reset failed: ' + err.message);
  }) : Promise.resolve();
  var web = port80.reset(self.config.get('port')).catch(function (err) {
    self.logger.error('[touch_bar_theme] port 80 reset failed: ' + err.message);
  });
  return kewify(Promise.all([analyzerOff, chain, web]).then(function () { return self.stopServer(); }));
};

TouchBarTheme.prototype.onRestart = function () {
  var self = this;
  return kewify(self.stopServer().then(function () { return self.startServer(); }));
};

// ---------------------------------------------------------------------------
// Webserver

TouchBarTheme.prototype.startServer = function () {
  var self = this;
  self.spectrum = createSpectrumHub({ fifo: ANALYZER_FIFO, rateFile: ANALYZER_RATE, logger: self.logger });
  self.server = createServer({
    root: path.join(__dirname, 'app'),
    logger: self.logger,
    getSettings: function () { return self.getThemeSettings(); },
    onSpectrum: function (req, res) {
      if (!self.config.get('analyzer') || !self.spectrum) {
        res.writeHead(404);
        return res.end();
      }
      self.spectrum.handle(req, res);
    }
  });
  var port = self.config.get('port');
  return self.server.start(port).then(function () {
    self.logger.info('[touch_bar_theme] UI available at ' + self.getPublicUrl());
  });
};

TouchBarTheme.prototype.stopServer = function () {
  if (this.spectrum) this.spectrum.stop();
  this.spectrum = null;
  var s = this.server;
  this.server = null;
  return s ? s.stop() : Promise.resolve();
};

TouchBarTheme.prototype.getThemeSettings = function () {
  var c = this.config;
  return {
    language: this.commandRouter.sharedVars.get('language_code') || 'en',
    accentMode: c.get('accentMode'),
    accentColor: c.get('accentColor'),
    background: c.get('background'),
    marquee: c.get('marquee'),
    keyboard: c.get('keyboard'),
    hideCursor: c.get('hideCursor'),
    idleTimeout: c.get('idleTimeout'),
    clock24h: c.get('clock24h'),
    tabLabels: c.get('tabLabels'),
    panelOpen: c.get('panelOpen'),
    analyzer: c.get('analyzer'),
    analyzerDelayMpd: c.get('analyzerDelayMpd'),
    analyzerDelayOther: c.get('analyzerDelayOther')
  };
};

TouchBarTheme.prototype.getPublicUrl = function () {
  var ip = 'volumio.local';
  var ifaces = os.networkInterfaces();
  Object.keys(ifaces).some(function (name) {
    return (ifaces[name] || []).some(function (a) {
      if ((a.family === 'IPv4' || a.family === 4) && !a.internal) {
        ip = a.address;
        return true;
      }
      return false;
    });
  });
  return 'http://' + ip + (this.config.get('port80') ? '' : ':' + this.config.get('port'));
};

// ---------------------------------------------------------------------------
// Kiosk

TouchBarTheme.prototype.applyKiosk = function (notify) {
  var self = this;
  return kiosk.apply(self.config.get('port')).then(function (result) {
    if (!notify) return;
    if (result === 'missing') self.toast('warning', self.str('PAGE_TITLE'), self.str('KIOSK_MISSING'));
    else self.toast('success', self.str('PAGE_TITLE'), self.str('KIOSK_APPLIED'));
  }).catch(function (err) {
    self.logger.error('[touch_bar_theme] kiosk apply failed: ' + err.message);
    if (notify) self.toast('error', self.str('PAGE_TITLE'), err.message);
  });
};

TouchBarTheme.prototype.resetKiosk = function (notify) {
  var self = this;
  return kiosk.reset().then(function (result) {
    if (notify && result === 'changed') self.toast('success', self.str('PAGE_TITLE'), self.str('KIOSK_RESTORED'));
  }).catch(function (err) {
    self.logger.error('[touch_bar_theme] kiosk reset failed: ' + err.message);
    if (notify) self.toast('error', self.str('PAGE_TITLE'), err.message);
  });
};

TouchBarTheme.prototype.applyPort80 = function (notify) {
  var self = this;
  return port80.apply(self.config.get('port')).then(function () {
    if (notify) self.toast('success', self.str('PAGE_TITLE'), self.str('PORT80_APPLIED'));
  }).catch(function (err) {
    self.logger.error('[touch_bar_theme] port 80 redirect failed: ' + err.message);
    if (notify) self.toast('error', self.str('PAGE_TITLE'), err.message);
  });
};

TouchBarTheme.prototype.restartKiosk = function () {
  var self = this;
  self.toast('info', self.str('PAGE_TITLE'), self.str('KIOSK_RESTARTED'));
  return kewify(kiosk.restart().catch(function (err) {
    self.logger.error('[touch_bar_theme] kiosk restart failed: ' + err.message);
  }));
};

// ---------------------------------------------------------------------------
// Einstellungen

TouchBarTheme.prototype.getUIConfig = function () {
  var self = this;
  var defer = libQ.defer();
  var langCode = self.commandRouter.sharedVars.get('language_code');

  self.commandRouter.i18nJson(
    path.join(__dirname, 'i18n', 'strings_' + langCode + '.json'),
    path.join(__dirname, 'i18n', 'strings_en.json'),
    path.join(__dirname, 'UIConfig.json')
  ).then(function (uiconf) {
    var display = uiconf.sections[0];
    var look = uiconf.sections[1];
    var behave = uiconf.sections[2];

    display.description = String(display.description || '').replace('{url}', self.getPublicUrl());
    findField(display, 'port80').value = self.config.get('port80');
    findField(display, 'kiosk').value = self.config.get('kiosk');
    findField(display, 'port').value = self.config.get('port');

    setSelect(findField(look, 'accentMode'), self.config.get('accentMode'));
    findField(look, 'accentColor').value = self.config.get('accentColor');
    setSelect(findField(look, 'background'), self.config.get('background'));
    findField(look, 'marquee').value = self.config.get('marquee');
    findField(look, 'clock24h').value = self.config.get('clock24h');
    findField(look, 'tabLabels').value = self.config.get('tabLabels');
    findField(look, 'panelOpen').value = self.config.get('panelOpen');
    findField(look, 'analyzer').value = self.config.get('analyzer');
    findField(look, 'analyzerDelayMpd').value = self.config.get('analyzerDelayMpd');
    findField(look, 'analyzerDelayOther').value = self.config.get('analyzerDelayOther');

    findField(behave, 'keyboard').value = self.config.get('keyboard');
    findField(behave, 'hideCursor').value = self.config.get('hideCursor');
    findField(behave, 'idleTimeout').value = self.config.get('idleTimeout');

    defer.resolve(uiconf);
  }).fail(function (err) {
    self.logger.error('[touch_bar_theme] getUIConfig failed: ' + err);
    defer.reject(new Error());
  });

  return defer.promise;
};

TouchBarTheme.prototype.saveDisplay = function (data) {
  var self = this;
  var oldPort = self.config.get('port');
  var port = parseInt(data.port, 10);
  if (!(port >= 1024 && port <= 65535) || port === 3000) port = oldPort;
  var wantKiosk = !!data.kiosk;
  var wantPort80 = !!data.port80;
  var hadPort80 = !!self.config.get('port80');

  self.config.set('port', port);
  self.config.set('kiosk', wantKiosk);
  self.config.set('port80', wantPort80);

  var chain = Promise.resolve();
  if (port !== oldPort) {
    chain = chain
      .then(function () { return self.stopServer(); })
      .then(function () { return self.startServer(); });
  }
  chain = chain.then(function () {
    return wantKiosk ? self.applyKiosk(true) : self.resetKiosk(true);
  }).then(function () {
    if (wantPort80 && (!hadPort80 || port !== oldPort)) return self.applyPort80(true);
    if (!wantPort80 && hadPort80) {
      return port80.reset(oldPort).then(function () {
        self.toast('success', self.str('PAGE_TITLE'), self.str('PORT80_RESTORED'));
      });
    }
  }).catch(function (err) {
    self.logger.error('[touch_bar_theme] saveDisplay failed: ' + err.message);
    self.toast('error', self.str('SERVER_ERROR'), err.message);
  });
  return kewify(chain);
};

TouchBarTheme.prototype.saveAppearance = function (data) {
  var accentMode = selectValue(data.accentMode) === 'fixed' ? 'fixed' : 'cover';
  var background = selectValue(data.background) === 'solid' ? 'solid' : 'blur';
  var color = String(data.accentColor || '').trim();
  if (/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(color)) color = '#' + color;
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) color = this.config.get('accentColor');

  this.config.set('accentMode', accentMode);
  this.config.set('accentColor', color.toLowerCase());
  this.config.set('background', background);
  this.config.set('marquee', !!data.marquee);
  this.config.set('clock24h', !!data.clock24h);
  this.config.set('tabLabels', !!data.tabLabels);
  this.config.set('panelOpen', !!data.panelOpen);
  ['analyzerDelayMpd', 'analyzerDelayOther'].forEach(function (key) {
    var delay = parseInt(data[key], 10);
    this.config.set(key, delay >= 0 ? Math.min(delay, 3000) : 0);
  }, this);
  this.toast('success', this.str('PAGE_TITLE'), this.str('SAVED'));

  var analyzer = !!data.analyzer;
  if (analyzer === this.config.get('analyzer')) return libQ.resolve();
  this.config.set('analyzer', analyzer);
  return kewify(this.syncAnalyzer());
};

TouchBarTheme.prototype.saveBehaviour = function (data) {
  var idle = parseInt(data.idleTimeout, 10);
  if (!(idle >= 0)) idle = 0;
  this.config.set('keyboard', !!data.keyboard);
  this.config.set('hideCursor', !!data.hideCursor);
  this.config.set('idleTimeout', Math.min(idle, 86400));
  this.toast('success', this.str('PAGE_TITLE'), this.str('SAVED'));
  return libQ.resolve();
};

// ---------------------------------------------------------------------------
// Hilfen

TouchBarTheme.prototype.loadI18n = function () {
  var lang = this.commandRouter.sharedVars.get('language_code');
  this.i18nDefaults = require(path.join(__dirname, 'i18n', 'strings_en.json'));
  try {
    this.i18n = require(path.join(__dirname, 'i18n', 'strings_' + lang + '.json'));
  } catch (e) {
    this.i18n = this.i18nDefaults;
  }
};

TouchBarTheme.prototype.str = function (key) {
  if (!this.i18n) this.loadI18n();
  return this.i18n[key] || this.i18nDefaults[key] || key;
};

TouchBarTheme.prototype.toast = function (type, title, message) {
  this.commandRouter.pushToastMessage(type, title, message);
};

// ---------------------------------------------------------------------------
// Band-Analyzer: Abgriff in der ALSA-Kette
//
// Volumio baut /etc/asound.conf aus Bausteinen der Plugins zusammen (package.json:
// has_alsa_contribution, Dateien <ein>.<aus>.conf). Unser Baustein ist ein ALSA-"meter", der den
// Ton unverändert weiterreicht und über alsa/lib/<arch>/libtouchbar_scope.so eine Kopie in einen
// FIFO schreibt. So sehen wir alle Quellen (MPD, AirPlay, Spotify, Bluetooth …). Der Scope
// blockiert nie: ohne Leser oder bei vollem FIFO werden die Daten verworfen.

TouchBarTheme.prototype.scopeLibrary = function () {
  var lib = path.join(__dirname, 'alsa', 'lib', process.arch, 'libtouchbar_scope.so');
  return fs.existsSync(lib) ? lib : null;
};

TouchBarTheme.prototype.alsaContributionDir = function () {
  return this.commandRouter.pluginManager.getConfigurationFile(this.context, 'asound');
};

function alsaSnippet(lib, slave, fifo, rate) {
  return [
    'pcm.touchbar_meter {',
    '    type meter',
    '    slave.pcm "' + slave + '"',
    '    scopes.0 touchbar_scope',
    '}',
    '',
    'pcm_scope.touchbar_scope {',
    '    type touchbar',
    '    fifo "' + fifo + '"',
    '    ratefile "' + rate + '"',
    '}',
    '',
    'pcm_scope_type.touchbar {',
    '    lib "' + lib + '"',
    '}',
    ''
  ].join('\n');
}

// Lädt die Bibliothek einmal in einer abgeschotteten Testkette (Ausgabe ins Leere), bevor sie in
// die echte Kette kommt. Lädt sie nicht, bliebe sonst jede Quelle stumm.
TouchBarTheme.prototype.testScope = function (lib) {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'touchbar-'));
  var conf = path.join(dir, 'test.conf');
  fs.writeFileSync(conf, alsaSnippet(lib, 'null', path.join(dir, 'fifo'), path.join(dir, 'rate'))
    .replace('pcm.touchbar_meter', 'pcm.touchbar_test'));
  return new Promise(function (resolve) {
    execFile('aplay', ['-q', '-D', 'touchbar_test', '-f', 'S16_LE', '-r', '44100', '-c', '2', '-d', '1', '/dev/zero'], {
      timeout: 10000,
      env: Object.assign({}, process.env, { ALSA_CONFIG_PATH: '/usr/share/alsa/alsa.conf:' + conf })
    }, function (err, stdout, stderr) {
      fs.rmSync(dir, { recursive: true, force: true });
      resolve(err ? (String(stderr).trim() || err.message) : null);
    });
  });
};

TouchBarTheme.prototype.updateAlsaConfig = function () {
  var self = this;
  return new Promise(function (resolve) {
    var p = self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'updateALSAConfigFile');
    if (p && typeof p.then === 'function') {
      p.then(function () { resolve(); }, function (err) {
        self.logger.error('[touch_bar_theme] updateALSAConfigFile failed: ' + err);
        resolve();
      });
    } else {
      resolve();
    }
  });
};

TouchBarTheme.prototype.removeAlsaContribution = function () {
  var file = path.join(this.alsaContributionDir(), ALSA_CONTRIBUTION);
  if (!fs.existsSync(file)) return Promise.resolve();
  fs.unlinkSync(file);
  return this.updateAlsaConfig();
};

// Bringt den ALSA-Baustein in Einklang mit dem Schalter. Wirkt ab dem nächsten Öffnen des
// Audiogeräts (nächster Start der Wiedergabe); laufende Wiedergabe wird nicht unterbrochen.
TouchBarTheme.prototype.syncAnalyzer = function () {
  var self = this;
  var dir = self.alsaContributionDir();
  var file = path.join(dir, ALSA_CONTRIBUTION);

  if (!self.config.get('analyzer')) return self.removeAlsaContribution();

  var lib = self.scopeLibrary();
  if (!lib) {
    self.logger.error('[touch_bar_theme] no analyzer library for architecture ' + process.arch);
    return self.removeAlsaContribution();
  }
  return self.testScope(lib).then(function (error) {
    if (error) {
      self.logger.error('[touch_bar_theme] analyzer library test failed, not activating: ' + error);
      self.toast('error', self.str('PAGE_TITLE'), self.str('ANALYZER_FAILED'));
      return self.removeAlsaContribution();
    }
    var snippet = alsaSnippet(lib, 'touchbar_out', ANALYZER_FIFO, ANALYZER_RATE);
    var current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (current === snippet) return;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, snippet);
    return self.updateAlsaConfig();
  }).catch(function (err) {
    self.logger.error('[touch_bar_theme] analyzer setup failed: ' + err.message);
  });
};

// Aufräumen der früheren MPD-Variante: Rückruf abmelden (sonst schreibt Volumio nach dem
// Entladen "undefined" in die mpd.conf) und den Ausgang aus der mpd.conf entfernen. MPD muss
// dafür nicht neu starten; ein ungelesener FIFO-Ausgang stört die Wiedergabe nicht.
TouchBarTheme.prototype.cleanupMpdOutput = function () {
  var self = this;
  var mpd = self.commandRouter.pluginManager.getPlugin('music_service', 'mpd');
  if (mpd && Array.isArray(mpd.registeredCallbacks)) {
    var list = mpd.registeredCallbacks;
    for (var i = list.length - 1; i >= 0; i--) {
      if (list[i] && list[i].plugin === 'touch_bar_theme') list.splice(i, 1);
    }
  }
  var hasOld = false;
  try { hasOld = fs.readFileSync(MPD_CONF, 'utf8').indexOf(OLD_MPD_OUTPUT) !== -1; } catch (e) { /* egal */ }
  if (hasOld) {
    self.commandRouter.executeOnPlugin('music_service', 'mpd', 'createMPDFile', function (err) {
      if (err) self.logger.error('[touch_bar_theme] createMPDFile failed: ' + err);
    });
  }
};

// Falls noch ein Rückruf der früheren Version registriert ist: immer einen String liefern
TouchBarTheme.prototype.getMpdOutput = function () {
  return '';
};
