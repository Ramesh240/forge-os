// ForgeWebView.kt
// Compose wrapper around android.webkit.WebView.
// Handles: JavaScript, DOM storage, dark mode compat, back navigation,
// domain allow-listing, and the onPageFinished callback that releases the splash.
package com.forgeos.mastery.ui

import android.annotation.SuppressLint
import android.graphics.Color
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature

/**
 * ForgeWebView
 *
 * Renders the ForgeOS Next.js web app inside a native WebView.
 * Key behaviours:
 *  - Transparent background during load so the Activity's dark bg shows through
 *  - JavaScript + DOM storage enabled (required by Next.js)
 *  - External links are blocked — only forge-os.vercel.app is allowed
 *  - Back gesture navigates the WebView history before popping the Activity
 *  - [onPageFinished] fires once so MainActivity can dismiss the splash screen
 *  - [onPageError] fires on network errors so we don't hang the splash forever
 */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun ForgeWebView(
    url: String,
    onPageFinished: () -> Unit,
    onPageError: () -> Unit,
    modifier: Modifier = Modifier,
) {
    // Hold a reference so BackHandler can call webView.goBack()
    var webViewRef by remember { mutableStateOf<WebView?>(null) }

    // Intercept Android back gesture — navigate WebView history first
    BackHandler(enabled = webViewRef?.canGoBack() == true) {
        webViewRef?.goBack()
    }

    AndroidView(
        modifier = modifier,
        factory = { context ->
            WebView(context).apply {
                webViewRef = this

                // ── Dark Mode ──────────────────────────────────────────────────
                // Uses WebViewFeature compat check — safe on all API levels.
                if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
                    WebSettingsCompat.setAlgorithmicDarkeningAllowed(settings, true)
                }

                // Transparent so Activity's #060609 bg shows through during
                // the micro-gap before the first paint — zero white flash.
                setBackgroundColor(Color.TRANSPARENT)

                // ── WebView Settings ───────────────────────────────────────────
                if (com.forgeos.mastery.BuildConfig.DEBUG) {
                    clearCache(true)
                }

                settings.apply {
                    javaScriptEnabled   = true   // Required: Next.js is a React SPA
                    domStorageEnabled   = true   // Required: NextAuth session tokens
                    databaseEnabled     = true
                    setSupportZoom(false)        // Native feel — no pinch zoom
                    displayZoomControls = false
                    useWideViewPort     = true
                    loadWithOverviewMode = true
                    cacheMode           = if (com.forgeos.mastery.BuildConfig.DEBUG) {
                        android.webkit.WebSettings.LOAD_NO_CACHE
                    } else {
                        android.webkit.WebSettings.LOAD_DEFAULT
                    }
                    // Security: block mixed content (HTTPS page loading HTTP resources)
                    @Suppress("DEPRECATION")
                    mixedContentMode    = android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW
                    // Security: no file:// access
                    allowFileAccess     = false
                    allowContentAccess  = false
                }

                // ── WebChromeClient ───────────────────────────────────────────
                webChromeClient = android.webkit.WebChromeClient()

                // ── WebViewClient ──────────────────────────────────────────────
                webViewClient = object : WebViewClient() {

                    /**
                     * Allow-list: only your Vercel deployment and any custom domain.
                     * External links (e.g. Razorpay, Google OAuth redirect) would
                     * normally open here — add trusted hosts below as needed.
                     */
                    override fun shouldOverrideUrlLoading(
                        view: WebView,
                        request: WebResourceRequest,
                    ): Boolean {
                        val host = request.url.host ?: return true // block if no host
                        val isAllowed = host.endsWith("forge-os-eta-five.vercel.app") ||
                                        host.endsWith("forge-os.vercel.app") ||
                                        host.endsWith("forgeos.app") ||      // custom domain
                                        host.endsWith("razorpay.com") ||     // payment gateway
                                        host.endsWith("google.com")          // OAuth
                        return !isAllowed // true = block, false = allow
                    }

                    /**
                     * ★ THE KEY SPLASH SCREEN FIX ★
                     *
                     * Called when the page DOM is parsed and the first render
                     * is complete. We signal the ViewModel here, which causes
                     * setKeepOnScreenCondition in MainActivity to return false,
                     * which Android uses to smoothly fade out the native splash.
                     *
                     * No Chrome. No assetlinks.json check. No flash.
                     */
                    override fun onPageFinished(view: WebView, url: String) {
                        super.onPageFinished(view, url)
                        onPageFinished()
                    }

                    /** Network / SSL errors — dismiss splash so we don't hang. */
                    override fun onReceivedError(
                        view: WebView,
                        request: WebResourceRequest,
                        error: WebResourceError,
                    ) {
                        super.onReceivedError(view, request, error)
                        if (request.isForMainFrame) {
                            onPageError()
                        }
                    }
                }

                loadUrl(url)
            }
        },
    )
}

// Source: https://developer.android.com/reference/android/webkit/WebView
// Source: https://developer.android.com/reference/androidx/webkit/WebSettingsCompat
// Source: https://developer.android.com/reference/androidx/webkit/WebViewFeature
