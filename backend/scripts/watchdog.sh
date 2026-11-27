#!/usr/bin/env bash
set -euo pipefail

cuentas=https://metrolimaapp-api.vercel.app/actuator/health
rutas=https://metrolimaapp.vercel.app/health
base="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
script=$(realpath "${BASH_SOURCE[0]}")

sondear() {
    local nombre=$1 url=$2 esperado=$3 cuerpo
    if cuerpo=$(curl -fsS --connect-timeout 8 --max-time 75 --retry 1 --retry-delay 2 "$url") &&
        [[ "$cuerpo" =~ \"status\"[[:space:]]*:[[:space:]]*\"$esperado\" ]]; then
        echo "$nombre: operativo"
    else
        echo "$nombre: sin respuesta saludable ($url)" >&2
        return 1
    fi
}

case "${1:-estado}" in
    instalar)
        mkdir -p "$base"
        cat > "$base/metrolima-watchdog.service" <<EOF
[Unit]
Description=Comprueba las APIs de MetroLimaApp

[Service]
Type=oneshot
ExecStart="$script" comprobar
EOF
        cat > "$base/metrolima-watchdog.timer" <<'EOF'
[Unit]
Description=Sondeo periódico de MetroLimaApp

[Timer]
OnStartupSec=30s
OnUnitInactiveSec=5min
AccuracySec=15s

[Install]
WantedBy=timers.target
EOF
        systemctl --user daemon-reload
        systemctl --user enable --now metrolima-watchdog.timer
        exec "$script" estado
        ;;
    estado)
        echo "Temporizador: $(systemctl --user is-active metrolima-watchdog.timer || true)"
        systemctl --user list-timers metrolima-watchdog.timer --no-pager
        exec "$script" comprobar
        ;;
    comprobar)
        fecha=$(TZ=America/Lima date '+%F %T %Z')
        echo "$fecha"
        sondear Cuentas "$cuentas" UP & cuentas_pid=$!
        sondear Rutas "$rutas" ok & rutas_pid=$!
        resultado=0
        wait "$cuentas_pid" || resultado=1
        wait "$rutas_pid" || resultado=1
        exit "$resultado"
        ;;
    logs) exec journalctl --user -u metrolima-watchdog.service -n 30 --no-pager ;;
    detener) exec systemctl --user disable --now metrolima-watchdog.timer ;;
    *) echo 'Uso: watchdog.sh [instalar|estado|comprobar|logs|detener]' >&2; exit 2 ;;
esac
