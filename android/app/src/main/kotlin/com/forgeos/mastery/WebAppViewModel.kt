// WebAppViewModel.kt
// Manages the WebView loading state and error states using lifecycle-aware StateFlows.
// Pattern: stateflow-ui (https://developer.android.com/kotlin/flow/stateflow-and-sharedflow)
package com.forgeos.mastery

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class WebAppViewModel : ViewModel() {

    /**
     * true  → page is actively loading → show native Compose skeleton shimmer
     * false → page has completed initial paint → smoothly fade out skeleton
     */
    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    /**
     * true  → fatal load/network error occurred → display offline retry screen
     * false → normal operation
     */
    private val _isOfflineError = MutableStateFlow(false)
    val isOfflineError: StateFlow<Boolean> = _isOfflineError.asStateFlow()

    /** Called once WebViewClient reports page finished. */
    fun onPageFinished() {
        _isOfflineError.value = false
        _isLoading.value = false
    }

    /** Called if the main page fails to load (e.g. no internet and no cache). */
    fun onPageError() {
        _isOfflineError.value = true
        _isLoading.value = false
    }

    /** Called when the user clicks 'Retry' on the offline screen. */
    fun retry() {
        _isOfflineError.value = false
        _isLoading.value = true
    }
}

// Source: https://developer.android.com/kotlin/flow/stateflow-and-sharedflow
// Source: https://developer.android.com/topic/libraries/architecture/viewmodel
