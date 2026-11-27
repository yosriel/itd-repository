#!/usr/bin/env bash
set -euo pipefail
[[ ${EAS_BUILD_PLATFORM:-} == android ]] || exit 0
for url in "${EXPO_PUBLIC_API_URL:?Define la URL de Spring en Expo}" "${EXPO_PUBLIC_AI_URL:?Define la URL de la API de rutas en Expo}"; do
    [[ $url == https://* ]] || { echo 'Se requieren URLs HTTPS en EAS' >&2; exit 1; }
done
# La imagen Android de Expo 58 incluye Java 17; preparar el mismo JDK que en local.
jdk_dir="$HOME/.local/temurin-21.0.13.1"
if [[ ! -x "$jdk_dir/bin/java" ]]; then
    archive=$(mktemp)
    trap 'rm -f "$archive"' EXIT
    curl --fail --location --retry 3 --output "$archive" 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.13.1%2B2/OpenJDK21U-jdk_x64_linux_hotspot_21.0.13.1_2.tar.gz'
    echo "bb8a93f9ae6e7a693b2b721e85dbeff26ae1a77447985a8d7afcdd9c7cf6222e  $archive" | sha256sum -c -
    mkdir -p "$jdk_dir"
    tar xzf "$archive" --strip-components=1 -C "$jdk_dir"
fi
"$jdk_dir/bin/java" -version
set-env JAVA_HOME "$jdk_dir"
set-env PATH "$jdk_dir/bin:$PATH"
gradle_home="${GRADLE_USER_HOME:-$HOME/.gradle}"
mkdir -p "$gradle_home/init.d"
cp scripts/java21.gradle "$gradle_home/init.d/metropolitano-java21.gradle"
