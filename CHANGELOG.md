# Changelog

## Unreleased

- Phones (e.g. the Volumio iOS app): portrait layout uses the full screen width, the cover grows
  with the free space, and the layout respects the notch and home indicator
- New setting “Side panel expanded” chooses whether the panel starts expanded or collapsed
  (default: collapsed as before)
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
