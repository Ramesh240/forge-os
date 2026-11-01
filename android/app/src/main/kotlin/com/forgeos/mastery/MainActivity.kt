// MainActivity.kt
// Entry point for the ForgeOS native WebView wrapper app.
//
// High-Performance Startup Architecture:
//  1. installSplashScreen() — Android OS native splash screen renders immediately on process start (0ms).
//  2. setKeepOnScreenCondition { viewModel.isLoading.value } — holds the native OS splash
//     at the window compositor level while ForgeWebView loads cached assets from disk in the background.
//  3. onPageFinished() immediately signals viewModel.onPageFinished() -> isLoading = false.
//  4. Android OS smoothly cross-fades directly from the splash screen into ForgeOS.
//     Zero artificial delays, zero layout recomposition overhead, zero double-screens.
package com.forgeos.mastery

import android.os.Bundle
import android.content.pm.PackageManager
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.forgeos.mastery.ui.ForgeOfflineScreen
import com.forgeos.mastery.ui.ForgeWebView

class MainActivity : ComponentActivity() {

    private val viewModel: WebAppViewModel by viewModels()
    private var webViewRef: WebView? = null

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == com.forgeos.mastery.bridge.ForgeAndroidBridge.REQUEST_CODE_POST_NOTIFICATIONS) {
            val granted = grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED
            webViewRef?.evaluateJavascript(
                "window.onForgeNotificationPermissionResult?.($granted)",
                null,
            )
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        // ── STEP 1: Install splash screen ─────────────────────────────────────
        // MUST be called before super.onCreate() — official API contract.
        // Source: https://developer.android.com/develop/ui/views/launch/splash-screen
        val splashScreen = installSplashScreen()
        super.onCreate(savedInstanceState)

        // Hold native splash on screen until WebView completes initial render.
        // Hardware accelerated by the OS window manager — this is what makes v11 so fast.
        splashScreen.setKeepOnScreenCondition { viewModel.isLoading.value }

        com.forgeos.mastery.notifications.HabitReminderReceiver.createNotificationChannel(this)
        com.forgeos.mastery.notifications.StreakDangerReceiver.createNotificationChannel(this)
        com.forgeos.mastery.notifications.DailyMotivationReceiver.createNotificationChannel(this)
        com.forgeos.mastery.notifications.DailyMotivationReceiver.scheduleDailyAlarm(this)

        // Edge-to-edge: content renders behind system bars with insets handled safely
        enableEdgeToEdge()

        setContent {
            val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
            val isOfflineError by viewModel.isOfflineError.collectAsStateWithLifecycle()

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    // Dark bg fills any gap before WebView first paint.
                    // Must match @color/forge_bg (#060609) exactly.
                    .background(Color(0xFF060609))
                    // Ensure top bar never overlaps front camera notch / punch hole
                    .statusBarsPadding()
                    // Ensure bottom navigation never overlaps Android gesture bar
                    .navigationBarsPadding()
                    // Push content up when soft keyboard appears
                    .imePadding(),
            ) {
                // Background WebView
                ForgeWebView(
                    url = BuildConfig.APP_URL,
                    onPageFinished = viewModel::onPageFinished,
                    onPageError = viewModel::onPageError,
                    onWebViewCreated = { webView -> webViewRef = webView },
                    modifier = Modifier.fillMaxSize(),
                )

                // Native offline fallback screen when connection fails
                if (isOfflineError) {
                    ForgeOfflineScreen(
                        onRetry = {
                            viewModel.retry()
                            webViewRef?.reload()
                        },
                    )
                }
            }
        }
    }
}

// Source: https://developer.android.com/develop/ui/views/launch/splash-screen
// Source: https://developer.android.com/kotlin/flow/stateflow-and-sharedflow
