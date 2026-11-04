#!/bin/zsh
set -u
APP_DIR="/Users/maty/Documents/Codex/2026-11-03/crea-una-app-para-ense-arme"
STATE_DIR="/tmp/ensenamec-state"
mkdir -p "$STATE_DIR"
umask 077
if curl -fsS http://127.0.0.1:4173/api/status >/dev/null 2>&1; then
  echo "La app ya responde en http://localhost:4173"
else
  cd "$APP_DIR" || exit 1
  nohup node "$APP_DIR/server.js" > "$STATE_DIR/server.log" 2>&1 &
  echo $! > "$STATE_DIR/server.pid"
  for n in {1..30}; do curl -fsS http://127.0.0.1:4173/api/status >/dev/null 2>&1 && break; sleep 1; done
fi
chmod 600 "$STATE_DIR/server.log" 2>/dev/null || true
TUNNELS=$(curl -fsS http://127.0.0.1:4040/api/tunnels 2>/dev/null || true)
if [[ -n "$TUNNELS" ]] && print -r -- "$TUNNELS" | grep -q '"addr":"http://localhost:4173"'; then
  URL=$(print -r -- "$TUNNELS" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(next((t["public_url"] for t in d.get("tunnels",[]) if t.get("config",{}).get("addr")=="http://localhost:4173"), ""))')
  echo "App pública: $URL"
elif [[ -n "$TUNNELS" ]] && print -r -- "$TUNNELS" | grep -q '"public_url"'; then
  echo "No abrí otro túnel: ngrok ya está en uso. Detén primero el túnel activo desde su propio comando y vuelve a ejecutar ensenamec."
  exit 2
else
  nohup ngrok http 4173 --log "$STATE_DIR/ngrok.log" --log-format json > /dev/null 2>&1 &
  echo $! > "$STATE_DIR/ngrok.pid"
  for n in {1..30}; do
    URL=$(curl -fsS http://127.0.0.1:4040/api/tunnels 2>/dev/null | python3 -c 'import json,sys; d=json.load(sys.stdin); print(next((t["public_url"] for t in d.get("tunnels",[]) if t.get("config",{}).get("addr")=="http://localhost:4173"), ""))' 2>/dev/null)
    if [[ -n "${URL:-}" ]]; then
      echo "App pública: $URL"
      if [[ "$URL" == "https://ferocious-unheated-varied.ngrok-free.dev" ]]; then
        echo "Aviso: es el mismo dominio reservado en tu alias libros; ngrok Free no permite un subdominio adicional."
      fi
      exit 0
    fi
    sleep 1
  done
  echo "No pude leer la URL de ngrok. Revisa: $STATE_DIR/ngrok.log"
  exit 1
fi
