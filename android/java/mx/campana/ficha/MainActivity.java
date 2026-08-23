package mx.campana.ficha;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Contenedor de la ficha de campaña.
 *
 * La app web vive en assets/www y se sirve desde https://ficha.local/, no desde
 * file://. Eso le da un origen seguro y propio: localStorage e IndexedDB quedan
 * dentro del almacenamiento privado de la app, donde solo esta app puede leerlos
 * y donde no los toca borrar los datos del navegador.
 */
public class MainActivity extends Activity {

    private static final String HOST = "ficha.local";
    private static final String INICIO = "https://" + HOST + "/index.html";

    private WebView web;
    private ValueCallback<Uri[]> selectorArchivos;
    private static final int PEDIR_ARCHIVO = 1001;

    private static final Map<String, String> TIPOS = new HashMap<>();
    static {
        TIPOS.put("html", "text/html");
        TIPOS.put("js", "text/javascript");
        TIPOS.put("css", "text/css");
        TIPOS.put("json", "application/json");
        TIPOS.put("webmanifest", "application/manifest+json");
        TIPOS.put("png", "image/png");
        TIPOS.put("jpg", "image/jpeg");
        TIPOS.put("jpeg", "image/jpeg");
        TIPOS.put("svg", "image/svg+xml");
        TIPOS.put("woff2", "font/woff2");
        TIPOS.put("ico", "image/x-icon");
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle estado) {
        super.onCreate(estado);

        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);          // localStorage
        s.setDatabaseEnabled(true);            // almacén interno del WebView
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);           // no hace falta: todo va por assets
        // El selector de imágenes devuelve URIs content://, así que este sí hace falta.
        s.setAllowContentAccess(true);
        s.setSupportZoom(false);
        s.setTextZoom(100);                    // el tamaño lo decide la app, no el sistema

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (HOST.equals(u.getHost())) return servirDesdeAssets(u.getPath());
                return null;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                // Todo lo que no sea la propia app se abre fuera, en el navegador.
                if (HOST.equals(req.getUrl().getHost())) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, req.getUrl()));
                } catch (Exception ignorado) {
                    aviso("No hay ninguna app para abrir ese enlace.");
                }
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (selectorArchivos != null) selectorArchivos.onReceiveValue(null);
                selectorArchivos = callback;
                try {
                    startActivityForResult(params.createIntent(), PEDIR_ARCHIVO);
                    return true;
                } catch (Exception e) {
                    // Algunos teléfonos no resuelven el intent que arma el WebView.
                    // Un ACTION_GET_CONTENT normal casi siempre sí.
                    try {
                        Intent alterno = new Intent(Intent.ACTION_GET_CONTENT);
                        alterno.setType("image/*");
                        alterno.addCategory(Intent.CATEGORY_OPENABLE);
                        alterno.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                        startActivityForResult(Intent.createChooser(alterno, "Elegir imágenes"), PEDIR_ARCHIVO);
                        return true;
                    } catch (Exception e2) {
                        selectorArchivos = null;
                        aviso("Este teléfono no tiene ninguna app para elegir imágenes.");
                        return false;
                    }
                }
            }
        });

        web.addJavascriptInterface(new Puente(), "AndroidFicha");

        if (estado != null) web.restoreState(estado);
        else web.loadUrl(INICIO);
    }

    /** Sirve un archivo de assets/www con su tipo MIME. */
    private WebResourceResponse servirDesdeAssets(String ruta) {
        if (ruta == null || ruta.isEmpty() || "/".equals(ruta)) ruta = "/index.html";
        // Sin rutas relativas: nada de salirse de assets/www.
        if (ruta.contains("..")) return respuestaVacia();

        String relativa = "www" + ruta;
        try {
            InputStream entrada = getAssets().open(relativa);
            String ext = ruta.substring(ruta.lastIndexOf('.') + 1).toLowerCase();
            String mime = TIPOS.containsKey(ext) ? TIPOS.get(ext) : "application/octet-stream";
            String codificacion = mime.startsWith("text/") || mime.contains("json") ? "utf-8" : null;
            WebResourceResponse r = new WebResourceResponse(mime, codificacion, entrada);
            Map<String, String> cabeceras = new HashMap<>();
            cabeceras.put("Cache-Control", "no-cache");
            r.setResponseHeaders(cabeceras);
            return r;
        } catch (IOException e) {
            // Una ruta sin extensión es navegación: devolver la app.
            // Una con extensión que no existe es un 404 de verdad, y hay que
            // decirlo: si no, el navegador recibiría HTML donde espera un script.
            boolean tieneExtension = ruta.lastIndexOf('.') > ruta.lastIndexOf('/');
            if (!tieneExtension && !ruta.equals("/index.html")) return servirDesdeAssets("/index.html");
            return noEncontrado();
        }
    }

    private WebResourceResponse respuestaVacia() {
        return new WebResourceResponse("text/plain", "utf-8",
                new java.io.ByteArrayInputStream(new byte[0]));
    }

    private WebResourceResponse noEncontrado() {
        WebResourceResponse r = respuestaVacia();
        r.setStatusCodeAndReasonPhrase(404, "Not Found");
        r.setResponseHeaders(new HashMap<String, String>());
        return r;
    }

    /** Lo que la app web puede pedirle a Android. */
    private class Puente {
        /**
         * Guarda un archivo en la carpeta de Descargas del teléfono.
         * Lo usa el botón de copia de seguridad: en un WebView, una descarga
         * normal por blob no llega a ninguna parte.
         */
        @JavascriptInterface
        public boolean guardarEnDescargas(String nombre, String contenidoBase64, String mime) {
            try {
                byte[] datos = Base64.decode(contenidoBase64, Base64.DEFAULT);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Downloads.DISPLAY_NAME, nombre);
                    v.put(MediaStore.Downloads.MIME_TYPE, mime);
                    v.put(MediaStore.Downloads.IS_PENDING, 1);
                    Uri destino = getContentResolver()
                            .insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                    if (destino == null) return false;
                    try (OutputStream salida = getContentResolver().openOutputStream(destino)) {
                        if (salida == null) return false;
                        salida.write(datos);
                    }
                    v.clear();
                    v.put(MediaStore.Downloads.IS_PENDING, 0);
                    getContentResolver().update(destino, v, null, null);
                } else {
                    java.io.File carpeta = android.os.Environment.getExternalStoragePublicDirectory(
                            android.os.Environment.DIRECTORY_DOWNLOADS);
                    if (!carpeta.exists() && !carpeta.mkdirs()) return false;
                    java.io.File destino = new java.io.File(carpeta, nombre);
                    try (OutputStream salida = new java.io.FileOutputStream(destino)) {
                        salida.write(datos);
                    }
                }
                aviso("Guardado en Descargas: " + nombre);
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        /** Permite a la app saber que corre dentro del contenedor de Android. */
        @JavascriptInterface
        public String version() {
            try {
                return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
            } catch (Exception e) {
                return "";
            }
        }
    }

    private void aviso(final String texto) {
        runOnUiThread(() -> Toast.makeText(MainActivity.this, texto, Toast.LENGTH_LONG).show());
    }

    @Override
    protected void onActivityResult(int codigo, int resultado, Intent datos) {
        if (codigo == PEDIR_ARCHIVO) {
            if (selectorArchivos != null) {
                selectorArchivos.onReceiveValue(
                        WebChromeClient.FileChooserParams.parseResult(resultado, datos));
                selectorArchivos = null;
            }
            return;
        }
        super.onActivityResult(codigo, resultado, datos);
    }

    @Override
    public void onBackPressed() {
        // El botón de atrás navega entre pestañas antes de salir de la app.
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onSaveInstanceState(Bundle estado) {
        super.onSaveInstanceState(estado);
        web.saveState(estado);
    }

    @Override
    protected void onPause() {
        super.onPause();
        // Da al WebView la oportunidad de volcar lo pendiente antes de que el
        // sistema pueda matar el proceso.
        web.evaluateJavascript("void 0", null);
    }
}
