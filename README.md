# Touch Bar Theme for Volumio

A touch-first user interface for **Volumio 3/4** on narrow bar displays such as **320×1480**
panels — in landscape (1480×320) and portrait (320×1480). It also scales to similar bar displays
(e.g. 400×1280), works on computers and tablets, and ships with a real-time **band analyzer** that
works for every audio source.

[Deutsche Version](README.de.md)

![Player on a 1480×320 display](docs/screenshots/device-player.png)

<sub>All device screenshots were rendered on a Raspberry Pi 5 running Volumio 4 at the display's
native 1480×320 resolution, using the built-in demo mode (generated cover art, no real library).</sub>

## Screenshots

| | |
| --- | --- |
| ![Queue](docs/screenshots/device-queue.png) | ![Library](docs/screenshots/device-library.png) |
| Queue in the side panel | Library with album list |
| ![Live filter](docs/screenshots/device-filter.png) | ![Zones & outputs](docs/screenshots/device-zones.png) |
| Live filter with the on-screen keyboard | Zones & outputs |
| ![Settings](docs/screenshots/device-settings.png) | ![Idle screen](docs/screenshots/device-idle.png) |
| Volumio settings, library update, restart | Idle screen |

<table>
  <tr>
    <td width="22%"><img src="docs/screenshots/portrait.png" alt="Portrait 320×1480"></td>
    <td><img src="docs/screenshots/desktop.png" alt="Desktop browser"></td>
  </tr>
  <tr>
    <td>Portrait (320×1480)</td>
    <td>Computer browser at <code>http://volumio.local</code></td>
  </tr>
</table>

## Features

- **Player** – large cover, scrolling title, quality badge (`FLAC · 24/96`), draggable position
  slider, big touch targets (play 76 px, everything else ≥ 44 px), shuffle, repeat (off → all →
  one), volume
- **Band analyzer** – 64 bands (35 Hz–16 kHz) of the real audio signal behind the position slider,
  for **every source**: library, web radio, AirPlay, Spotify, Bluetooth … The played part glows in
  the accent colour
- **Gestures** – swipe the cover left/right for next/previous; long-press (or ⋮) on a list entry
  opens its action menu right next to your finger
- **Queue, library and search** in a collapsible side panel (icons only, labels optional);
  every library list has a **live filter** that ignores accents (“beyonce” finds “Beyoncé”)
- **On-screen keyboard** sized for the bar display (QWERTZ over the player in landscape,
  alphabetical 7-column layout in portrait); computers use the real keyboard
- **Zones & outputs** behind the speaker icon – this device, other Volumio devices on the network
  and switchable outputs, each with its own volume
- **Volumio settings** behind the gear icon – sources, playback, appearance, network, system,
  plugins, library update/rescan, restart and shut down. Volumio’s own pages are embedded
- **Accent colour** taken from the album art; brighter blurred album-art background
- **Served at `http://volumio.local`** – Volumio’s own UI stays at `http://volumio.local:3000`
- **Idle screen** with a dimmed, centred clock while nothing is playing
- Kiosk-friendly: hidden cursor, no zoom, no context menu, no overscroll
- No build step, no runtime dependencies besides Volumio’s usual `kew` and `v-conf`

## Requirements

- Volumio 3 or 4 (tested on **Volumio 4.231**, Raspberry Pi 5, 320×1480 DSI display rotated to
  landscape)
- The official **Touch Display** plugin for the local screen (rotation is configured there)
- Prebuilt analyzer libraries are included for `armhf` (all Raspberry Pis with the default 32-bit
  Volumio image), `arm64` and `x64`

## Installation

1. Enable SSH on the Volumio device (`http://volumio.local:3000/dev` → SSH).
2. Copy the plugin to the device, including `node_modules`:
   ```sh
   git clone https://github.com/deckerjulian/volumio-touch-bar-theme.git
   cd volumio-touch-bar-theme
   npm install --omit=dev
   scp -r . volumio@volumio.local:/home/volumio/touch_bar_theme
   ```
3. Install it on the device:
   ```sh
   ssh volumio@volumio.local
   cd ~/touch_bar_theme
   volumio plugin install
   ```
4. Enable **Touch Bar Theme** under *Plugins → Installed plugins*. The display switches to the
   theme automatically.

