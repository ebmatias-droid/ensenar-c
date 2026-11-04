#!/bin/zsh
STATE_DIR="/tmp/aprenderc-state"
for pid in $(pgrep -f '^ngrok http 4173' 2>/dev/null || true); do
  kill "$pid" 2>/dev/null && echo "ngrok de C detenido."
done
for pid in $(lsof -tiTCP:4173 -sTCP:LISTEN 2>/dev/null || true); do
  command=$(ps -p "$pid" -o command= 2>/dev/null || true)
  case "$command" in
    *http.server\ 4173*|*server.js*) kill "$pid" 2>/dev/null && echo "Servidor de C detenido." ;;
  esac
done
rm -f "$STATE_DIR/ngrok.pid" "$STATE_DIR/server.pid"
echo "El túnel de Calibre (libros) no se modificó."
