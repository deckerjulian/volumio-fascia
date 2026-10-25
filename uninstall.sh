#!/bin/bash

echo "Uninstalling Fascia"

# Kiosk wieder auf die Standard-Oberfläche zurückstellen, falls er noch auf dieses Theme zeigt
# (auch die Marke "touchbar" der früheren Version "Touch Bar Theme")
KIOSK=/opt/volumiokiosk.sh
# (Der Benutzer volumio darf per sudo ohne Passwort u. a. tee und systemctl, aber nicht sed/cp.)
if [ -f "$KIOSK" ] && grep -qE 'http://localhost:[0-9]+/\?kiosk=(fascia|touchbar)' "$KIOSK"; then
  TMP=$(mktemp)
  sed -E -e 's#http://localhost:[0-9]+/\?kiosk=(fascia|touchbar)#http://localhost:3000#g' \
         -e 's#/dev/tcp/127\.0\.0\.1/[0-9]+#/dev/tcp/127.0.0.1/3000#g' "$KIOSK" > "$TMP"
  sudo -n /usr/bin/tee "$KIOSK" < "$TMP" >/dev/null
  rm -f "$TMP"
  sudo -n /bin/systemctl restart volumio-kiosk >/dev/null 2>&1
fi

echo "pluginuninstallend"