To update later, copy the new files and run `volumio plugin update` on the device.

## Settings

| Setting | Default | Meaning |
| --- | --- | --- |
| Use on the touch display | on | The kiosk shows the theme instead of Volumio’s UI |
| Show theme at volumio.local | on | Port 80 serves the theme; Volumio stays on port 3000 |
| Port | 4005 | Port of the theme’s web server |
| Accent colour | from album art | or a fixed colour |
| Fixed / fallback colour | `#3ddc97` | also used when no colour can be derived |
| Background | blurred album art | “Plain dark” is lighter on slow hardware |
| Scrolling text | on | long titles scroll instead of being cut off |
| 24-hour clock | on | |
| Menu icon labels | off | show names below the panel icons |
| Band analyzer | on | takes effect the next time playback starts |
| Analyzer delay library & web radio | 0 ms | only needed if the bars run ahead of the sound |
| Analyzer delay AirPlay, Spotify & co. | 0 ms | separate value for sources outside MPD |
| Built-in on-screen keyboard | on | touch devices only |
| Hide mouse cursor | on | kiosk only |
| Idle screen after | 300 s | 0 = off |

Appearance changes reach the display within 20 seconds without a restart.

## How it works

| Path | Purpose |
| --- | --- |
| `index.js` | Volumio plugin: lifecycle, settings, kiosk, port 80, analyzer setup |
| `lib/server.js` | Small web server (Node built-ins only); proxies `/albumart` etc. to Volumio |
| `lib/kiosk.js` | Points the Touch Display kiosk at the theme and restores it |
| `lib/port80.js` | systemd drop-in that redirects port 80 to the theme |
| `lib/spectrum.js`, `lib/spectrum-worker.js` | Reads the analyzer FIFO, FFT, Server-Sent Events |
| `alsa/touchbar_scope.c`, `alsa/lib/*` | ALSA `meter` scope and prebuilt libraries |
| `app/` | The UI (plain HTML/CSS/JS), talks to Volumio over Socket.IO |
| `app/demo.js` | Simulated Volumio for the demo mode |

### Changes the plugin makes to the system

All of them are reverted when the plugin is disabled or uninstalled.

- **Kiosk**: replaces `http://localhost:3000` in `/opt/volumiokiosk.sh` with the theme URL.
- **Port 80**: adds `/etc/systemd/system/iptables.service.d/touchbar.conf` so Volumio’s existing
  port-80 redirect points to the theme instead of port 3000.
- **Analyzer**: registers an ALSA contribution through Volumio’s official mechanism
  (`has_alsa_contribution`), giving the chain `volumio → touchbar_meter → volumioOutput`.
  ALSA’s `meter` plugin passes the audio through unchanged; the scope copies it into a FIFO and
  drops data instead of ever blocking playback. Before activation the library is load-tested in an
  isolated chain that plays into `null`; if that fails, the audio chain is left untouched. Because
  `meter` follows the DAC’s hardware pointer, the bars are in sync without any delay.

## Development

```sh
npm install
npm test                            # smoke test (web server, path guard, kiosk patching)
npm run dev                         # http://localhost:4005/?demo – no Volumio needed
VOLUMIO=volumio.local npm run dev   # against a real Volumio on the network
npm run build-alsa                  # rebuild the ALSA scope for all architectures (needs Docker)
```

Set the browser’s device emulation to 1480×320 or 320×1480. URL parameters: `demo`,
`volumio=http://host:3000`, `accentMode=fixed`, `accentColor=%23ff8800`, `background=solid`.

## Troubleshooting

- **Rotary encoders or GPIO buttons stop working after restarting Volumio** with
  `systemctl restart volumio`: GPIO plugins such as *Rotary Encoder II* don’t clean up their
  device-tree overlays in that case. Reboot the Pi (or disable and re-enable that plugin).
- **The theme doesn’t open at `https://volumio.local`**: Volumio has no HTTPS; use `http://`.
- **No analyzer bars**: check the plugin log (`journalctl -u volumio | grep touch_bar`). If the
  load test failed, the analyzer stays off and playback is unaffected.

## License

MIT, see [LICENSE](LICENSE). Bundled: Inter font (SIL OFL 1.1, `app/fonts/OFL.txt`) and
Material Design icon paths (Apache 2.0).
