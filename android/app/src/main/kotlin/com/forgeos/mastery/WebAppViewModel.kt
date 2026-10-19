// WebAppViewModel.kt
// Manages the WebView loading state using a lifecycle-aware StateFlow.
// Pattern: stateflow-ui (https://developer.android.com/kotlin/flow/stateflow-and-sharedflow)
package com.forgeos.mastery

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class WebAppViewModel : ViewModel() {

    /**
     * true  → page is still loading → keep the native SplashScreen visible
     * false → WebView has finished painting → dismiss splash, reveal the app
     *
     * Using MutableStateFlow instead of MutableLiveData — StateFlow is the
     * current best practice for Compose (no LiveData observer needed).
     */
    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    /** Called by ForgeWebView once WebViewClient.onPageFinished fires. */
    fun onPageFinished() {
        _isLoading.value = false
    }

    /** Called if the page fails to load (network error, etc.). */
    fun onPageError() {
        // Even on error, dismiss the splash so we don't hang forever.
        _isLoading.value = false
    }
}

// Source: https://developer.android.com/kotlin/flow/stateflow-and-sharedflow
// Source: https://developer.android.com/topic/libraries/architecture/viewmodel
