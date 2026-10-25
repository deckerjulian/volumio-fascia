'use strict';

// Eigener Prozess: liest PCM-Daten (S16LE, mono) aus dem FIFO, den der ALSA-Scope
// (alsa/fascia_scope.c) füllt, und gibt rund 30-mal pro Sekunde eine Zeile mit 64 Bandpegeln
// (0–99, kommagetrennt) auf stdout aus. Die Abtastrate (44,1 oder 48 kHz) steht in der Rate-Datei.
// Läuft getrennt vom Volumio-Prozess, damit das Warten auf den FIFO dort nichts blockiert.

// Node 20 liest Dateien unter Linux über io_uring; ein wartender Lesezugriff auf den FIFO
// kostet damit auf dem Pi ~60 % CPU statt ~3 %. Die Einstellung wirkt nur ab Prozessstart,
// deshalb startet sich der Prozess notfalls selbst mit UV_USE_IO_URING=0 neu.
if (process.env.UV_USE_IO_URING !== '0') {
  var inner = require('child_process').spawn(process.execPath, [__filename].concat(process.argv.slice(2)), {
    stdio: ['ignore', 'inherit', 'inherit'],
    env: Object.assign({}, process.env, { UV_USE_IO_URING: '0' })
  });
  var quit = function () { inner.kill(); process.exit(0); };
  inner.on('exit', function (code) { process.exit(code || 0); });
  process.on('SIGTERM', quit);
  process.on('SIGINT', quit);
  process.on('disconnect', quit);
  return;
}

var fs = require('fs');
var execFileSync = require('child_process').execFileSync;

var FIFO = process.argv[2];
var RATE_FILE = process.argv[3];
var RATE = 44100;
var N = 2048;                        // FFT-Länge (~46 ms bei 44,1 kHz)
var HOP = Math.round(RATE / 30);     // neue Samples pro Ausgabe
var BANDS = 64;
var F_MIN = 35;
var F_MAX = 16000;
var DB_FLOOR = -70;
var DB_CEIL = -12;

// ------------------------------------------------------------------ FFT-Vorberechnung

var LOG2N = Math.log2(N);
var windowFn = new Float64Array(N);
var rev = new Uint32Array(N);
var cosT = new Float64Array(N / 2);
var sinT = new Float64Array(N / 2);

for (var i = 0; i < N; i++) {
  windowFn[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1));
  var r = 0;
  for (var b = 0; b < LOG2N; b++) r = (r << 1) | ((i >> b) & 1);
  rev[i] = r;
}
for (var k = 0; k < N / 2; k++) {
  cosT[k] = Math.cos(2 * Math.PI * k / N);
  sinT[k] = -Math.sin(2 * Math.PI * k / N);
}

// Bänder logarithmisch verteilt; zu schmale Bänder (Bässe) nehmen mindestens einen FFT-Bin
var bandLo = new Uint16Array(BANDS);
var bandHi = new Uint16Array(BANDS);
var bandTilt = new Float64Array(BANDS);

function setupBands(rate) {
  RATE = rate;
  HOP = Math.round(RATE / 30);
  for (var bi = 0; bi < BANDS; bi++) {
    var f0 = F_MIN * Math.pow(F_MAX / F_MIN, bi / BANDS);
    var f1 = F_MIN * Math.pow(F_MAX / F_MIN, (bi + 1) / BANDS);
    var lo = Math.max(1, Math.floor(f0 * N / RATE));
    var hi = Math.max(lo, Math.ceil(f1 * N / RATE) - 1);
    bandLo[bi] = lo;
    bandHi[bi] = Math.min(hi, N / 2 - 1);
    // Musik verliert zu den Höhen hin Energie; +3 dB pro Oktave gleicht das optisch aus
    bandTilt[bi] = 3 * Math.log2(Math.sqrt(f0 * f1) / 1000);
  }
}
setupBands(RATE);

