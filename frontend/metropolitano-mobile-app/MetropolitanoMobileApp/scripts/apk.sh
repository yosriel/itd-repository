#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${JAVA_HOME:?Configura el JDK 21}"
: "${ANDROID_HOME:?Configura el SDK de Android}"
if ! "$JAVA_HOME/bin/java" -version 2>&1 | grep -Eq 'version "21[."]'; then
    echo "Se requiere JDK 21" >&2
    exit 1
fi
export PATH="$JAVA_HOME/bin:$PATH"
npx --no-install expo prebuild --platform android --no-install
(cd android && ./gradlew --init-script ../scripts/java21.gradle :app:assembleRelease -PreactNativeArchitectures="${ANDROID_ABIS:-arm64-v8a}" --max-workers=3)
mkdir -p artifacts
cp android/app/build/outputs/apk/release/app-release.apk artifacts/metropolitano.apk
