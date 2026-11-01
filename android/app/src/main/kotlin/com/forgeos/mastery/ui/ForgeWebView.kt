// ForgeWebView.kt
// Compose wrapper around android.webkit.WebView.
// Handles: JavaScript, DOM storage, dark mode compat, back navigation,
// domain allow-listing, instant page completion, and offline-first disk caching.
package com.forgeos.mastery.ui

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
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
import com.forgeos.mastery.bridge.ForgeAndroidBridge

internal object NetworkUtils {
    /** Checks whether an active internet connection is available. */
    fun isNetworkAvailable(context: Context): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            ?: return false
        val activeNetwork = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(activeNetwork) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }
}

/**
 * ForgeWebView
 *
 * Renders the ForgeOS Next.js web app inside a native WebView.
 * Key behaviours:
 *  - Native dark bg (#060609) prevents any white flicker.
 *  - [WebSettings.LOAD_CACHE_ELSE_NETWORK]: Uses disk cache immediately on app start.
 *    Eliminates blocking 304 network roundtrips when internet is ON, making launch instant!
 *  - Immediate [onPageFinished]: Dismisses splash the instant the initial page DOM is ready.
 *  - UPI / Intent links pass to native apps (GPay, PhonePe, Paytm).
 *  - Back gesture navigates WebView history before exiting.
 */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun ForgeWebView(
    url: String,
    onPageFinished: () -> Unit,
    onPageError: () -> Unit,
    modifier: Modifier = Modifier,
    onWebViewCreated: (WebView) -> Unit = {},
) {
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
                onWebViewCreated(this)

                // Dark bg matches native theme #060609 — zero white flash
                setBackgroundColor(Color.parseColor("#060609"))

                // ── WebView Settings ───────────────────────────────────────────
                settings.apply {
                    javaScriptEnabled   = true   // Required: Next.js is a React SPA
                    domStorageEnabled   = true   // Required: NextAuth session tokens
                    databaseEnabled     = true
                    setSupportZoom(false)        // Native feel — no pinch zoom
                    displayZoomControls = false
                    useWideViewPort     = true
                    loadWithOverviewMode = false
                    textZoom            = 100

                    // LOAD_CACHE_ELSE_NETWORK: Load from disk cache instantly (0ms network latency),
                    // whether internet is ON or OFF. This fixes the slow startup when internet is on!
                    cacheMode           = WebSettings.LOAD_CACHE_ELSE_NETWORK

                    // Security: block mixed content (HTTPS page loading HTTP resources)
                    @Suppress("DEPRECATION")
                    mixedContentMode    = WebSettings.MIXED_CONTENT_NEVER_ALLOW
                    // Security: no file:// access
                    allowFileAccess     = false
                    allowContentAccess  = false
                }

                // ── Native Bridge & Google Play Billing ───────────────────────
                (context as? Activity)?.let { act ->
                    val playBillingManager = com.forgeos.mastery.billing.PlayBillingManager(act) { this }
                    addJavascriptInterface(
                        ForgeAndroidBridge(
                            activity = act,
                            playBillingManager = playBillingManager,
                            onAppContentReady = onPageFinished,
                        ),
                        "ForgeAndroidBridge"
                    )
                }

                // ── WebChromeClient ───────────────────────────────────────────
                webChromeClient = android.webkit.WebChromeClient()

                // ── WebViewClient ──────────────────────────────────────────────
                webViewClient = object : WebViewClient() {

                    /**
                     * Allow-list: only your Vercel deployment, custom domain, and payment gateway.
                     * Supports native UPI intent resolution for apps like Google Pay, PhonePe, Paytm.
                     */
                    override fun shouldOverrideUrlLoading(
                        view: WebView,
                        request: WebResourceRequest,
                    ): Boolean {
                        val uri = request.url
                        val scheme = uri.scheme ?: return true

                        // Catch UPI and intent schemes for Razorpay native payment apps
                        if (scheme.equals("upi", ignoreCase = true) || scheme.equals("intent", ignoreCase = true)) {
                            try {
                                val intent = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME)
                                view.context.startActivity(intent)
                            } catch (_: Exception) {
                                // App not found or couldn't launch intent
                            }
                            return true
                        }

                        val host = uri.host ?: return true
                        val isAllowed = host.endsWith("forge-os-eta-five.vercel.app") ||
                                        host.endsWith("forge-os.vercel.app") ||
                                        host.endsWith("forgeos.app") ||
                                        host.endsWith("razorpay.com") ||
                                        host.endsWith("google.com")
                        return !isAllowed
                    }

                    /**
                     * Immediate onPageFinished: releases native splash the instant
                     * the DOM is parsed and cached assets are rendered. No delay!
                     */
                    override fun onPageFinished(view: WebView, url: String) {
                        super.onPageFinished(view, url)
                        onPageFinished()
                    }

                    /** Network / SSL errors — dismiss loading and trigger error state. */
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
// Source: https://developer.android.com/reference/android/net/ConnectivityManager
