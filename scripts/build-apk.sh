#!/usr/bin/env bash
# Construye el APK sin Gradle: aapt2 + javac + d8 + apksigner.
# La app web tiene que estar construida antes (npm run build).
set -euo pipefail

: "${ANDROID_HOME:=$HOME/android-sdk}"
BUILD_TOOLS="$ANDROID_HOME/build-tools/34.0.0"
PLATFORM="$ANDROID_HOME/platforms/android-34/android.jar"
KEYSTORE="${KEYSTORE:-android/ficha.keystore}"
CLAVE="${KEYSTORE_PASS:-fichadnd}"
ALIAS="${KEYSTORE_ALIAS:-ficha}"

# La versión vive en android/version.json. El código sube solo en cada build:
# Android solo instala encima si el número es mayor que el instalado.
VERSION_FILE=android/version.json
VERSION_NAME="${VERSION_NAME:-$(node -p "require('./$VERSION_FILE').versionName")}"
VERSION_CODE="${VERSION_CODE:-$(node -p "require('./$VERSION_FILE').versionCode + 1")}"
node -e "
  const fs = require('fs'), f = '$VERSION_FILE';
  const v = JSON.parse(fs.readFileSync(f));
  v.versionCode = $VERSION_CODE; v.versionName = '$VERSION_NAME';
  fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n');
" 

OUT=android/build
APK="dist-apk/ficha-dnd-$VERSION_NAME.apk"
export VITE_APP_VERSION="$VERSION_NAME"

for f in "$BUILD_TOOLS/aapt2" "$BUILD_TOOLS/d8" "$BUILD_TOOLS/apksigner" "$BUILD_TOOLS/zipalign" "$PLATFORM"; do
  [ -e "$f" ] || { echo "Falta $f. Instala el SDK: sdkmanager 'platforms;android-34' 'build-tools;34.0.0'"; exit 1; }
done
[ -f dist/index.html ] || { echo "Falta dist/. Ejecuta primero: npm run build"; exit 1; }

rm -rf "$OUT"
mkdir -p "$OUT"/{res,classes,assets} dist-apk

# La app web entra como assets, servida luego desde https://ficha.local/
cp -r dist/. "$OUT/assets/www/"
# El service worker no pinta nada aquí: el contenedor ya sirve todo desde el propio APK.
rm -f "$OUT/assets/www/sw.js"
# Las pantallas de arranque son de iOS: en Android solo abultarían el APK.
rm -f "$OUT/assets/www"/splash-*.png

echo "▸ Compilando recursos"
"$BUILD_TOOLS/aapt2" compile --dir android/res -o "$OUT/res.zip" >/dev/null

# La versión se inyecta al enlazar, para no tocar el manifiesto a mano.
"$BUILD_TOOLS/aapt2" link \
  -o "$OUT/base.apk" \
  -I "$PLATFORM" \
  --manifest android/AndroidManifest.xml \
  --java "$OUT/gen" \
  --version-code "$VERSION_CODE" \
  --version-name "$VERSION_NAME" \
  -A "$OUT/assets" \
  "$OUT/res.zip" >/dev/null

echo "▸ Compilando Java"
mkdir -p "$OUT/gen"
# android.jar va en el classpath, no en el bootclasspath: así lo hace también
# el plugin de Gradle desde que javac dejó de aceptar la combinación.
javac -source 11 -target 11 -nowarn -Xlint:-options \
  -classpath "$PLATFORM" \
  -d "$OUT/classes" \
  $(find android/java "$OUT/gen" -name '*.java') 2>&1 | grep -v '^Note:' || true

echo "▸ Generando dex"
[ -n "$(find "$OUT/classes" -name '*.class' -print -quit)" ] || { echo "La compilación de Java no produjo nada"; exit 1; }
"$BUILD_TOOLS/d8" --lib "$PLATFORM" --min-api 24 --output "$OUT" \
  $(find "$OUT/classes" -name '*.class')
[ -f "$OUT/classes.dex" ] || { echo "d8 no generó classes.dex"; exit 1; }

echo "▸ Empaquetando"
( cd "$OUT" && zip -q base.apk classes.dex )

if [ ! -f "$KEYSTORE" ]; then
  echo "▸ Creando la clave de firma (guárdala: sin ella no puedes publicar actualizaciones)"
  keytool -genkeypair -v -keystore "$KEYSTORE" -alias "$ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10950 \
    -storepass "$CLAVE" -keypass "$CLAVE" \
    -dname "CN=Ficha de campana, OU=Mesa de juego, O=Personal, C=MX" 2>/dev/null
fi

echo "▸ Alineando y firmando"
"$BUILD_TOOLS/zipalign" -f -p 4 "$OUT/base.apk" "$OUT/aligned.apk"
"$BUILD_TOOLS/apksigner" sign \
  --ks "$KEYSTORE" --ks-pass "pass:$CLAVE" --key-pass "pass:$CLAVE" --ks-key-alias "$ALIAS" \
  --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true \
  --out "$APK" "$OUT/aligned.apk"

# Comprobar que la versión acabó realmente dentro del APK: si el manifiesto la
# declarase, aapt2 ignoraría --version-code y las actualizaciones no instalarían.
DENTRO=$("$BUILD_TOOLS/aapt2" dump badging "$APK" | head -1)
echo "$DENTRO" | grep -q "versionCode='$VERSION_CODE'" || {
  echo "✗ El APK dice: $DENTRO"
  echo "  Se esperaba versionCode='$VERSION_CODE'. Revisa AndroidManifest.xml."
  exit 1
}

"$BUILD_TOOLS/apksigner" verify --print-certs "$APK" | head -3
echo
echo "✓ $APK — $(du -h "$APK" | cut -f1) — versión $VERSION_NAME (código $VERSION_CODE)"
echo
echo "  La clave de firma está en $KEYSTORE."
echo "  Guárdala: sin ese mismo archivo, Android rechazará cualquier actualización"
echo "  y tus jugadores tendrían que desinstalar, perdiendo sus datos." 
