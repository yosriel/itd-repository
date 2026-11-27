#!/usr/bin/env bash
set -euo pipefail

fallar() { echo "$*" >&2; exit 1; }

app=$(dirname "$(dirname "$(realpath "${BASH_SOURCE[0]}")")")
export ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/.local/share/android-sdk}}"
export ANDROID_AVD_HOME="${ANDROID_AVD_HOME:-${XDG_CONFIG_HOME:-$HOME/.config}/.android/avd}"
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-21-openjdk}"
export PATH="$JAVA_HOME/bin:$PATH"
adb="$ANDROID_HOME/platform-tools/adb"
emulator="$ANDROID_HOME/emulator/emulator"
manager="$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager"
avd=MetroLimaExpoGPS
unidad=metrolima-emulador.service
port=5560
serial="emulator-$port"
imagen='system-images;android-35;google_apis;x86_64'
apk="$app/artifacts/metrolimaapp.apk"
sha=dab6b3bfe3fd3354048fb562b7db9ad7836612807b4613ffca64c8d4535d4829
estado="${XDG_STATE_HOME:-$HOME/.local/state}/metrolima-demo"

[[ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]] || fallar 'Abre el script desde una sesión gráfica.'
[[ -x "$adb" && -x "$emulator" && -x "$manager" ]] || fallar 'Configura ANDROID_HOME con emulator, platform-tools y cmdline-tools/latest.'
"$JAVA_HOME/bin/java" -version 2>&1 | grep -Eq 'version "21[."]' || fallar 'Configura JAVA_HOME con el JDK 21.'
mkdir -p "$estado" "$ANDROID_AVD_HOME"
exec 9>"$estado/inicio.lock"
flock -n 9 || fallar 'El lanzador ya está preparando MetroLimaApp.'

if [[ ! -f "$apk" ]] || ! echo "$sha  $apk" | sha256sum --check --status; then
    mkdir -p "$(dirname "$apk")"
    descarga=$(mktemp "$apk.XXXXXX")
    trap 'rm -f -- "$descarga"' EXIT
    curl --fail --location --retry 2 --output "$descarga" https://metrolimaapp-android.vercel.app/metrolimaapp.apk
    echo "$sha  $descarga" | sha256sum --check --status || fallar 'La descarga difiere del APK verificado para esta versión.'
    mv -- "$descarga" "$apk"
    trap - EXIT
fi
echo "$sha  $apk" | sha256sum --check --status || fallar 'El APK local difiere de la versión indicada.'

if ! "$emulator" -list-avds | grep -Fxq "$avd"; then
    [[ -f "$ANDROID_HOME/system-images/android-35/google_apis/x86_64/system.img" ]] || fallar "Instala la imagen con sdkmanager '$imagen'."
    echo 'Preparando el teléfono virtual para la primera ejecución…'
    "$manager" create avd --name "$avd" --package "$imagen" --device pixel_2 <<< no
fi

dispositivo() { "$adb" -s "$serial" "$@"; }
if "$adb" devices | awk -v s="$serial" '$1==s {found=1} END {exit !found}'; then
    nombre=$(dispositivo emu avd name | head -n 1 | tr -d '\r')
    [[ "$nombre" == "$avd" ]] || fallar "El puerto $port está en uso por otro emulador."
elif ! systemctl --user is-active --quiet "$unidad"; then
    echo 'Abriendo el emulador Android…'
    systemd-run --user --collect --unit="$unidad" \
        --setenv="ANDROID_HOME=$ANDROID_HOME" --setenv="ANDROID_AVD_HOME=$ANDROID_AVD_HOME" \
        --property="StandardOutput=append:$estado/emulator.log" --property=StandardError=inherit \
        "$emulator" -avd "$avd" -port "$port" -gpu auto -no-boot-anim -memory 2048 -cores 2
    iniciado=1
fi

echo 'Esperando a Android…'
fin=$((SECONDS + 240))
until [[ "$(dispositivo shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == 1 ]]; do
    if [[ -n "${iniciado:-}" ]] && ! systemctl --user is-active --quiet "$unidad"; then
        fallar "Se cerró el emulador. Revisa $estado/emulator.log"
    fi
    (( SECONDS < fin )) || fallar "Android tardó más de cuatro minutos. Revisa $estado/emulator.log"
    sleep 2
done
dispositivo shell input keyevent KEYCODE_WAKEUP
dispositivo shell wm dismiss-keyguard
dispositivo install -r "$apk"
dispositivo shell am start -W -n com.metropolitanomobileapp/.MainActivity
echo 'MetroLimaApp está abierta. Toca «Pulsa para continuar» y luego «Ingresar».'
