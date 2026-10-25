(function () {
  'use strict';

  // ================================================================ Grundlagen

  var params = new URLSearchParams(location.search);
  var DEMO = params.has('demo');
  var KIOSK = params.get('kiosk') === 'fascia';
  var VOLUMIO = params.get('volumio') ||
    (location.protocol === 'file:' ? 'http://localhost:3000' : location.protocol + '//' + location.hostname + ':3000');

  // Material-Icons (Apache 2.0)
  var ICONS = {
    play: 'M8 5v14l11-7z',
    pause: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z',
    stop: 'M6 6h12v12H6z',
    prev: 'M6 6h2v12H6zm3.5 6l8.5 6V6z',
    next: 'M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z',
    shuffle: 'M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z',
    repeat: 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z',
    repeatOne: 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z',
    volUp: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
    volDown: 'M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z',
    volOff: 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z',
    queue: 'M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z',
    library: 'M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5c0 1.38-1.12 2.5-2.5 2.5S10 13.88 10 12.5s1.12-2.5 2.5-2.5c.57 0 1.08.19 1.5.51V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z',
    search: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    back: 'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z',
    chevron: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
    expandLess: 'M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z',
    expandMore: 'M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z',
    more: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
    close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    add: 'M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z',
    trash: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
    clearAll: 'M15 16h4v2h-4zm0-8h7v2h-7zm0 4h6v2h-6zM3 18c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V8H3v10zM14 5h-3l-1-1H6L5 5H2v2h12z',
    folder: 'M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
    music: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
    radio: 'M3.24 6.15C2.51 6.43 2 7.17 2 8v12c0 1.1.89 2 2 2h16c1.11 0 2-.9 2-2V8c0-1.11-.89-2-2-2H8.3l8.26-3.34L15.88 1 3.24 6.15zM7 20c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-8h-2v-2h-2v2H4V8h16v4z',
    album: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z',
    person: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    server: 'M20 13H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zM7 19c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM20 3H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zM7 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
    history: 'M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z',
    genre: 'M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z',
    settings: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
    wifi: 'M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z',
    extension: 'M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z',
    palette: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
    brush: 'M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34c-.39-.39-1.02-.39-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41z',
    power: 'M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z',
    refresh: 'M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
    sync: 'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z',
    speaker: 'M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 1.99 2 1.99L17 22c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 2c1.1 0 2 .9 2 2s-.9 2-2 2c-1.11 0-2-.9-2-2s.89-2 2-2zm0 16c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
    restart: 'M12 5V2L8 6l4 4V7c3.31 0 6 2.69 6 6 0 2.97-2.17 5.43-5 5.91v2.02c3.95-.49 7-3.85 7-7.93 0-4.42-3.58-8-8-8zm-6 8c0-1.65.67-3.15 1.76-4.24L6.34 7.34C4.9 8.79 4 10.79 4 13c0 4.08 3.05 7.44 7 7.93v-2.02c-2.83-.48-5-2.94-5-5.91z',
    check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
    heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    lyrics: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM6 12h8v2H6zm0-3h12v2H6zm0-3h12v2H6z',
    subtitles: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z',
    info: 'M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
    backspace: 'M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z'
  };

  function icon(name) {
    return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (ICONS[name] || ICONS.music) + '"/></svg>';
  }

  var STRINGS = {
    de: {
      queue: 'Warteschlange', library: 'Bibliothek', search: 'Suche', live: 'LIVE',
      connecting: 'Verbinde mit Volumio …', nothingPlaying: 'Nichts in Wiedergabe',
      tracks: '{n} Titel', clear: 'Leeren', clearQueue: 'Warteschlange leeren?',
      clearQueueSub: '{n} Titel werden entfernt', cancel: 'Abbrechen',
      play: 'Abspielen', playAll: 'Abspielen', addToQueue: 'Zur Warteschlange hinzufügen',
      remove: 'Entfernen', open: 'Öffnen', added: 'Zur Warteschlange hinzugefügt',
      back: 'Zurück', expand: 'Liste ausklappen', collapse: 'Liste einklappen', shuffle: 'Zufallswiedergabe', repeat: 'Wiederholen',
      previous: 'Vorheriger Titel', next: 'Nächster Titel', playPause: 'Wiedergabe / Pause', mute: 'Stumm',
      queueEmpty: 'Die Warteschlange ist leer', queueEmptyHint: 'Wähle in der Bibliothek etwas zum Abspielen aus.',
      folderEmpty: 'Hier ist nichts', noSources: 'Keine Musikquellen gefunden',
      searchHint: 'Suche nach Künstlern, Alben und Titeln', searchPlaceholder: 'Suchen …',
      searchMin: 'Bitte mindestens 2 Zeichen eingeben', noResults: 'Keine Treffer für „{q}“',
      results: 'Ergebnisse', go: 'Suchen', space: 'Leerzeichen', hideKeyboard: 'Tastatur ausblenden',
      system: 'Volumio-Einstellungen', settings: 'Einstellungen', player: 'Player',
      power: 'Ausschalten', powerTitle: 'Volumio ausschalten?', reboot: 'Neu starten', shutdown: 'Herunterfahren',
      rebootTitle: 'Volumio neu starten?', rebootSub: 'Die Wiedergabe wird unterbrochen.',
      zones: 'Zonen & Ausgänge', close: 'Schließen', thisDevice: 'Dieses Gerät', otherDevices: 'Weitere Geräte',
      outputs: 'Ausgänge', noDevices: 'Keine weiteren Volumio-Geräte im Netzwerk', outputVia: 'Ausgabe über {name}',
      unmute: 'Ton an', updateLibrary: 'Bibliothek aktualisieren', rescanLibrary: 'Bibliothek neu einlesen',
      rescanTitle: 'Bibliothek komplett neu einlesen?', rescanSub: 'Das kann bei großen Sammlungen eine Weile dauern.',
      libraryUpdating: 'Bibliothek wird aktualisiert …', libraryRescanning: 'Bibliothek wird neu eingelesen …',
      lyrics: 'Songtext', songInfo: 'Infos', lyricsInline: 'Songtext im Player',
      noLyrics: 'Kein Songtext gefunden', instrumental: 'Instrumental', noInfo: 'Keine Infos gefunden',
      noConnection: 'Keine Verbindung', noConnectionHint: 'Volumio braucht dafür Internet.',
      lyricsNotSynced: 'Dieser Songtext läuft nicht mit.', infoTrack: 'Titel', infoAlbum: 'Album', infoArtist: 'Künstler',
      lyricsSource: 'Songtext: LRCLIB', infoSource: 'Quelle: Wikipedia (CC BY-SA 4.0)',
      noSyncedLyrics: 'Zu diesem Titel gibt es keinen mitlaufenden Songtext'
    },
    en: {
      queue: 'Queue', library: 'Library', search: 'Search', live: 'LIVE',
      connecting: 'Connecting to Volumio …', nothingPlaying: 'Nothing playing',
      tracks: '{n} tracks', clear: 'Clear', clearQueue: 'Clear the queue?',
      clearQueueSub: '{n} tracks will be removed', cancel: 'Cancel',
      play: 'Play', playAll: 'Play', addToQueue: 'Add to queue',
      remove: 'Remove from queue', open: 'Open', added: 'Added to queue',
      back: 'Back', expand: 'Expand list', collapse: 'Collapse list', shuffle: 'Shuffle', repeat: 'Repeat',
      previous: 'Previous track', next: 'Next track', playPause: 'Play / pause', mute: 'Mute',
      queueEmpty: 'The queue is empty', queueEmptyHint: 'Pick something to play from the library.',
      folderEmpty: 'Nothing here', noSources: 'No music sources found',
      searchHint: 'Search for artists, albums and tracks', searchPlaceholder: 'Search …',
      searchMin: 'Please enter at least 2 characters', noResults: 'No results for “{q}”',
      results: 'Results', go: 'Search', space: 'Space', hideKeyboard: 'Hide keyboard',
      system: 'Volumio settings', settings: 'Settings', player: 'Player',
      power: 'Power', powerTitle: 'Turn off Volumio?', reboot: 'Restart', shutdown: 'Shut down',
      rebootTitle: 'Restart Volumio?', rebootSub: 'Playback will stop.',
      zones: 'Zones & outputs', close: 'Close', thisDevice: 'This device', otherDevices: 'Other devices',
      outputs: 'Outputs', noDevices: 'No other Volumio devices on the network', outputVia: 'Output via {name}',
      unmute: 'Unmute', updateLibrary: 'Update library', rescanLibrary: 'Rescan library',
      rescanTitle: 'Rescan the whole library?', rescanSub: 'This can take a while for large collections.',
      libraryUpdating: 'Updating library …', libraryRescanning: 'Rescanning library …',
      lyrics: 'Lyrics', songInfo: 'Info', lyricsInline: 'Lyrics in the player',
      noLyrics: 'No lyrics found', instrumental: 'Instrumental', noInfo: 'No info found',
      noConnection: 'No connection', noConnectionHint: 'Volumio needs internet access for this.',
      lyricsNotSynced: 'These lyrics are not time-synced.', infoTrack: 'Track', infoAlbum: 'Album', infoArtist: 'Artist',
      lyricsSource: 'Lyrics: LRCLIB', infoSource: 'Source: Wikipedia (CC BY-SA 4.0)',
      noSyncedLyrics: 'No time-synced lyrics for this track'
    }
  };

  var DEFAULTS = {
    language: null,
    accentMode: 'cover',
    accentColor: '#3ddc97',
    background: 'blur',
    marquee: true,
    keyboard: true,
    hideCursor: true,
    idleTimeout: 300,
    clock24h: true,
    tabLabels: false,
    panelOpen: false,
    panelOpacity: 40,
    displayStyle: 'standard',
    analyzerStyle: 'vfd',
    lyricsInline: false,
    analyzer: true
  };

  var settings = Object.assign({}, DEFAULTS);

  // Eingebaute Bildschirmtastatur nur auf Touch-Geräten; am Computer tippt man auf der echten Tastatur
  var finePointer = window.matchMedia('(pointer: fine)');
  function builtinKeyboard() {
    return !!settings.keyboard && (KIOSK || !finePointer.matches);
  }
  var lang = /^de/i.test(navigator.language || '') ? 'de' : 'en';

  function t(key, vars) {
    var s = (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
    return s;
  }

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(Number(sec) || 0));
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    return (h ? h + ':' + pad(m) : m) + ':' + pad(s);
  }

  function setIcon(el, name) {
    if (el.dataset.iconName === name) return;
    el.dataset.iconName = name;
    var old = el.querySelector('svg');
    var tmp = document.createElement('div');
    tmp.innerHTML = icon(name);
    if (old) el.replaceChild(tmp.firstChild, old);
    else el.insertBefore(tmp.firstChild, el.firstChild);
  }

  function artUrl(u) {
    if (!u) return '';
    if (/^(https?:|data:|blob:)/i.test(u)) return u;
    // Relative Volumio-Pfade (/albumart?…) laufen über unseren Server (gleicher Origin)
    if (location.protocol === 'file:') return VOLUMIO + (u.charAt(0) === '/' ? '' : '/') + u;
    return u.charAt(0) === '/' ? u : '/' + u;
  }

  function sameOrigin(url) {
    if (/^(data:|blob:)/i.test(url)) return true;
    try { return new URL(url, location.href).origin === location.origin; } catch (e) { return false; }
  }

  // ================================================================ Elemente

  var els = {
    body: document.body,
    bg: $('bg'),
    clock: $('clock'), quality: $('quality'), conn: $('conn'),
    artWrap: $('art-wrap'), art: $('art'),
    title: $('title'), artist: $('artist'), album: $('album'),
    seek: $('seek'), elapsed: $('elapsed'), duration: $('duration'),
    random: $('btn-random'), prev: $('btn-prev'), play: $('btn-play'), next: $('btn-next'), repeat: $('btn-repeat'),
    mute: $('btn-mute'), volume: $('volume'), volumeValue: $('volume-value'),
    mini: $('mini'), miniArt: document.querySelector('#mini-art img'), miniTitle: $('mini-title'),
    miniArtist: $('mini-artist'), miniPlay: $('mini-play'), miniNext: $('mini-next'),
    miniFill: document.querySelector('#mini-progress .fill'),
    panelUp: $('btn-up'), panelDown: $('btn-down'),
    queueCount: $('queue-count'), queueTime: $('queue-time'), clear: $('btn-clear'), queueList: $('queue-list'),
    viewBrowse: $('view-browse'), back: $('btn-back'), browseTitle: $('browse-title'), playAll: $('btn-playall'),
    browseList: $('browse-list'),
    filterBox: $('filter-box'), filterInput: $('filter-input'), filterClear: $('filter-clear'),
    system: $('system'), systemFrame: $('system-frame'), systemClose: $('system-close'), btnSystem: $('btn-system'),
    zones: $('zones'), zonesList: $('zones-list'), zonesClose: $('zones-close'),
    systemBack: $('system-back'), systemTitle: $('system-title'), systemMenu: $('system-menu'), systemTiles: $('system-tiles'),
    viewSearch: $('view-search'), searchBox: $('search-box'), searchInput: $('search-input'),
    searchClear: $('search-clear'), searchList: $('search-list'), keyboard: $('keyboard'),
    sheet: $('sheet'), sheetTitle: $('sheet-title'), sheetSub: $('sheet-sub'), sheetActions: $('sheet-actions'),
    toast: $('toast'),
    idle: $('idle'), idleInner: $('idle-inner'), idleClock: $('idle-clock'), idleDate: $('idle-date'), idleTrack: $('idle-track'),
    offline: $('offline'),
    lyricsBtn: $('btn-lyrics'), infoBtn: $('btn-info'), lyricsSwitch: $('btn-lyrics-inline'),
    lyricInline: document.querySelector('#lyric-inline span'),
    songInfo: $('songinfo'), siLyrics: $('si-lyrics'), siInfo: $('si-info'), siClose: $('si-close')
  };

  Array.prototype.forEach.call(document.querySelectorAll('[data-icon]'), function (el) {
    setIcon(el, el.dataset.icon);
  });

  function applyLang() {
    document.documentElement.lang = lang;
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (el) {
      el.textContent = t(el.dataset.i18n);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-label]'), function (el) {
      el.setAttribute('aria-label', t(el.dataset.i18nLabel));
    });
    els.searchInput.placeholder = t('searchPlaceholder');
  }

  // ================================================================ Verbindung zu Volumio

  var socket = null;

  function emit(ev, data) {
    if (socket) socket.emit(ev, data);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { s.parentNode.removeChild(s); reject(new Error(src)); };
      document.head.appendChild(s);
    });
  }

  function connect() {
    if (DEMO) {
      loadScript('demo.js').then(function () {
        socket = window.createMockSocket();
        bindSocket();
      });
      return;
    }
    // Den socket.io-Client von Volumio selbst laden, damit die Version garantiert passt
    loadScript('socket.io/socket.io.js')
      .catch(function () { return loadScript(VOLUMIO + '/socket.io/socket.io.js'); })
      .then(function () {
        socket = window.io(VOLUMIO, {
          transports: ['websocket', 'polling'],
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000
        });
        bindSocket();
      })
      .catch(function () {
        setOnline(false);
        setTimeout(connect, 5000);
      });
  }

  function bindSocket() {
    socket.on('connect', function () {
      setOnline(true);
      emit('getState');
      emit('getQueue');
      if (!sources) emit('getBrowseSources');
    });
    socket.on('disconnect', function () { setOnline(false); });
    socket.on('pushState', onState);
    // Das Plugin schickt geänderte Einstellungen sofort an alle Anzeigen
    socket.on('pushFasciaSettings', applySettings);
    socket.on('pushQueue', onQueue);
    socket.on('pushBrowseSources', onSources);
    socket.on('pushBrowseLibrary', onBrowse);
    socket.on('pushMenuItems', onMenuItems);
    socket.on('pushMultiRoomDevices', function (d) { zones.devices = (d && d.list) || []; refreshZones(); });
    socket.on('pushAudioOutputs', function (d) { zones.outputs = (d && d.availableOutputs) || []; refreshZones(); });
    socket.on('pushOutputDevices', function (d) {
      zones.outputDevice = d && d.devices && d.devices.active ? d.devices.active.name : '';
      refreshZones();
    });
    socket.on('pushToastMessage', function (m) {
      if (!m) return;
      toast([m.title, m.message].filter(Boolean).join(': '));
    });
  }

  var offlineTimer = null;
  function setOnline(on) {
    clearTimeout(offlineTimer);
    els.conn.classList.toggle('off', !on);
    if (on) els.offline.classList.remove('open');
    else offlineTimer = setTimeout(function () { els.offline.classList.add('open'); }, 1500);
  }

  // ================================================================ Einstellungen

  var settingsJson = '';
  var settingsLoaded = false;

  function loadSettings() {
    if (location.protocol === 'file:') return Promise.resolve(applySettings({}));
    return fetch('api/settings', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(applySettings)
      .catch(function () { applySettings({}); });
  }

  // Prozentwert aus den Einstellungen als Deckkraft 0–1
  function percent(v, fallback) {
    var n = Number(v);
    if (!isFinite(n) || v === '' || v === null) n = fallback;
    return String(Math.max(0, Math.min(100, n)) / 100);
  }

  function applySettings(s) {
    var json = JSON.stringify(s || {});
    if (json === settingsJson) return;
    settingsJson = json;
    var prevPanelOpen = settings.panelOpen;
    settings = Object.assign({}, DEFAULTS, s);
    // Start-Zustand der Menüleiste; danach nur, wenn die Einstellung geändert wurde
    if (!settingsLoaded || !!settings.panelOpen !== !!prevPanelOpen) setPanelLevel(settings.panelOpen ? 1 : 0);
    settingsLoaded = true;
    ['accentMode', 'accentColor', 'background', 'displayStyle', 'analyzerStyle'].forEach(function (k) {
      if (params.has(k)) settings[k] = params.get(k);
    });

    if (settings.language) lang = /^de/i.test(settings.language) ? 'de' : 'en';
    applyLang();

    els.body.classList.toggle('bg-solid', settings.background === 'solid');
    els.body.classList.toggle('tab-labels', !!settings.tabLabels);
    els.body.classList.toggle('vfd', settings.displayStyle === 'vfd');
    // Analyzer aus Segmenten: eigene Wahl oder wie der Anzeigestil
    var segments = settings.analyzerStyle === 'vfd' || (settings.analyzerStyle !== 'normal' && settings.displayStyle === 'vfd');
    els.body.classList.toggle('seg-analyzer', segments);
    spectrum.blank = false;
    document.documentElement.style.setProperty('--panel-alpha', percent(settings.panelOpacity, DEFAULTS.panelOpacity));
    applyLyricsInline();
    els.body.classList.toggle('no-cursor', !!(settings.hideCursor && KIOSK));
    [els.searchInput, els.filterInput].forEach(function (input) {
      input.setAttribute('inputmode', builtinKeyboard() ? 'none' : 'search');
      // Die VirtualKeyboard-Erweiterung des Volumio-Kiosks überspringt Felder mit _vkEnabled="true".
      // Mit eingebauter Tastatur soll sie nicht zusätzlich aufspringen.
      if (settings.keyboard) input.setAttribute('_vkEnabled', 'true');
      else input.removeAttribute('_vkEnabled');
    });
    if (!builtinKeyboard()) closeKeyboard();

    updateAccent();
    setupAnalyzer();
    if (settings.background !== 'solid' && currentArt) setBackground(currentArt);
    refreshMarquees();
    renderQueue();
    if (!nav.length) renderSources();
    updateClock();
  }

  // ================================================================ Akzentfarbe

  var coverAccent = null;
  var accentRgb = '61,220,151';
  var colorProbe = document.createElement('span');

  function parseColor(c) {
    colorProbe.style.color = '';
    colorProbe.style.color = c;
    if (!colorProbe.style.color) return null;
    document.body.appendChild(colorProbe);
    var m = getComputedStyle(colorProbe).color.match(/\d+(\.\d+)?/g);
    document.body.removeChild(colorProbe);
    return m ? [Math.round(+m[0]), Math.round(+m[1]), Math.round(+m[2])] : null;
  }

  var SURFACE_BASE = [14, 15, 20];
  var SURFACE_MIX = 0.35;

  function setAccent(color) {
    var rgb = parseColor(color) || parseColor(DEFAULTS.accentColor);
    var root = document.documentElement.style;
    root.setProperty('--accent', 'rgb(' + rgb.join(',') + ')');
    root.setProperty('--accent-rgb', rgb.join(', '));
    accentRgb = rgb.join(',');
    var lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
    root.setProperty('--accent-ink', lum > 0.55 ? '#0b0d10' : '#ffffff');
    // Panel und Einstellungen in der Akzentfarbe, abgedunkelt, damit weiße Schrift lesbar bleibt
    var surface = rgb.map(function (c, i) { return Math.round(c * SURFACE_MIX + SURFACE_BASE[i] * (1 - SURFACE_MIX)); });
    root.setProperty('--surface-rgb', surface.join(', '));
  }

  // Anzeigestil VFD: immer die typische türkisgrüne Leuchtfarbe
  var VFD_COLOR = '#46f2d3';

  function updateAccent() {
    var c = settings.accentMode === 'cover' && coverAccent ? coverAccent : settings.accentColor;
    if (settings.displayStyle === 'vfd') c = VFD_COLOR;
    setAccent(c || DEFAULTS.accentColor);
  }

  // Dominante, ausreichend bunte Farbe des Covers bestimmen
  function extractAccent(img) {
    try {
      var size = 24;
      var c = document.createElement('canvas');
      c.width = c.height = size;
      var ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      var d = ctx.getImageData(0, 0, size, size).data;
      var buckets = [];
      for (var i = 0; i < d.length; i += 4) {
        var r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
        var sat = max ? delta / max : 0;
        if (max < 0.22 || sat < 0.28) continue;
        var h;
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
        h = (h * 60 + 360) % 360;
        var k = Math.floor(h / 20);
        var w = sat * max;
        var bk = buckets[k] || (buckets[k] = { w: 0, x: 0, y: 0, s: 0 });
        bk.w += w;
        bk.x += Math.cos(h * Math.PI / 180) * w;
        bk.y += Math.sin(h * Math.PI / 180) * w;
        bk.s += sat * w;
      }
      var best = null;
      buckets.forEach(function (bk) { if (bk && (!best || bk.w > best.w)) best = bk; });
      if (!best || best.w < 2) return null;
      var hue = Math.round((Math.atan2(best.y, best.x) * 180 / Math.PI + 360) % 360);
      var s = Math.round(Math.min(90, Math.max(55, best.s / best.w * 100)));
      // Hell genug, um sich vom (aus demselben Cover stammenden) Hintergrund abzuheben
      return 'hsl(' + hue + ', ' + s + '%, 70%)';
    } catch (e) {
      return null; // fremder Origin ohne CORS: Canvas ist gesperrt
    }
  }

  // ================================================================ Cover & Hintergrund

  var currentArt = null;

  function setArt(url) {
    currentArt = url;
    if (!url) {
      els.art.classList.remove('ready');
      els.art.removeAttribute('src');
      els.miniArt.removeAttribute('src');
      coverAccent = null;
      updateAccent();
      clearBackground();
      return;
    }
    var img = new Image();
    if (!sameOrigin(url)) img.crossOrigin = 'anonymous';
    img.onload = function () {
      if (currentArt !== url) return;
      showArt(url);
      coverAccent = extractAccent(img);
      updateAccent();
    };
    img.onerror = function () {
      if (currentArt !== url) return;
      // Ohne CORS-Freigabe trotzdem anzeigen, dann eben mit fester Akzentfarbe
      if (img.crossOrigin) {
        var plain = new Image();
        plain.onload = function () {
          if (currentArt !== url) return;
          showArt(url);
          coverAccent = null;
          updateAccent();
        };
        plain.onerror = function () { if (currentArt === url) showArt(''); };
        plain.src = url;
      } else {
        showArt('');
      }
    };
    img.src = url;
  }

  function showArt(url) {
    if (!url) {
      els.art.classList.remove('ready');
      els.miniArt.removeAttribute('src');
      clearBackground();
      return;
    }
    els.art.src = url;
    els.art.classList.add('ready');
    els.miniArt.src = url;
    setBackground(url);
  }

  function setBackground(url) {
    if (settings.background === 'solid') return;
    var last = els.bg.lastElementChild;
    if (last && last.dataset.url === url) return;
    var layer = document.createElement('div');
    layer.className = 'bg-layer';
    layer.dataset.url = url;
    layer.style.backgroundImage = 'url("' + url.replace(/"/g, '%22') + '")';
    els.bg.appendChild(layer);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { layer.classList.add('show'); });
    });
    setTimeout(function () {
      while (els.bg.children.length > 1 && els.bg.firstElementChild !== layer) {
        els.bg.removeChild(els.bg.firstElementChild);
      }
    }, 1000);
  }

  function clearBackground() {
    Array.prototype.forEach.call(els.bg.children, function (l) { l.classList.remove('show'); });
  }

  // ================================================================ Laufschrift

  var marquees = [els.title, els.artist];

  function setMarquee(el, text) {
    if (el.textContent === text) return;
    el.textContent = text;
    checkMarquee(el);
  }

  function checkMarquee(el) {
    el.classList.remove('run');
    requestAnimationFrame(function () {
      var over = el.scrollWidth - el.clientWidth;
      if (settings.marquee && over > 2) {
        el.style.setProperty('--dist', -(over + 8) + 'px');
        el.style.setProperty('--dur', Math.max(5, over / 22 + 3).toFixed(1) + 's');
        el.classList.add('run');
      }
    });
  }

  function refreshMarquees() { marquees.forEach(checkMarquee); }

  // ================================================================ Wiedergabestatus

  var state = {};
  var seekBase = { ms: 0, at: 0 };

  function isPlaying() { return state.status === 'play'; }
  function isLive() { return !(Number(state.duration) > 0); }

  function elapsedMs() {
    var ms = seekBase.ms;
    if (isPlaying()) ms += performance.now() - seekBase.at;
    var dur = (Number(state.duration) || 0) * 1000;
    return dur ? Math.min(ms, dur) : ms;
  }

  function onState(s) {
    var prevPos = state.position;
    var prevUri = state.uri;
    var wasPlaying = isPlaying();
    var estimate = elapsedMs();
    state = s || {};
    var hasTrack = !!(state.title || state.artist || state.uri);
    var title = hasTrack ? (state.title || state.uri || '') : t('nothingPlaying');

    setMarquee(els.title, title);
    setMarquee(els.artist, state.artist || '');
    els.album.textContent = state.album || '';
    els.miniTitle.textContent = title;
    els.miniArtist.textContent = state.artist || '';

    var art = hasTrack ? artUrl(state.albumart) : '';
    if (art !== currentArt) setArt(art);

    var playing = isPlaying();
    var live = isLive();
    els.body.classList.toggle('is-playing', playing);
    els.body.classList.toggle('is-live', live && hasTrack);
    var playIcon = playing ? (live ? 'stop' : 'pause') : 'play';
    setIcon(els.play, playIcon);
    setIcon(els.miniPlay, playIcon);

    els.random.classList.toggle('on', !!state.random);
    els.repeat.classList.toggle('on', !!state.repeat);
    setIcon(els.repeat, state.repeat && state.repeatSingle ? 'repeatOne' : 'repeat');

    var noVolume = state.disableVolumeControl === true || state.volume == null;
    els.body.classList.toggle('no-volume', noVolume);
    var vol = Math.max(0, Math.min(100, Number(state.volume) || 0));
    if (!volSlider.dragging && Date.now() - volume.lastUser > 1500) {
      volSlider.set(vol / 100);
      els.volumeValue.textContent = vol;
    }
    setIcon(els.mute, state.mute || vol === 0 ? 'volOff' : vol < 50 ? 'volDown' : 'volUp');

    // Volumio schickt bei jeder Statusänderung (z. B. Lautstärke) die Position mit, oft leicht
    // veraltet. Kleine Abweichungen ignorieren, sonst springt der Regler sichtbar zurück.
    var reported = Number(state.seek) || 0;
    var sameRun = wasPlaying && playing && prevUri === state.uri;
    if (!sameRun || Math.abs(reported - estimate) > 2000) {
      seekBase.ms = reported;
      seekBase.at = performance.now();
    }

    renderQuality(live && hasTrack);
    if (prevPos !== state.position) highlightQueue(true);
    if (playing) hideIdle();
    els.idleTrack.textContent = hasTrack && !playing ? [state.title, state.artist].filter(Boolean).join(' – ') : '';
    lastSecond = -1;
    updateProgress();
    if (typeof syncSelfZone === 'function') syncSelfZone();
    if (trackKey() !== song.key) onTrackChange();
  }

  function renderQuality(live) {
    var type = String(state.trackType || '').toUpperCase();
    if (type === 'WEBRADIO') type = '';
    var bits = String(state.bitdepth || '').replace(/\s*bits?$/i, '').trim();
    var rate = String(state.samplerate || '').replace(/\s*k?hz$/i, '').trim();
    var q = bits && rate ? bits + '/' + rate : (rate || bits || String(state.bitrate || ''));
    var parts = [type, q].filter(Boolean);
    if (live && !parts.length) parts.push(t('live'));
    els.quality.textContent = parts.join(' · ');
  }

  var lastSecond = -1;

  function updateProgress() {
    var dur = Number(state.duration) || 0;
    var ms = elapsedMs();
    var frac = dur ? Math.min(1, ms / 1000 / dur) : 0;
    if (!seekSlider.dragging) {
      var sec = Math.floor(ms / 1000);
      if (sec !== lastSecond) {
        lastSecond = sec;
        els.elapsed.textContent = fmtTime(sec);
      }
      seekSlider.set(frac);
    }
    var total = fmtTime(dur);
    if (els.duration.textContent !== total) els.duration.textContent = total;
    els.miniFill.style.transform = 'scaleX(' + frac.toFixed(4) + ')';
  }

  // Fortschritt laufend weiterschieben statt in Sekundenschritten. Der Regler bewegt sich nur
  // wenige Pixel pro Sekunde, 30 Bilder/s sehen daher genauso flüssig aus wie 60 und schonen den Pi.
  var lastFrame = 0;
  function frame(now) {
    // Die Einstellungsseite verdeckt den Player; solange muss er nichts zeichnen
    if (now - lastFrame >= 32 && !document.hidden && !els.body.classList.contains('system-open')) {
      lastFrame = now;
      // Songtext und Infos verdecken ihn auch; dort läuft nur der Songtext weiter
      var covered = songView.open;
      if (isPlaying() && !covered) updateProgress();
      if (spectrum.source && !covered) drawSpectrum();
      if (song.lines) updateLyrics(false);
    }
    requestAnimationFrame(frame);
  }

  // ================================================================ Band-Analyzer

  // Das Plugin greift den Ton direkt vor dem DAC ab und schickt 64 Bandpegel (0–99) per
  // Server-Sent Events; sie werden sofort angezeigt.
  var BANDS = 64;
  var spectrum = {
    canvas: $('spectrum'), ctx: null, source: null, target: null,
    bars: 0, cur: null, peak: null, w: 0, h: 0, dpr: 1, blank: false, styles: null, stylesFor: ''
  };

  function setupAnalyzer() {
    var on = !!settings.analyzer && location.protocol !== 'file:';
    els.body.classList.toggle('analyzer', on);
    if (on && !spectrum.source) connectSpectrum();
    if (!on && spectrum.source) {
      spectrum.source.close();
      spectrum.source = null;
    }
    sizeSpectrum();
  }

  function connectSpectrum() {
    if (DEMO) {
      // Demo: künstliches Spektrum, damit man das Aussehen beurteilen kann
      var phase = 0;
      var timer = setInterval(function () {
        if (!isPlaying()) return pushSpectrum('0');
        phase += 0.033;
        var beat = Math.pow(Math.max(0, Math.sin(phase * Math.PI * 2)), 6);
        var v = [];
        for (var i = 0; i < BANDS; i++) {
          var base = 70 - i * 0.55 + 18 * Math.sin(phase * 3 + i * 0.35) + Math.random() * 14;
          v.push(Math.max(0, Math.min(99, Math.round(base + (i < 12 ? beat * 30 : beat * 8)))));
        }
        pushSpectrum(v.join(','));
      }, 33);
      spectrum.source = { close: function () { clearInterval(timer); } };
      return;
    }
    if (!window.EventSource) return;
    var es = new EventSource('api/spectrum');
    es.onmessage = function (e) { pushSpectrum(e.data); };
    spectrum.source = es;
  }

  function pushSpectrum(line) {
    spectrum.target = line === '0' ? null : line.split(',').map(Number);
  }

  function sizeSpectrum() {
    var c = spectrum.canvas;
    var w = c.clientWidth;
    var h = c.clientHeight;
    if (!w || !h) return;
    var dpr = window.devicePixelRatio || 1;
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    var bars = Math.max(16, Math.min(BANDS, Math.round(w / (rem * 0.8))));
    if (bars !== spectrum.bars) {
      spectrum.bars = bars;
      spectrum.cur = new Float32Array(bars);
      spectrum.peak = new Float32Array(bars);
    }
    spectrum.w = w;
    spectrum.h = h;
    spectrum.dpr = dpr;
    spectrum.ctx = c.getContext('2d');
    spectrum.blank = false;
  }

  // VFD: Balken aus einzelnen Leuchtsegmenten; unbeleuchtete Segmente glimmen schwach. Das
  // Leuchten ist ein breiterer, durchscheinender Balken dahinter (shadowBlur wäre ohne GPU zu teuer).
  function drawSegments(ctx, W, H, n, cur, peak, played) {
    var pitch = W / n;
    var gap = Math.max(2, pitch * 0.3);
    var bw = pitch - gap;
    var step = 4.5;
    var rows = Math.floor(H / step);
    var c = accentRgb;
    function bars(level, playedPart, pad) {
      ctx.beginPath();
      for (var j = 0; j < n; j++) {
        var x = j * pitch + gap / 2;
        if (playedPart != null && (x + bw / 2 <= played) !== playedPart) continue;
        var h = Math.round(level(j) * rows) * step;
        if (h > 0) ctx.rect(x - pad, H - h - pad, bw + 2 * pad, h + pad);
      }
    }
    bars(function () { return 1; }, null, 0);
    ctx.fillStyle = 'rgba(' + c + ',.07)';
    ctx.fill();
    var lit = function (j) { return cur[j]; };
    bars(lit, null, 1.5);
    ctx.fillStyle = 'rgba(' + c + ',.18)';
    ctx.fill();
    bars(lit, true, 0);
    ctx.fillStyle = 'rgb(' + c + ')';
    ctx.fill();
    bars(lit, false, 0);
    ctx.fillStyle = 'rgba(' + c + ',.45)';
    ctx.fill();
    // Spitzen: je ein einzelnes Segment
    ctx.beginPath();
    for (var p = 0; p < n; p++) {
      if (peak[p] < 0.03) continue;
      var r = Math.max(1, Math.round(peak[p] * rows));
      ctx.rect(p * pitch + gap / 2, H - r * step, bw, step);
    }
    ctx.fillStyle = 'rgba(' + c + ',.8)';
    ctx.fill();
    // Fugen zwischen den Segmenten ausschneiden
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    for (var y = H - step; y > -step; y -= step) ctx.rect(0, y - 1.5, W, 1.5);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawSpectrum() {
    if (!spectrum.ctx || !spectrum.bars) return;

    var n = spectrum.bars;
    var cur = spectrum.cur;
    var peak = spectrum.peak;
    var t = spectrum.target;
    var moving = false;
    for (var i = 0; i < n; i++) {
      var v = 0;
      if (t) {
        var a = Math.floor(i * BANDS / n);
        var b = Math.max(a + 1, Math.floor((i + 1) * BANDS / n));
        for (var k = a; k < b; k++) if (t[k] > v) v = t[k];
        v /= 99;
      }
      // schnell steigen, langsam fallen; Spitzen sinken noch langsamer
      cur[i] = v > cur[i] ? cur[i] + (v - cur[i]) * 0.6 : Math.max(v, cur[i] - 0.04);
      peak[i] = cur[i] >= peak[i] ? cur[i] : Math.max(0, peak[i] - 0.012);
      if (cur[i] > 0.003 || peak[i] > 0.003) moving = true;
    }
    if (!moving && spectrum.blank) return;
    spectrum.blank = !moving;

    var styleKey = accentRgb + (els.body.classList.contains('vfd') ? ' vfd' : '');
    if (spectrum.stylesFor !== styleKey) {
      spectrum.stylesFor = styleKey;
      // Gespielter Teil in der Akzentfarbe, Rest neutral weiß: hebt sich von jedem Cover-Hintergrund ab.
      // Auf der VFD-Anzeige glimmt der Rest gedämpft in der Leuchtfarbe.
      var rest = styleKey.indexOf(' vfd') !== -1 ? accentRgb : '255,255,255';
      spectrum.styles = [
        'rgba(' + accentRgb + ',.85)', 'rgba(' + rest + ',.2)',
        'rgba(' + accentRgb + ',1)', 'rgba(' + rest + ',.45)'
      ];
    }
    var ctx = spectrum.ctx;
    var W = spectrum.w;
    var H = spectrum.h;
    ctx.setTransform(spectrum.dpr, 0, 0, spectrum.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Schon gespielter Teil leuchtet in der Akzentfarbe, der Rest gedämpft
    var played = els.body.classList.contains('is-live') ? W : Math.max(0, seekSlider.value) * W;
    if (els.body.classList.contains('seg-analyzer')) return drawSegments(ctx, W, H, n, cur, peak, played);
    var pitch = W / n;
    var gap = Math.max(2, pitch * 0.3);
    var bw = pitch - gap;
    var top = H - 3;
    var round = !!ctx.roundRect;
    for (var pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      for (var j = 0; j < n; j++) {
        var x = j * pitch + gap / 2;
        if ((x + bw / 2 <= played) !== (pass === 0)) continue;
        var bh = cur[j] * top;
        if (bh < 0.5) continue;
        if (round) ctx.roundRect(x, H - bh, bw, bh, [Math.min(2, bw / 2), Math.min(2, bw / 2), 0, 0]);
        else ctx.rect(x, H - bh, bw, bh);
      }
      ctx.fillStyle = spectrum.styles[pass];
      ctx.fill();
      ctx.beginPath();
      for (var p = 0; p < n; p++) {
        var px = p * pitch + gap / 2;
        if ((px + bw / 2 <= played) !== (pass === 0) || peak[p] < 0.03) continue;
        ctx.rect(px, H - peak[p] * top - 2, bw, 1.5);
      }
      ctx.fillStyle = spectrum.styles[pass + 2];
      ctx.fill();
    }
  }

  // ================================================================ Slider

  function Slider(el, opts) {
    var self = this;
    this.el = el;
    this.track = el.querySelector('.track');
    this.fill = el.querySelector('.fill');
    this.pos = el.querySelector('.thumb-pos');
    this.value = -1;
    this.dragging = false;
    if (opts.smooth) el.classList.add('smooth');

    function valueAt(e) {
      var r = self.track.getBoundingClientRect();
      return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    }
    function end() {
      if (!self.dragging) return;
      self.dragging = false;
      el.classList.remove('active');
      if (opts.onChange) opts.onChange(self.value);
    }
    el.addEventListener('pointerdown', function (e) {
      self.dragging = true;
      el.classList.add('active');
      if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
      self.set(valueAt(e));
      if (opts.onInput) opts.onInput(self.value);
      e.preventDefault();
    });
    el.addEventListener('pointermove', function (e) {
      if (!self.dragging) return;
      self.set(valueAt(e));
      if (opts.onInput) opts.onInput(self.value);
    });
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  Slider.prototype.set = function (v) {
    if (v === this.value) return;
    this.value = v;
    this.fill.style.transform = 'translateX(' + ((v - 1) * 100).toFixed(3) + '%)';
    this.pos.style.transform = 'translateX(' + (v * 100).toFixed(3) + '%)';
  };

  var seekSlider = new Slider(els.seek, {
    onInput: function (v) {
      els.elapsed.textContent = fmtTime(v * (Number(state.duration) || 0));
    },
    onChange: function (v) {
      var sec = Math.round(v * (Number(state.duration) || 0));
      seekBase.ms = sec * 1000;
      seekBase.at = performance.now();
      lastSecond = -1;
      emit('seek', sec);
    }
  });

  var volume = { timer: null, pending: null, lastUser: 0 };

  function sendVolume(v, now) {
    volume.pending = v;
    volume.lastUser = Date.now();
    if (now) return flushVolume();
    if (!volume.timer) volume.timer = setTimeout(flushVolume, 150);
  }

  function flushVolume() {
    clearTimeout(volume.timer);
    volume.timer = null;
    if (volume.pending == null) return;
    emit('volume', volume.pending);
    volume.pending = null;
  }

  var volSlider = new Slider(els.volume, {
    smooth: true,
    onInput: function (v) {
      var n = Math.round(v * 100);
      els.volumeValue.textContent = n;
      sendVolume(n, false);
    },
    onChange: function (v) { sendVolume(Math.round(v * 100), true); }
  });

  // ================================================================ Tasten & Gesten

  // Sofortiges Feedback beim Antippen (":active" kommt auf Touch oft verzögert)
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('.tbtn, .pill, .tab, .sheet-btn, .tile');
    if (!b) return;
    b.classList.add('pressed');
    var up = function () {
      b.classList.remove('pressed');
      document.removeEventListener('pointerup', up, true);
      document.removeEventListener('pointercancel', up, true);
    };
    document.addEventListener('pointerup', up, true);
    document.addEventListener('pointercancel', up, true);
  }, true);

  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  function togglePlay() {
    if (isPlaying()) emit(isLive() ? 'stop' : 'pause');
    else emit('play');
  }

  els.play.addEventListener('click', togglePlay);
  els.miniPlay.addEventListener('click', togglePlay);
  els.prev.addEventListener('click', function () { emit('prev'); });
  els.next.addEventListener('click', function () { emit('next'); });
  els.miniNext.addEventListener('click', function () { emit('next'); });
  els.random.addEventListener('click', function () { emit('setRandom', { value: !state.random }); });
  els.repeat.addEventListener('click', function () {
    // Aus -> alle wiederholen -> einen Titel wiederholen -> aus
    if (!state.repeat) emit('setRepeat', { value: true, repeatSingle: false });
    else if (!state.repeatSingle) emit('setRepeat', { value: true, repeatSingle: true });
    else emit('setRepeat', { value: false, repeatSingle: false });
  });
  els.mute.addEventListener('click', openZones);

  // Wischen über das Cover: links = nächster, rechts = vorheriger Titel
  (function () {
    var start = null;
    var dx = 0;
    els.artWrap.addEventListener('pointerdown', function (e) {
      start = { x: e.clientX, y: e.clientY };
      dx = 0;
      els.art.classList.add('dragging');
      if (els.artWrap.setPointerCapture) els.artWrap.setPointerCapture(e.pointerId);
    });
    els.artWrap.addEventListener('pointermove', function (e) {
      if (!start) return;
      dx = e.clientX - start.x;
      els.art.style.transform = 'translateX(' + dx * 0.45 + 'px) rotate(' + dx * 0.012 + 'deg)';
    });
    function end() {
      if (!start) return;
      start = null;
      els.art.classList.remove('dragging');
      els.art.style.transform = '';
      var limit = els.artWrap.clientWidth * 0.22;
      if (dx < -limit) emit('next');
      else if (dx > limit) emit('prev');
    }
    els.artWrap.addEventListener('pointerup', end);
    els.artWrap.addEventListener('pointercancel', end);
  })();

  // Antippen und langes Drücken in Listen
  function bindList(container, handlers) {
    var timer = null;
    var longFired = false;
    var row = null;
    var sx = 0, sy = 0;

    function cancel() {
      clearTimeout(timer);
      timer = null;
      if (row) row.classList.remove('pressed');
    }
    container.addEventListener('pointerdown', function (e) {
      row = e.target.closest('[data-key]');
      if (!row) return;
      longFired = false;
      sx = e.clientX;
      sy = e.clientY;
      row.classList.add('pressed');
      timer = setTimeout(function () {
        timer = null;
        longFired = true;
        row.classList.remove('pressed');
        if (handlers.long) handlers.long(row.dataset.key, anchorY(row));
      }, 550);
    });
    container.addEventListener('pointermove', function (e) {
      if (timer && (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10)) cancel();
    });
    container.addEventListener('pointerup', cancel);
    container.addEventListener('pointercancel', cancel);
    container.addEventListener('scroll', function () {
      cancel();
      container.dataset.touched = Date.now();
    }, { passive: true });
    container.addEventListener('click', function (e) {
      var r = e.target.closest('[data-key]');
      if (!r) return;
      if (longFired) {
        longFired = false;
        return;
      }
      var action = e.target.closest('[data-action]');
      closeKeyboard();
      handlers.tap(r.dataset.key, action ? action.dataset.action : null, anchorY(r));
    });
  }

  function rowHtml(o) {
    return '<div class="row' + (o.cls ? ' ' + o.cls : '') + '" data-key="' + esc(o.key) + '">' +
      '<div class="thumb">' + icon(o.icon) +
        (o.thumb ? '<img loading="lazy" draggable="false" alt="" src="' + esc(o.thumb) + '" onerror="this.remove()">' : '') +
        (o.eq ? '<span class="eq"><i></i><i></i><i></i></span>' : '') +
      '</div>' +
      '<div class="txt"><div class="t1">' + esc(o.title) + '</div>' +
        (o.sub ? '<div class="t2">' + esc(o.sub) + '</div>' : '') + '</div>' +
      (o.right ? '<div class="right">' + o.right + '</div>' : '') +
      (o.more ? '<button class="tbtn more" data-action="more" aria-label="…">' + icon('more') + '</button>' : '') +
    '</div>';
  }

  function emptyHtml(iconName, title, hint) {
    return '<div class="empty">' + icon(iconName) + '<b>' + esc(title) + '</b>' + (hint ? esc(hint) : '') + '</div>';
  }

  var LOADING = '<div class="loading"><div class="spinner"></div></div>';

  // ================================================================ Aktionsmenü

  var sheetActions = [];
  var sheetOpenedAt = 0;

  function anchorY(el) {
    if (!el) return null;
    var r = el.getBoundingClientRect();
    return r.top + r.height / 2;
  }

  // anchor: Bildschirmhöhe, auf der das Menü erscheinen soll (dort, wo der Finger ist)
  function openSheet(title, sub, actions, anchor) {
    sheetActions = actions;
    sheetOpenedAt = Date.now();
    els.sheetTitle.textContent = title || '';
    els.sheetSub.textContent = sub || '';
    els.sheetActions.innerHTML = actions.map(function (a, i) {
      return '<button class="sheet-btn' + (a.cls ? ' ' + a.cls : '') + '" data-i="' + i + '">' +
        icon(a.icon) + '<span>' + esc(a.label) + '</span></button>';
    }).join('');
    var card = els.sheet.firstElementChild;
    card.style.marginTop = '0px';
    els.sheet.classList.add('open');
    var cs = getComputedStyle(els.sheet);
    var padY = parseFloat(cs.paddingTop) || 0;
    var h = card.offsetHeight;
    var maxTop = window.innerHeight - h - (parseFloat(cs.paddingBottom) || 0);
    var top = anchor == null ? (window.innerHeight - h) / 2 : anchor - h / 2;
    top = Math.max(padY, Math.min(maxTop, top));
    card.style.marginTop = (top - padY) + 'px';
  }

  function closeSheet() { els.sheet.classList.remove('open'); }

  els.sheet.addEventListener('click', function (e) {
    if (Date.now() - sheetOpenedAt < 350) return; // Loslassen nach langem Druck ignorieren
    var b = e.target.closest('.sheet-btn');
    if (b) {
      closeSheet();
      var a = sheetActions[+b.dataset.i];
      if (a && a.fn) a.fn();
    } else if (!e.target.closest('.sheet-card')) {
      closeSheet();
    }
  });

  // ================================================================ Toast

  var toastTimer = null;
  function toast(msg) {
    if (!msg) return;
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.classList.remove('show'); }, 2600);
  }

  // ================================================================ Tabs & Ausklappen

  var activeTab = 'queue';

  function storeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function storeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* egal */ } }

  function switchTab(name) {
    if (name === activeTab && name === 'browse' && nav.length) {
      // Erneutes Antippen von "Bibliothek" springt zurück zu den Quellen
      nav = [];
      renderSources();
    }
    activeTab = name;
    storeSet('fascia.tab', name);
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (b) {
      b.classList.toggle('active', b.dataset.tab === name);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.view'), function (v) {
      v.classList.toggle('active', v.id === 'view-' + name);
    });
    closeKeyboard();
    if (name === 'queue') highlightQueue(true);
    if (name === 'search' && !els.searchInput.value) openKeyboard(els.searchInput, submitSearch);
  }

  Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (b) {
    b.addEventListener('click', function () {
      // Eingeklapptes Panel: ein Tipp auf ein Symbol klappt es wieder aus
      if (panelLevel === 0) setPanelLevel(1);
      switchTab(b.dataset.tab);
    });
  });

  // Panel-Stufen: 0 = eingeklappt (nur Symbolleiste), 1 = normal, 2 = vergrößert (nur Hochformat,
  // der Player schrumpft dann zum Mini-Player)
  // Breite Bildschirme (Bar-Display quer, Computer): Panel rechts, nur ein- oder ausgeklappt
  var landscapeQuery = window.matchMedia('(min-aspect-ratio: 1/1)');
  var panelLevel = 0;

  function maxPanelLevel() { return landscapeQuery.matches ? 1 : 2; }

  // Kurze Hochformat-Bildschirme (Handy, Tablet hochkant): in der mittleren Stufe bliebe für die
  // Liste kaum Platz (eine Zeile), daher dort gleich die große Liste mit Mini-Player
  function skipMiddleLevel() {
    if (landscapeQuery.matches) return false;
    var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return window.innerHeight / rem < 62;
  }

  function setPanelLevel(level) {
    level = Math.max(0, Math.min(maxPanelLevel(), level));
    if (level === 1 && skipMiddleLevel()) level = panelLevel === 2 ? 0 : 2;
    panelLevel = level;
    els.body.classList.toggle('panel-collapsed', panelLevel === 0);
    els.body.classList.toggle('expanded', panelLevel === 2);
    els.panelUp.hidden = panelLevel >= maxPanelLevel();
    els.panelDown.hidden = panelLevel === 0;
    if (panelLevel === 0) closeKeyboard();
    // Player ändert seine Breite bzw. Höhe
    requestAnimationFrame(function () {
      sizeSpectrum();
      refreshMarquees();
    });
  }

  els.panelUp.addEventListener('click', function () { setPanelLevel(panelLevel + 1); });
  els.panelDown.addEventListener('click', function () { setPanelLevel(panelLevel - 1); });
  els.mini.addEventListener('click', function (e) {
    if (!e.target.closest('.tbtn')) setPanelLevel(1);
  });
  if (landscapeQuery.addEventListener) {
    landscapeQuery.addEventListener('change', function () { setPanelLevel(panelLevel); });
  }

  // ================================================================ Warteschlange

  var queue = [];

  function onQueue(q) {
    queue = Array.isArray(q) ? q : [];
    renderQueue();
  }

  function renderQueue() {
    var total = queue.reduce(function (s, it) { return s + (Number(it.duration) || 0); }, 0);
    els.queueCount.textContent = queue.length ? t('tracks', { n: queue.length }) : t('queue');
    els.queueTime.textContent = total ? fmtTime(total) : '';
    els.clear.hidden = !queue.length;

    if (!queue.length) {
      els.queueList.innerHTML = emptyHtml('queue', t('queueEmpty'), t('queueEmptyHint'));
      return;
    }
    var scroll = els.queueList.scrollTop;
    els.queueList.innerHTML = queue.map(function (it, i) {
      var current = i === state.position;
      return rowHtml({
        key: String(i),
        cls: current ? 'current' : '',
        eq: current,
        icon: it.service === 'webradio' ? 'radio' : 'music',
        thumb: artUrl(it.albumart),
        title: it.name || it.title || it.uri,
        sub: [it.artist, it.album].filter(Boolean).join(' · '),
        right: Number(it.duration) > 0 ? fmtTime(it.duration) : '',
        more: true
      });
    }).join('');
    els.queueList.scrollTop = scroll;
    highlightQueue(false);
  }

  function highlightQueue(scrollIntoView) {
    var rows = els.queueList.querySelectorAll('.row');
    var currentRow = null;
    Array.prototype.forEach.call(rows, function (r) {
      var cur = +r.dataset.key === state.position;
      if (cur) currentRow = r;
      if (cur === r.classList.contains('current')) return;
      r.classList.toggle('current', cur);
      var thumb = r.querySelector('.thumb');
      var eq = thumb.querySelector('.eq');
      if (cur && !eq) thumb.insertAdjacentHTML('beforeend', '<span class="eq"><i></i><i></i><i></i></span>');
      if (!cur && eq) thumb.removeChild(eq);
    });
    var touched = Number(els.queueList.dataset.touched) || 0;
    if (scrollIntoView && currentRow && activeTab === 'queue' && Date.now() - touched > 8000) {
      // Relativ zur Liste rechnen: offsetTop bezieht sich auf #app und enthält im Hochformat den Player
      var list = els.queueList;
      var top = currentRow.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
      list.scrollTop = top - list.clientHeight / 2 + currentRow.offsetHeight / 2;
    }
  }

  bindList(els.queueList, {
    tap: function (key, action, anchor) {
      if (action === 'more') return queueMenu(+key, anchor);
      emit('play', { value: +key });
    },
    long: function (key, anchor) { queueMenu(+key, anchor); }
  });

  function queueMenu(i, anchor) {
    var it = queue[i];
    if (!it) return;
    openSheet(it.name || it.title, [it.artist, it.album].filter(Boolean).join(' · '), [
      { icon: 'play', label: t('play'), cls: 'primary', fn: function () { emit('play', { value: i }); } },
      { icon: 'trash', label: t('remove'), cls: 'danger', fn: function () { emit('removeFromQueue', { value: i }); } }
    ], anchor);
  }

  els.clear.addEventListener('click', function () {
    openSheet(t('clearQueue'), t('clearQueueSub', { n: queue.length }), [
      { icon: 'clearAll', label: t('clear'), cls: 'danger', fn: function () { emit('clearQueue'); } },
      { icon: 'close', label: t('cancel') }
    ], anchorY(els.clear));
  });

  // ================================================================ Bibliothek

  var PLAYABLE = ['song', 'track', 'webradio', 'mywebradio', 'cuesong'];
  var SOURCE_ICONS = {
    'favourites': 'heart',
    'playlists': 'queue',
    'music-library': 'folder',
    'artists://': 'person',
    'albums://': 'album',
    'genres://': 'genre',
    'upnp': 'server',
    'Last_100': 'history',
    'radio': 'radio'
  };
  var sources = null;
  var nav = [];               // Verlauf: [{ uri, title, data, scroll }]
  var pending = null;         // { target: 'browse' | 'search', entry }
  var sourcesScroll = 0;
  var browseCtx = { lists: [] };
  var searchCtx = { lists: [] };

  function isPlayable(item) { return PLAYABLE.indexOf(item.type) !== -1; }
  function isRadio(item) { return item.type === 'webradio' || item.type === 'mywebradio'; }

  function iconFor(item) {
    var fa = String(item.icon || '');
    var type = String(item.type || '');
    if (/heart/.test(fa)) return 'heart';
    if (isRadio(item) || /radio|rss|podcast|globe|wifi|signal/.test(fa + type)) return 'radio';
    if (type === 'artist' || /microphone|user/.test(fa)) return 'person';
    if (type === 'playlist' || /list/.test(fa)) return 'queue';
    if (type === 'album' || /dot-circle|album/.test(fa)) return 'album';
    if (/usb|hdd|sitemap|server|folder|archive|database/.test(fa) || /folder|remdisk/.test(type)) return 'folder';
    if (isPlayable(item) || /music/.test(fa)) return 'music';
    return 'folder';
  }

  function cleanItem(item) {
    return {
      service: item.service,
      uri: item.uri,
      type: item.type,
      title: item.title || item.name,
      artist: item.artist,
      album: item.album,
      albumart: item.albumart
    };
  }

  function onSources(list) {
    sources = Array.isArray(list) ? list : [];
    if (!nav.length) renderSources();
  }

  function renderSources() {
    els.viewBrowse.classList.add('at-root');
    els.browseTitle.textContent = t('library');
    els.playAll.hidden = true;
    if (!sources) {
      els.browseList.innerHTML = LOADING;
      return;
    }
    if (!sources.length) {
      els.browseList.innerHTML = emptyHtml('library', t('noSources'));
      return;
    }
    els.browseList.innerHTML = '<div class="tiles">' + sources.map(function (s, i) {
      // Volumio-eigene Quellen bekommen passende Icons (deren PNGs sind dunkel und auf den
      // Kacheln kaum sichtbar), Plugin-Quellen wie Streamingdienste behalten ihr Logo
      var own = SOURCE_ICONS[s.uri];
      var img = !own && s.albumart ? '<img loading="lazy" alt="" draggable="false" src="' + esc(artUrl(s.albumart)) + '" onerror="this.remove()">' : '';
      return '<div class="tile" data-key="src:' + i + '"><div class="ticon">' + icon(own || iconFor(s)) + img + '</div>' +
        '<b>' + esc(s.name || s.title) + '</b></div>';
    }).join('') + '</div>';
    els.browseList.scrollTop = sourcesScroll;
  }

  function browseTo(uri, title) {
    var top = nav[nav.length - 1];
    if (top) top.scroll = els.browseList.scrollTop;
    else sourcesScroll = els.browseList.scrollTop;
    var entry = { uri: uri, title: title, data: null, scroll: 0, filter: '' };
    nav.push(entry);
    requestBrowse(entry);
  }

  function setFilterField(entry, title) {
    els.filterInput.placeholder = title || '';
    els.filterInput.value = entry.filter || '';
    syncFilter();
  }

  function requestBrowse(entry) {
    els.viewBrowse.classList.remove('at-root');
    setFilterField(entry, entry.title);
    els.playAll.hidden = true;
    els.browseList.innerHTML = LOADING;
    pending = { target: 'browse', entry: entry };
    emit('browseLibrary', { uri: entry.uri });
  }

  function goBack() {
    closeKeyboard();
    var cur = nav.pop();
    if (pending && pending.entry === cur) pending = null;
    var top = nav[nav.length - 1];
    if (!top) return renderSources();
    if (top.data) renderBrowse(top);
    else requestBrowse(top);
  }

  els.back.addEventListener('click', goBack);

  function onBrowse(data) {
    var p = pending;
    pending = null;
    if (p && p.target === 'search') return renderSearch(data);
    var entry = p ? p.entry : nav[nav.length - 1];
    if (!entry || nav.indexOf(entry) === -1) return; // inzwischen zurück navigiert
    entry.data = data;
    renderBrowse(entry);
  }

  function getLists(data) {
    var n = data && data.navigation;
    return n && Array.isArray(n.lists) ? n.lists : [];
  }

  // Kleinschreibung ohne Akzente, damit "beyonce" auch "Beyoncé" findet
  function norm(s) {
    s = String(s || '').toLowerCase();
    return s.normalize ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : s;
  }

  function matches(item, q) {
    if (item._q == null) item._q = norm([item.title, item.name, item.artist, item.album].join(' '));
    return item._q.indexOf(q) !== -1;
  }

  function renderLists(container, lists, ctx, filter) {
    ctx.lists = lists;
    var q = norm(filter).trim();
    var html = '';
    lists.forEach(function (list, li) {
      var items = list.items || [];
      var rows = '';
      items.forEach(function (item, ii) {
        if (q && !matches(item, q)) return;
        var playable = isPlayable(item);
        rows += rowHtml({
          key: li + ':' + ii,
          icon: iconFor(item),
          thumb: artUrl(item.albumart),
          title: item.title || item.name || item.uri,
          sub: [item.artist, item.album].filter(Boolean).join(' · '),
          right: playable ? (Number(item.duration) > 0 ? fmtTime(item.duration) : '') : icon('chevron'),
          more: !!item.uri
        });
      });
      if (!rows) return;
      if (list.title) html += '<div class="list-title">' + esc(list.title) + '</div>';
      html += rows;
    });
    container.innerHTML = html;
    return !!html;
  }

  function renderBrowse(entry) {
    els.viewBrowse.classList.remove('at-root');
    var info = entry.data && entry.data.navigation && entry.data.navigation.info;
    setFilterField(entry, entry.title || (info && (info.album || info.title)) || t('library'));
    var lists = getLists(entry.data);
    if (!renderLists(els.browseList, lists, browseCtx, entry.filter)) {
      els.browseList.innerHTML = entry.filter
        ? emptyHtml('search', t('noResults', { q: entry.filter }))
        : emptyHtml('folder', t('folderEmpty'));
    }
    els.playAll.hidden = !firstSong(lists);
    els.browseList.scrollTop = entry.scroll || 0;
  }

  function firstSong(lists) {
    for (var li = 0; li < lists.length; li++) {
      var items = lists[li].items || [];
      for (var ii = 0; ii < items.length; ii++) {
        if (isPlayable(items[ii]) && !isRadio(items[ii])) return { list: items, index: ii };
      }
    }
    return null;
  }

  els.playAll.addEventListener('click', function () {
    var top = nav[nav.length - 1];
    var hit = top && firstSong(getLists(top.data));
    if (!hit) return;
    var songs = hit.list.filter(function (it) { return isPlayable(it) && !isRadio(it); });
    emit('playItemsList', { item: songs[0], list: songs, index: 0 });
  });

  function playItem(item, list, index) {
    if (isRadio(item)) emit('replaceAndPlay', cleanItem(item));
    else if (isPlayable(item)) emit('playItemsList', { item: item, list: list, index: index });
    else emit('replaceAndPlay', cleanItem(item));
  }

  function itemMenu(item, list, index, fromSearch, anchor) {
    var actions = [
      { icon: 'play', label: t('play'), cls: 'primary', fn: function () { playItem(item, list, index); } },
      { icon: 'add', label: t('addToQueue'), fn: function () { emit('addToQueue', cleanItem(item)); } }
    ];
    if (!isPlayable(item)) {
      actions.push({ icon: 'chevron', label: t('open'), fn: function () { openItem(item, fromSearch); } });
    }
    openSheet(item.title || item.name, [item.artist, item.album].filter(Boolean).join(' · '), actions, anchor);
  }

  function openItem(item, fromSearch) {
    if (fromSearch) switchTab('browse');
    browseTo(item.uri, item.title || item.name);
  }

  function onListTap(ctx, fromSearch) {
    return function (key, action, anchor) {
      var parts = key.split(':');
      var list = ctx.lists[+parts[0]];
      var item = list && list.items[+parts[1]];
      if (!item) return;
      if (action === 'more') return itemMenu(item, list.items, +parts[1], fromSearch, anchor);
      if (isPlayable(item)) playItem(item, list.items, +parts[1]);
      else if (item.uri) openItem(item, fromSearch);
    };
  }

  function onListLong(ctx, fromSearch) {
    return function (key, anchor) {
      var parts = key.split(':');
      var list = ctx.lists[+parts[0]];
      var item = list && list.items[+parts[1]];
      if (item && item.uri) itemMenu(item, list.items, +parts[1], fromSearch, anchor);
    };
  }

  var browseTap = onListTap(browseCtx, false);
  var browseLong = onListLong(browseCtx, false);

  bindList(els.browseList, {
    tap: function (key, action, anchor) {
      if (key.indexOf('src:') === 0) {
        var s = sources[+key.slice(4)];
        if (s) browseTo(s.uri, s.name || s.title);
        return;
      }
      browseTap(key, action, anchor);
    },
    long: function (key, anchor) {
      if (key.indexOf('src:') !== 0) browseLong(key, anchor);
    }
  });

  // ================================================================ Such- und Filterfelder

  function bindField(input, box, clearBtn, opts) {
    function sync() { box.classList.toggle('is-empty', !input.value); }
    input.addEventListener('input', function () {
      sync();
      opts.onInput();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        opts.onGo();
      }
    });
    input.addEventListener('focus', function () {
      box.classList.add('focus');
      openKeyboard(input, opts.onGo);
    });
    input.addEventListener('blur', function () { box.classList.remove('focus'); });
    input.addEventListener('pointerdown', function () { openKeyboard(input, opts.onGo); });
    clearBtn.addEventListener('click', function (e) {
      e.preventDefault();
      input.value = '';
      sync();
      opts.onInput();
      openKeyboard(input, opts.onGo);
    });
    return sync;
  }

  // ---------------------------------------------------------------- Filter in der Bibliothek

  var filterTimer = null;

  var syncFilter = bindField(els.filterInput, els.filterBox, els.filterClear, {
    onInput: function () {
      clearTimeout(filterTimer);
      filterTimer = setTimeout(function () {
        var top = nav[nav.length - 1];
        if (!top || !top.data) return;
        top.filter = els.filterInput.value;
        top.scroll = 0;
        renderBrowse(top);
      }, 60);
    },
    onGo: function () { closeKeyboard(); }
  });

  // ---------------------------------------------------------------- Suche

  var searchTimer = null;
  var lastQuery = '';

  function searchIdle() {
    els.searchList.innerHTML = emptyHtml('search', t('search'), t('searchHint'));
  }

  function doSearch(immediate) {
    clearTimeout(searchTimer);
    var q = els.searchInput.value.trim();
    if (q.length < 2) {
      if (!q.length) {
        lastQuery = '';
        searchIdle();
      } else if (immediate) {
        els.searchList.innerHTML = emptyHtml('search', t('searchMin'));
      }
      return;
    }
    if (q === lastQuery && !immediate) return;
    lastQuery = q;
    els.searchList.innerHTML = LOADING;
    pending = { target: 'search' };
    emit('search', { value: q });
  }

  function renderSearch(data) {
    if (!renderLists(els.searchList, getLists(data), searchCtx)) {
      els.searchList.innerHTML = emptyHtml('search', t('noResults', { q: lastQuery }));
    }
    els.searchList.scrollTop = 0;
  }

  function submitSearch() {
    doSearch(true);
    closeKeyboard();
  }

  var syncSearch = bindField(els.searchInput, els.searchBox, els.searchClear, {
    onInput: function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { doSearch(false); }, 900);
    },
    onGo: submitSearch
  });

  bindList(els.searchList, { tap: onListTap(searchCtx, true), long: onListLong(searchCtx, true) });

  // ---------------------------------------------------------------- Bildschirmtastatur

  var KB_LAYOUTS = {
    // 10 Spalten (Querformat): QWERTZ
    wide: { cols: 10, abc: 'qwertzuiopasdfghjklöyxcvbnmäüß', num: '1234567890-.,&\'!?()/+:#@"*=_;%' },
    // 7 Spalten (Hochformat): alphabetisch, damit die Tasten groß genug bleiben
    narrow: { cols: 7, abc: 'abcdefghijklmnopqrstuvwxyzäöüß-.\'&,', num: '1234567890+-.,&\'!?()/:#@"*=_' }
  };
  var kb = { input: null, onGo: null, layer: 'abc', built: null };

  function openKeyboard(input, onGo) {
    if (!builtinKeyboard()) return;
    kb.input = input;
    kb.onGo = onGo;
    els.body.classList.add('kb-open');
    renderKeyboard();
  }

  function closeKeyboard() {
    els.body.classList.remove('kb-open');
    if (kb.input) kb.input.blur();
    kb.input = null;
  }

  function renderKeyboard() {
    var width = els.keyboard.clientWidth || window.innerWidth;
    var layout = width / 10 >= 36 ? KB_LAYOUTS.wide : KB_LAYOUTS.narrow;
    var goIcon = kb.input === els.filterInput ? 'check' : 'search';
    var id = layout.cols + kb.layer + goIcon;
    if (kb.built !== id) {
      kb.built = id;
      var chars = layout[kb.layer];
      var html = '';
      for (var i = 0; i < chars.length; i += layout.cols) {
        html += '<div class="kb-row">' + chars.slice(i, i + layout.cols).split('').map(function (c) {
          return '<button class="key" data-k="' + esc(c) + '">' + esc(c) + '</button>';
        }).join('') + '</div>';
      }
      var wide = layout.cols >= 10;
      var key = function (k, cls, grow, content, label) {
        return '<button class="key ' + cls + '" data-k="' + k + '" style="flex-grow:' + grow + '"' +
          (label ? ' aria-label="' + esc(label) + '"' : '') + '>' + content + '</button>';
      };
      html += '<div class="kb-row">' +
        key('layer', 'fn', wide ? 1.5 : 1, kb.layer === 'abc' ? '123' : 'abc') +
        key(' ', 'fn', wide ? 4 : 2, '', t('space')) +
        key('bksp', 'fn', wide ? 1.5 : 1, icon('backspace')) +
        key('hide', 'fn', 1, icon('expandMore'), t('hideKeyboard')) +
        key('go', 'go', 2, icon(goIcon)) +
        '</div>';
      els.keyboard.innerHTML = html;
    }
    // Im Hochformat schrumpft das Panel um die Tastaturhöhe, damit die Liste sichtbar bleibt
    document.documentElement.style.setProperty('--kb-h', els.keyboard.offsetHeight + 'px');
  }

  (function () {
    var repeatTimer = null;
    function stopRepeat() {
      clearTimeout(repeatTimer);
      clearInterval(repeatTimer);
      repeatTimer = null;
    }
    function press(k) {
      var input = kb.input;
      if (k === 'layer') {
        kb.layer = kb.layer === 'abc' ? 'num' : 'abc';
        renderKeyboard();
        return;
      }
      if (k === 'hide' || !input) return closeKeyboard();
      if (k === 'go') return kb.onGo ? kb.onGo() : closeKeyboard();
      if (k === 'bksp') input.value = input.value.slice(0, -1);
      else input.value += k;
      input.dispatchEvent(new Event('input'));
    }
    els.keyboard.addEventListener('pointerdown', function (e) {
      e.preventDefault(); // Fokus im Eingabefeld behalten
      var b = e.target.closest('.key');
      if (!b) return;
      var k = b.dataset.k;
      b.classList.add('pressed');
      setTimeout(function () { b.classList.remove('pressed'); }, 140);
      press(k);
      if (k === 'bksp') {
        repeatTimer = setTimeout(function () {
          repeatTimer = setInterval(function () { press('bksp'); }, 75);
        }, 450);
      }
    });
    els.keyboard.addEventListener('pointerup', stopRepeat);
    els.keyboard.addEventListener('pointercancel', stopRepeat);
    els.keyboard.addEventListener('pointerleave', stopRepeat);
  })();

  // ================================================================ Volumio-Einstellungen

  // Volumios eigenes Menü passt nicht auf 320 px Höhe. Deshalb zeigen wir die Menüpunkte als
  // große Kacheln und öffnen die jeweilige Volumio-Seite eingebettet.
  var MENU_ICONS = {
    mymusic: 'library',
    playback_options: 'volUp',
    appearance: 'palette',
    network: 'wifi',
    system: 'settings',
    'plugin-manager': 'extension'
  };
  var menuItems = [];

  function onMenuItems(list) {
    menuItems = [];
    (Array.isArray(list) ? list : []).forEach(function (m) {
      if (m.state === 'volumio.plugin' && m.params && m.params.pluginName) {
        menuItems.push({ id: m.id, name: m.name, path: '/plugin/' + m.params.pluginName.replace('/', '-') });
      } else if (m.state === 'volumio.plugin-manager') {
        menuItems.push({ id: m.id, name: m.name, path: '/plugin-manager' });
      }
    });
    renderSystemMenu();
  }

  function renderSystemMenu() {
    var items = menuItems.concat([
      { id: 'updateDb', name: t('updateLibrary'), icon: 'refresh' },
      { id: 'rescanDb', name: t('rescanLibrary'), icon: 'sync' },
      { id: 'theme', name: 'Fascia', path: '/plugin/user_interface-fascia', icon: 'brush' },
      { id: 'reboot', name: t('reboot'), icon: 'restart' },
      { id: 'power', name: t('power'), icon: 'power', cls: 'danger' }
    ]);
    els.systemTiles.innerHTML = items.map(function (m, i) {
      return '<div class="tile' + (m.cls ? ' ' + m.cls : '') + '" data-i="' + i + '">' +
        '<div class="ticon">' + icon(m.icon || MENU_ICONS[m.id] || 'settings') + '</div>' +
        '<b>' + esc(m.name) + '</b></div>';
    }).join('');
    renderSystemMenu.items = items;
  }

  els.systemTiles.addEventListener('click', function (e) {
    var tile = e.target.closest('.tile');
    var m = tile && renderSystemMenu.items[+tile.dataset.i];
    if (!m) return;
    if (m.id === 'updateDb') {
      emit('updateDb');
      toast(t('libraryUpdating'));
      return;
    }
    if (m.id === 'rescanDb') {
      openSheet(t('rescanTitle'), t('rescanSub'), [
        { icon: 'sync', label: t('rescanLibrary'), cls: 'primary', fn: function () {
          emit('rescanDb');
          toast(t('libraryRescanning'));
        } },
        { icon: 'close', label: t('cancel') }
      ], anchorY(tile));
      return;
    }
    if (m.id === 'reboot') {
      openSheet(t('rebootTitle'), t('rebootSub'), [
        { icon: 'restart', label: t('reboot'), cls: 'primary', fn: function () { emit('reboot'); } },
        { icon: 'close', label: t('cancel') }
      ], anchorY(tile));
      return;
    }
    if (m.id === 'power') {
      openSheet(t('powerTitle'), '', [
        { icon: 'power', label: t('shutdown'), cls: 'danger', fn: function () { emit('shutdown'); } },
        { icon: 'close', label: t('cancel') }
      ], anchorY(tile));
      return;
    }
    openSystemPage(m);
  });

  function openSystemPage(m) {
    els.systemTitle.textContent = m.name;
    els.systemFrame.src = m.url || VOLUMIO + m.path;
    els.system.classList.add('page');
  }

  function showSystemMenu() {
    els.system.classList.remove('page');
    els.systemTitle.textContent = t('settings');
    els.systemFrame.src = 'about:blank';
  }

  function openSystem() {
    closeKeyboard();
    closeSheet();
    renderSystemMenu();
    emit('getMenuItems');
    showSystemMenu();
    els.system.classList.add('open');
    els.body.classList.add('system-open');
  }

  function closeSystem() {
    els.system.classList.remove('open');
    els.body.classList.remove('system-open');
    showSystemMenu();
    emit('getState');
    emit('getQueue');
  }

  els.btnSystem.addEventListener('click', openSystem);
  els.systemBack.addEventListener('click', showSystemMenu);
  els.systemClose.addEventListener('click', closeSystem);

  // ================================================================ Songtext & Infos

  // Songtexte kommen von LRCLIB (mit Zeitstempeln laufen sie mit), Infos von Wikipedia. Beides
  // holt der Theme-Server und speichert es zwischen (lib/songinfo.js).
  var song = { key: null, lyrics: null, lyricsFor: null, info: null, infoFor: null, lines: null, index: -1 };
  var songView = { open: false, view: 'lyrics', manualAt: 0 };
  // Zeile minimal vor ihrem Zeitstempel zeigen: wirkt mitlaufend statt nachhinkend
  var LYRIC_LEAD = 250;

  function trackKey() { return [state.artist || '', state.title || '', state.album || ''].join('\n'); }

  function trackQuery() {
    return new URLSearchParams({
      artist: state.artist || '', title: state.title || '', album: state.album || '',
      duration: String(Number(state.duration) || 0), lang: lang
    }).toString();
  }

  function getJson(url) {
    return fetch(url, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : { offline: true }; })
      .catch(function () { return { offline: true }; });
  }

  function onTrackChange() {
    song.key = trackKey();
    song.lyrics = song.info = song.lines = null;
    song.lyricsFor = song.infoFor = null;
    song.index = -1;
    setInlineLyric('');
    // Webradio: Zeilen laufen nicht mit (keine Position im Titel), also nur für den Dialog laden
    if ((settings.lyricsInline && !isLive()) || (songView.open && songView.view === 'lyrics')) loadLyrics();
    if (songView.open) showSongView(songView.view);
  }

  // LRC: "[01:23.45] Text", auch mehrere Zeitstempel pro Zeile und "[offset:+200]"
  function parseLrc(text) {
    var lines = [];
    var offset = 0;
    String(text).split(/\r?\n/).forEach(function (row) {
      var m = row.match(/^\[offset:\s*([+-]?\d+)\]/i);
      if (m) {
        offset = Number(m[1]);
        return;
      }
      var stamps = [];
      var rest = row.replace(/\[(\d+):(\d+(?:[.:]\d+)?)\]/g, function (_, mm, ss) {
        stamps.push((Number(mm) * 60 + Number(ss.replace(':', '.'))) * 1000);
        return '';
      });
      stamps.forEach(function (ms) { lines.push({ t: ms, text: rest.trim() }); });
    });
    lines.forEach(function (l) { l.t -= offset; });
    lines.sort(function (a, b) { return a.t - b.t; });
    return lines.length ? lines : null;
  }

  function loadLyrics() {
    var key = song.key;
    if (!state.title || song.lyricsFor === key) return;
    song.lyricsFor = key;
    song.lyrics = { loading: true };
    renderLyrics();
    getJson('api/lyrics?' + trackQuery()).then(function (r) {
      if (song.key !== key) return;
      song.lyrics = r;
      if (r.offline) {
        // Z. B. Internet nach dem Start noch nicht da: für den Songtext im Player erneut versuchen
        song.lyricsFor = null;
        setTimeout(function () {
          if (song.key === key && settings.lyricsInline && !isLive()) loadLyrics();
        }, 30000);
      }
      song.lines = r.data && r.data.synced && !isLive() ? parseLrc(r.data.synced) : null;
      song.index = -1;
      renderLyrics();
      updateLyrics(true);
      lyricsFeedback();
    });
  }

  function loadInfo() {
    var key = song.key;
    if ((!state.title && !state.artist) || song.infoFor === key) return;
    song.infoFor = key;
    song.info = { loading: true };
    renderInfo();
    getJson('api/info?' + trackQuery()).then(function (r) {
      if (song.key !== key) return;
      song.info = r;
      if (r.offline) song.infoFor = null;
      renderInfo();
    });
  }

  function updateLyrics(force) {
    var lines = song.lines;
    if (!lines) return;
    var ms = elapsedMs() + LYRIC_LEAD;
    var i = song.index;
    if (i < 0 || lines[i].t > ms || (i + 1 < lines.length && lines[i + 1].t <= ms)) {
      i = -1;
      for (var k = 0; k < lines.length && lines[k].t <= ms; k++) i = k;
    }
    if (i === song.index && !force) return;
    song.index = i;
    setInlineLyric(i >= 0 ? lines[i].text : '');
    if (songView.open && songView.view === 'lyrics') highlightLyric(i, force);
  }

  // Aktuelle Zeile über dem Positionsregler (über den Analyzer-Balken)
  var inlineText = null;
  function setInlineLyric(text) {
    if (!settings.lyricsInline || isLive()) text = '';
    if (text === inlineText) return;
    inlineText = text;
    els.body.classList.toggle('has-lyric', !!text);
    var span = els.lyricInline;
    clearTimeout(setInlineLyric.timer);
    span.classList.add('out');
    setInlineLyric.timer = setTimeout(function () {
      span.textContent = text;
      span.classList.remove('out');
    }, 180);
  }

  // Nach dem Einschalten Bescheid geben, wenn zu diesem Titel kein mitlaufender Text da ist
  var wantFeedback = false;
  function lyricsFeedback() {
    if (!wantFeedback || !song.lyrics || song.lyrics.loading) return;
    wantFeedback = false;
    if (!song.lines && state.title) toast(t('noSyncedLyrics'));
  }

  function applyLyricsInline() {
    var on = !!settings.lyricsInline;
    els.body.classList.toggle('lyrics-inline', on);
    els.lyricsSwitch.classList.toggle('on', on);
    els.lyricsSwitch.setAttribute('aria-pressed', String(on));
    if (on && !isLive()) loadLyrics();
    song.index = -1;
    if (song.lines) updateLyrics(true);
    else setInlineLyric('');
  }

  // Umschalter in der Bedienleiste: speichert die Einstellung, damit alle Anzeigen sie übernehmen
  els.lyricsSwitch.addEventListener('click', function () {
    settings.lyricsInline = !settings.lyricsInline;
    wantFeedback = settings.lyricsInline;
    applyLyricsInline();
    lyricsFeedback();
    fetch('api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lyricsInline: settings.lyricsInline })
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (s) { if (s) applySettings(s); })
      .catch(function () { /* bleibt lokal umgeschaltet */ });
  });

  // Titel und Künstler über Songtext und Infos (im Querformat hat die Leiste keinen Platz dafür)
  function songHead() {
    return '<div class="si-head"><b>' + esc(state.title || '') + '</b>' +
      (state.artist ? '<span>' + esc(state.artist) + '</span>' : '') + '</div>';
  }

  function renderLyrics() {
    if (!songView.open) return;
    var box = els.siLyrics;
    var r = song.lyrics;
    var d = r && r.data;
    box.classList.toggle('synced', !!song.lines);
    if (!state.title) box.innerHTML = emptyHtml('lyrics', t('nothingPlaying'));
    else if (!r || r.loading) box.innerHTML = songHead() + LOADING;
    else if (r.offline) box.innerHTML = songHead() + emptyHtml('lyrics', t('noConnection'), t('noConnectionHint'));
    else if (song.lines) {
      box.innerHTML = songHead() + song.lines.map(function (l, i) {
        return '<p class="ly' + (l.text ? '' : ' gap') + '" data-i="' + i + '">' + (esc(l.text) || '♪') + '</p>';
      }).join('') + '<p class="si-source">' + esc(t('lyricsSource')) + '</p>';
    } else if (d && (d.plain || d.synced)) {
      var plain = d.plain || d.synced.replace(/\[[^\]]*\]\s*/g, '');
      box.innerHTML = songHead() + '<p class="si-note">' + esc(t('lyricsNotSynced')) + '</p><p class="ly-plain">' + esc(plain) + '</p>' +
        '<p class="si-source">' + esc(t('lyricsSource')) + '</p>';
    } else box.innerHTML = songHead() + emptyHtml('lyrics', d && d.instrumental ? t('instrumental') : t('noLyrics'));
  }

  function highlightLyric(i, instant) {
    var box = els.siLyrics;
    var prev = box.querySelector('.ly.on');
    if (prev) prev.classList.remove('on');
    var el = i >= 0 ? box.querySelector('.ly[data-i="' + i + '"]') : null;
    if (!el) return;
    el.classList.add('on');
    // Nach eigenem Scrollen kurz nicht zurückspringen
    if (Date.now() - songView.manualAt < 4000) return;
    box.scrollTo({ top: el.offsetTop - box.clientHeight / 2 + el.offsetHeight / 2, behavior: instant ? 'auto' : 'smooth' });
  }

  function renderInfo() {
    if (!songView.open) return;
    var box = els.siInfo;
    var r = song.info;
    var d = r && r.data;
    if (!state.title && !state.artist) box.innerHTML = emptyHtml('info', t('nothingPlaying'));
    else if (!r || r.loading) box.innerHTML = songHead() + LOADING;
    else if (r.offline) box.innerHTML = songHead() + emptyHtml('info', t('noConnection'), t('noConnectionHint'));
    else if (!d) box.innerHTML = songHead() + emptyHtml('info', t('noInfo'));
    else {
      var kinds = { track: 'infoTrack', album: 'infoAlbum', artist: 'infoArtist' };
      box.innerHTML = songHead() + '<div class="si-cards">' + d.sections.map(function (s) {
        return '<article class="si-card">' + (s.thumb ? '<img src="' + esc(s.thumb) + '" alt="" loading="lazy">' : '') +
          '<div><div class="si-kind">' + esc(t(kinds[s.kind])) + '</div><h3>' + esc(s.title.replace(/\s*\([^)]*\)$/, '')) + '</h3>' +
          (s.description ? '<div class="si-desc">' + esc(s.description) + '</div>' : '') +
          '<p>' + esc(s.extract) + '</p></div></article>';
      }).join('') + '</div><p class="si-source">' + esc(t('infoSource')) + '</p>';
    }
  }

  function showSongView(view) {
    songView.view = view;
    els.songInfo.dataset.view = view;
    Array.prototype.forEach.call(els.songInfo.querySelectorAll('.si-tab'), function (b) {
      b.classList.toggle('on', b.dataset.view === view);
    });
    if (view === 'lyrics') {
      loadLyrics();
      renderLyrics();
      songView.manualAt = 0;
      song.index = -1;
      updateLyrics(true);
    } else {
      loadInfo();
      renderInfo();
    }
  }

  function openSongInfo(view) {
    closeKeyboard();
    closeSheet();
    songView.open = true;
    els.songInfo.classList.add('open');
    showSongView(view);
  }

  function closeSongInfo() {
    songView.open = false;
    els.songInfo.classList.remove('open');
    updateProgress();
  }

  els.lyricsBtn.addEventListener('click', function () { openSongInfo('lyrics'); });
  els.infoBtn.addEventListener('click', function () { openSongInfo('info'); });
  els.siClose.addEventListener('click', closeSongInfo);
  Array.prototype.forEach.call(els.songInfo.querySelectorAll('.si-tab'), function (b) {
    b.addEventListener('click', function () { showSongView(b.dataset.view); });
  });
  ['pointerdown', 'wheel', 'touchstart', 'touchmove'].forEach(function (ev) {
    els.siLyrics.addEventListener(ev, function () { songView.manualAt = Date.now(); }, { passive: true });
  });
  els.siLyrics.addEventListener('pointermove', function (e) {
    if (e.buttons) songView.manualAt = Date.now();
  }, { passive: true });
  // Tipp auf eine Zeile springt dorthin
  els.siLyrics.addEventListener('click', function (e) {
    var el = e.target.closest('.ly');
    if (!el || !song.lines || isLive()) return;
    // Aufrunden: Volumio springt nur auf ganze Sekunden, so landet es nie vor der Zeile
    var sec = Math.max(0, Math.ceil(song.lines[+el.dataset.i].t / 1000));
    seekBase.ms = sec * 1000;
    seekBase.at = performance.now();
    lastSecond = -1;
    emit('seek', sec);
    songView.manualAt = 0;
    updateLyrics(true);
  });

  // ================================================================ Zonen & Ausgänge

  // Wie in Volumios Oberfläche: dieses Gerät, weitere Volumio-Geräte im Netzwerk (Multiroom) und
  // zuschaltbare Ausgänge, jeweils mit eigener Lautstärke
  var zones = { open: false, devices: [], outputs: [], outputDevice: '', sliders: [], timers: {} };

  function openZones() {
    closeSheet();
    closeKeyboard();
    zones.open = true;
    els.zones.classList.add('open');
    renderZones();
    emit('getMultiRoomDevices');
    emit('getAudioOutputs');
    emit('getOutputDevices');
  }

  function closeZones() {
    zones.open = false;
    els.zones.classList.remove('open');
  }

  els.zonesClose.addEventListener('click', closeZones);
  els.zones.addEventListener('click', function (e) {
    if (!e.target.closest('.zones-card')) closeZones();
  });

  function zoneDragging() {
    return zones.sliders.some(function (z) { return z.slider.dragging; });
  }

  function refreshZones() {
    if (zones.open && !zoneDragging()) renderZones();
  }

  function zoneHtml(z, i) {
    var right = '';
    if (z.kind === 'self') {
      right = '<button class="tbtn' + (state.mute ? ' on' : '') + '" data-zone-action="mute" aria-label="' +
        esc(state.mute ? t('unmute') : t('mute')) + '">' + icon(state.mute ? 'volOff' : 'volUp') + '</button>';
    } else if (z.kind === 'device' && z.host) {
      right = '<button class="tbtn" data-zone-action="open" aria-label="' + esc(t('open')) + '">' + icon('chevron') + '</button>';
    } else if (z.kind === 'output') {
      right = '<button class="switch' + (z.enabled ? ' on' : '') + '" data-zone-action="toggle" aria-label="' + esc(z.name) + '"></button>';
    }
    var vol = z.volume != null ? '<div class="zone-vol"><div class="slider" role="slider" aria-label="' + esc(z.name) + '">' +
      '<div class="track"><div class="bar"><div class="fill"></div></div><div class="thumb-pos"><div class="thumb"></div></div></div>' +
      '</div><span class="zone-val">' + Math.round(z.volume) + '</span></div>' : '';
    return '<div class="zone" data-i="' + i + '"><div class="zone-top">' +
      '<div class="zone-icon">' + icon(z.kind === 'output' ? 'volUp' : 'speaker') + '</div>' +
      '<div class="txt"><div class="t1">' + esc(z.name) + '</div>' + (z.sub ? '<div class="t2">' + esc(z.sub) + '</div>' : '') + '</div>' +
      right + '</div>' + vol + '</div>';
  }

  function renderZones() {
    var self = zones.devices.filter(function (d) { return d.isSelf; })[0];
    var list = [{
      kind: 'self',
      name: (self && self.name) || t('thisDevice'),
      sub: zones.outputDevice ? t('outputVia', { name: zones.outputDevice }) : t('thisDevice'),
      volume: state.disableVolumeControl ? null : Math.max(0, Math.min(100, Number(state.volume) || 0))
    }];
    var others = zones.devices.filter(function (d) { return !d.isSelf; }).map(function (d) {
      var st = d.state || {};
      return {
        kind: 'device', id: d.id, type: d.type, host: d.host, name: d.name,
        sub: [st.artist, st.track].filter(Boolean).join(' – '),
        volume: d.volumeAvailable === false ? null : Number(st.volume) || 0
      };
    });
    var known = zones.devices.map(function (d) { return d.id; });
    var outputs = zones.outputs.filter(function (o) {
      return o.type !== 'browser' && known.indexOf(o.id) === -1;
    }).map(function (o) {
      return {
        kind: 'output', id: o.id, type: o.type, host: o.host, name: o.name || o.id, enabled: !!o.enabled,
        sub: o.available === false ? '–' : '',
        volume: o.enabled && o.volume != null ? Number(o.volume) || 0 : null
      };
    });

    var html = zoneHtml(list[0], 0);
    var all = list.slice();
    html += '<div class="list-title">' + esc(t('otherDevices')) + '</div>';
    if (others.length) {
      others.forEach(function (z) { html += zoneHtml(z, all.length); all.push(z); });
    } else {
      html += '<div class="zones-empty">' + esc(t('noDevices')) + '</div>';
    }
    if (outputs.length) {
      html += '<div class="list-title">' + esc(t('outputs')) + '</div>';
      outputs.forEach(function (z) { html += zoneHtml(z, all.length); all.push(z); });
    }
    els.zonesList.innerHTML = html;
    zones.list = all;

    zones.sliders = [];
    Array.prototype.forEach.call(els.zonesList.querySelectorAll('.zone'), function (row) {
      var z = all[+row.dataset.i];
      var el = row.querySelector('.slider');
      if (!el) return;
      var value = row.querySelector('.zone-val');
      var slider = new Slider(el, {
        onInput: function (v) {
          var n = Math.round(v * 100);
          value.textContent = n;
          setZoneVolume(z, n, false);
        },
        onChange: function (v) { setZoneVolume(z, Math.round(v * 100), true); }
      });
      slider.set(z.volume / 100);
      zones.sliders.push({ zone: z, slider: slider, value: value });
    });
  }

  function setZoneVolume(z, volume, now) {
    if (z.kind === 'self') {
      els.volumeValue.textContent = volume;
      volSlider.set(volume / 100);
      return sendVolume(volume, now);
    }
    var send = function () {
      delete zones.timers[z.id];
      emit('setAudioOutputVolume', { id: z.id, type: z.type, host: z.host, mute: false, volume: volume, isSelf: false });
    };
    clearTimeout(zones.timers[z.id]);
    if (now) send();
    else zones.timers[z.id] = setTimeout(send, 150);
  }

  els.zonesList.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-zone-action]');
    var row = e.target.closest('.zone');
    var z = row && zones.list[+row.dataset.i];
    if (!btn || !z) return;
    var action = btn.dataset.zoneAction;
    if (action === 'mute') {
      emit(state.mute ? 'unmute' : 'mute');
    } else if (action === 'toggle') {
      emit(z.enabled ? 'disableAudioOutput' : 'enableAudioOutput', { id: z.id });
      btn.classList.toggle('on');
    } else if (action === 'open') {
      closeZones();
      openSystem();
      openSystemPage({ name: z.name, url: z.host });
    }
  });

  // Lautstärke und Stummschaltung dieses Geräts live nachführen
  function syncSelfZone() {
    if (!zones.open || zoneDragging()) return;
    renderZones();
  }

  // ================================================================ Uhr & Ruhebildschirm

  var lastTouch = Date.now();

  function fmtClock(d) {
    var h = d.getHours();
    if (!settings.clock24h) h = h % 12 || 12;
    return (settings.clock24h ? pad(h) : h) + ':' + pad(d.getMinutes());
  }

  function updateClock() {
    var d = new Date();
    var s = fmtClock(d);
    if (els.clock.textContent !== s) {
      els.clock.textContent = s;
      els.idleClock.textContent = s;
      els.idleDate.textContent = d.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', {
        weekday: 'long', day: 'numeric', month: 'long'
      });
    }
  }

  function showIdle() {
    if (els.idle.classList.contains('open')) return;
    closeSheet();
    els.idle.classList.add('open');
  }

  function hideIdle() { els.idle.classList.remove('open'); }

  document.addEventListener('pointerdown', function () { lastTouch = Date.now(); }, true);
  els.idle.addEventListener('click', hideIdle);

  setInterval(function () {
    updateClock();
    var timeout = Number(settings.idleTimeout) || 0;
    var busy = els.system.classList.contains('open');
    if (timeout > 0 && !busy && !isPlaying() && Date.now() - lastTouch > timeout * 1000) showIdle();
  }, 1000);

  // ================================================================ Start

  window.addEventListener('resize', function () {
    refreshMarquees();
    sizeSpectrum();
    kb.built = null;
    if (els.body.classList.contains('kb-open')) renderKeyboard();
  });

  requestAnimationFrame(frame);
  setInterval(loadSettings, 20000);

  applyLang();
  setAccent(DEFAULTS.accentColor);
  onState({});
  renderQueue();
  renderSources();
  searchIdle();
  syncSearch();
  syncFilter();
  // Bis die Einstellungen da sind eingeklappt; applySettings setzt dann den gewählten Start-Zustand
  setPanelLevel(0);
  var savedTab = storeGet('fascia.tab');
  switchTab(savedTab === 'browse' || savedTab === 'search' ? savedTab : 'queue');
  setOnline(false);

  loadSettings().then(connect, connect);
})();
