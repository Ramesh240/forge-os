// MainActivity.kt
// Entry point for the ForgeOS native WebView wrapper app.
//
// Flow:
//  1. installSplashScreen() — native Android splash appears immediately
//  2. setKeepOnScreenCondition { viewModel.isLoading.value } — holds splash
//     on screen until the WebView signals it is ready
//  3. setContent { ForgeWebView(...) } — WebView starts loading in background
//  4. ForgeWebView.onPageFinished → viewModel.onPageFinished() → isLoading=false
//  5. Android smoothly fades out the splash → user sees the loaded app
//     ↑ NO Chrome flash at any point in this sequence
package com.forgeos.mastery

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.forgeos.mastery.ui.ForgeWebView

class  MainActivity : ComponentActivity() {

    private val viewModel: WebAppViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        // ── STEP 1: Install splash screen ─────────────────────────────────────
        // MUST be called before super.onCreate() — this is the official API contract.
        // Source: https://developer.android.com/develop/ui/views/launch/splash-screen
        val splashScreen = installSplashScreen()
        super.onCreate(savedInstanceState)

        // Hold native splash on screen until WebView completes initial render
        splashScreen.setKeepOnScreenCondition { viewModel.isLoading.value }

        com.forgeos.mastery.notifications.HabitReminderReceiver.createNotificationChannel(this)

        // Edge-to-edge: content renders behind system bars with insets handled safely
        enableEdgeToEdge()

        setContent {
            // collectAsStateWithLifecycle: collection pauses when app is backgrounded
            // (saves battery, prevents unnecessary recompositions).
            // Pattern sourced from: https://developer.android.com/kotlin/flow/stateflow-and-sharedflow
            @Suppress("UNUSED_VARIABLE")
            val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()

            ForgeWebView(
                url           = BuildConfig.APP_URL,
                onPageFinished = viewModel::onPageFinished,
                onPageError   = viewModel::onPageError,
                modifier      = Modifier
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
            )
        }
    }
}

// Source: https://developer.android.com/develop/ui/views/launch/splash-screen
// Source: https://developer.android.com/jetpack/compose/activity
// Source: https://developer.android.com/kotlin/flow/stateflow-and-sharedflow
