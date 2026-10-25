# Changelog

## 2.0.0 – Fascia

- New name: **Fascia** (plugin ID `fascia`, repository `volumio-fascia`). Replaces the “Touch Bar
  Theme”: uninstall it first; Fascia takes over its settings and cleans up its kiosk URL, port 80
  redirect and ALSA contribution
- Lyrics and song info: two buttons at the left of the control bar open time-synced lyrics
  (LRCLIB; tap a line to jump there) and Wikipedia info on track, album and artist. Optionally
  the current line runs above the position slider, over the analyzer (setting and toggle in the
  control bar). Looked up by the Pi and cached under /data
- New display style “VFD”: looks like a vacuum fluorescent display (aqua glow on black, fine
  grid, segment analyzer, monochrome dot-matrix cover); the analyzer style can also be chosen on
  its own; VFD segments are the default analyzer style
- Phones (e.g. the Volumio iOS app): portrait layout uses the full screen width, the cover grows
  with the free space, and the layout respects the notch and home indicator
- New setting “Side panel expanded” chooses whether the panel starts expanded or collapsed
  (default: collapsed as before)
- The side panel is see-through; a new setting chooses its opacity. Player animations pause
  while the settings menu is open
- Settings changes reach every display immediately (kiosk, phone, iOS app) instead of within 20 s
- Removed the analyzer delay settings: the analyzer taps the audio right before the DAC and is
  always in sync
- Panel and settings menu are tinted with the dynamic accent colour
- Bar display: the side panel has the same edge spacing as the cover; play/pause sits centred
  under the position slider (shuffle/repeat to its left, volume to its right)
- Phones and portrait tablets open the list straight to the large view (the middle step left
  room for just one row); long tile names wrap onto two lines; toasts show above dialogs
- Bar layout with an open panel on wider screens (iPhone landscape, 1920×720): only the playback
  buttons are shown instead of overlapping controls
- Fix: in portrait the queue scrolled past the current track
- README: new screenshots with real albums and a GIF of a track change
- Fix: Volumio pages (settings inside the theme, Volumio UI on port 3000) hung on the loading
  spinner while the theme was served on port 80; the theme server now answers `/api/host` so
  Volumio's UI connects to port 3000

## 1.1.0

- Band analyzer behind the position slider for every source (library, web radio, AirPlay,
  Spotify, Bluetooth …), tapped from the ALSA chain via a small `meter` scope
- Zones & outputs (multiroom devices, switchable outputs, per-device volume)
- Volumio settings menu inside the theme, incl. library update/rescan, restart and shut down
- Live filter field in every library list
- Collapsible side panel, icon-only tabs (labels optional)
- Layout for computers and landscape tablets; the theme is served at `http://volumio.local`
- Smoother position slider, brighter blurred album-art background
- Idle screen shows a centred clock

## 1.0.0

- First version: portrait and landscape layouts for 320×1480 bar displays, queue, library,
  search with on-screen keyboard, kiosk integration
