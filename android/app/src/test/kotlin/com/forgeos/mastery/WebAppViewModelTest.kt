package com.forgeos.mastery

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class WebAppViewModelTest {

    private lateinit var viewModel: WebAppViewModel

    @Before
    fun setUp() {
        viewModel = WebAppViewModel()
    }

    @Test
    fun initialState_isLoadingIsTrue() {
        assertTrue("Initial loading state should be true", viewModel.isLoading.value)
        assertFalse("Initial error state should be false", viewModel.isOfflineError.value)
    }

    @Test
    fun onPageFinished_isLoadingBecomesFalse() {
        viewModel.onPageFinished()
        assertFalse("Loading state should be false after onPageFinished", viewModel.isLoading.value)
        assertFalse("Error state should be false after onPageFinished", viewModel.isOfflineError.value)
    }

    @Test
    fun onPageError_isLoadingBecomesFalseAndErrorIsTrue() {
        viewModel.onPageError()
        assertFalse("Loading state should be false after onPageError", viewModel.isLoading.value)
        assertTrue("Error state should be true after onPageError", viewModel.isOfflineError.value)
    }

    @Test
    fun retry_resetsErrorAndSetsLoadingTrue() {
        viewModel.onPageError()
        assertTrue(viewModel.isOfflineError.value)
        assertFalse(viewModel.isLoading.value)

        viewModel.retry()
        assertFalse(viewModel.isOfflineError.value)
        assertTrue(viewModel.isLoading.value)
    }
}

// Source: https://developer.android.com/training/testing/unit-testing
