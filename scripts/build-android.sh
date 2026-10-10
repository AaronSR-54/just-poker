#!/usr/bin/env bash
# Genera el APK (y el AAB) de Just Poker con Capacitor + Gradle.
#
# Uso:
#   scripts/build-android.sh          # release firmado (APK + AAB)
#   scripts/build-android.sh debug    # APK de debug (sin firma de release)
#
# Requiere JDK 21 y Android SDK 36. Se detectan desde JAVA_HOME/ANDROID_HOME,
# o si no, desde mise (java) y ~/android-sdk.

set -euo pipefail
cd "$(dirname "$0")/.."

# --- Toolchain -------------------------------------------------------------
if [ -z "${JAVA_HOME:-}" ] && command -v mise >/dev/null 2>&1; then
  JAVA_HOME="$(mise where java 2>/dev/null || true)"
fi
ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/android-sdk}}"

if [ -z "${JAVA_HOME:-}" ] || [ ! -x "$JAVA_HOME/bin/java" ]; then
  echo "error: no encuentro un JDK. Define JAVA_HOME (se necesita JDK 21)." >&2
  exit 1
fi
if [ ! -d "$ANDROID_HOME/platforms/android-36" ]; then
  echo "error: no encuentro Android SDK 36 en '$ANDROID_HOME'." >&2
  echo "       Instala con: sdkmanager 'platforms;android-36' 'build-tools;36.0.0'" >&2
  exit 1
fi
export JAVA_HOME ANDROID_HOME
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

mode="${1:-release}"

# --- Web + Capacitor -------------------------------------------------------
# La WebView de Capacitor sirve la app desde localhost, así que el online debe
# apuntar al despliegue de producción (el mismo dominio que sirve la API de
# socket.io). En la web, en cambio, el valor vacío = mismo origen.
export VITE_ONLINE_URL="${VITE_ONLINE_URL:-https://just-poker-delta.vercel.app}"
npm run build
npx cap sync android

# --- Gradle ----------------------------------------------------------------
pushd android >/dev/null

if [ "$mode" = "debug" ]; then
  ./gradlew assembleDebug
  apk="android/app/build/outputs/apk/debug/app-debug.apk"
else
  ./gradlew assembleRelease bundleRelease
  apk="android/app/build/outputs/apk/release/app-release.apk"
  echo "AAB -> android/app/build/outputs/bundle/release/app-release.aab"
fi

popd >/dev/null

cp "$apk" just-poker.apk
echo "APK -> just-poker.apk"