function readRate() {
  if (!RATE_FILE) return;
  try {
    var r = parseInt(fs.readFileSync(RATE_FILE, 'utf8'), 10);
    if (r >= 8000 && r <= 96000 && r !== RATE) setupBands(r);
  } catch (e) { /* noch keine Wiedergabe */ }
}
setInterval(readRate, 1000);

var re = new Float64Array(N);
var im = new Float64Array(N);

function fft() {
  for (var i = 0; i < N; i++) {
    var j = rev[i];
    if (j > i) {
      var t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  for (var size = 2; size <= N; size <<= 1) {
    var half = size >> 1;
    var step = N / size;
    for (var start = 0; start < N; start += size) {
      for (var k = 0; k < half; k++) {
        var a = start + k;
        var b2 = a + half;
        var wr = cosT[k * step];
        var wi = sinT[k * step];
        var xr = re[b2] * wr - im[b2] * wi;
        var xi = re[b2] * wi + im[b2] * wr;
        re[b2] = re[a] - xr;
        im[b2] = im[a] - xi;
        re[a] += xr;
        im[a] += xi;
      }
    }
  }
}

// ------------------------------------------------------------------ Auswertung

var ring = new Float64Array(N);
var ringPos = 0;
var pending = 0;
var carry = null;        // ein halbes Sample vom letzten Datenblock
var lastData = 0;
var silent = true;

function analyse() {
  for (var i = 0; i < N; i++) {
    re[i] = ring[(ringPos + i) % N] * windowFn[i];
    im[i] = 0;
  }
  fft();
  var norm = 4 / N;   // Vollaussteuerung (Sinus) -> 1,0 bei Hann-Fenster
  var out = new Array(BANDS);
  for (var b = 0; b < BANDS; b++) {
    var peak = 0;
    for (var k = bandLo[b]; k <= bandHi[b]; k++) {
      var m = re[k] * re[k] + im[k] * im[k];
      if (m > peak) peak = m;
    }
    var db = 10 * Math.log10(peak * norm * norm + 1e-12) + bandTilt[b];
    var v = (db - DB_FLOOR) / (DB_CEIL - DB_FLOOR);
    out[b] = Math.round(Math.max(0, Math.min(1, v)) * 99);
  }
  process.stdout.write(out.join(',') + '\n');
}

function onData(buf) {
  if (carry) {
    buf = Buffer.concat([carry, buf]);
    carry = null;
  }
  var usable = buf.length & ~1;
  if (usable < buf.length) carry = buf.slice(usable);
  for (var i = 0; i < usable; i += 2) {
    ring[ringPos] = buf.readInt16LE(i) / 32768;
    ringPos = (ringPos + 1) % N;
    if (++pending >= HOP) {
      pending = 0;
      analyse();
    }
  }
  lastData = Date.now();
  silent = false;
}

// Pause/Stopp: MPD schreibt nichts mehr -> einmal "Stille" melden, damit die Balken fallen
setInterval(function () {
  if (!silent && Date.now() - lastData > 200) {
    silent = true;
    ring.fill(0);
    process.stdout.write('0\n');
  }
}, 100);

// ------------------------------------------------------------------ FIFO lesen

function open() {
  var stream;
  readRate();
  // FIFO selbst anlegen (für alle Audio-Benutzer beschreibbar), falls der Scope es nicht tat
  if (!fs.existsSync(FIFO)) {
    try { execFileSync('mkfifo', ['-m', '666', FIFO]); } catch (e) { /* Scope legt ihn an */ }
  }
  try {
    stream = fs.createReadStream(FIFO, { highWaterMark: 8192 });
  } catch (e) {
    return setTimeout(open, 1000);
  }
  var reopened = false;
  function again(delay) {
    if (reopened) return;
    reopened = true;
    stream.destroy();
    setTimeout(open, delay);
  }
  stream.on('data', onData);
  // Der Scope schließt den FIFO bei Pause/Stopp, dann neu öffnen (wartet auf die nächste Wiedergabe)
  stream.on('end', function () { again(200); });
  stream.on('error', function () { again(1000); });
}

process.stdout.on('error', function () { process.exit(0); });
process.on('disconnect', function () { process.exit(0); });

open();
