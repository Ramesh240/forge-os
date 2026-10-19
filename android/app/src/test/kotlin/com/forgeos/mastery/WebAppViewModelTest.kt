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
    }

    @Test
    fun onPageFinished_isLoadingBecomesFalse() {
        viewModel.onPageFinished()
        assertFalse("Loading state should be false after onPageFinished", viewModel.isLoading.value)
    }

    @Test
    fun onPageError_isLoadingBecomesFalse() {
        viewModel.onPageError()
        assertFalse("Loading state should be false after onPageError", viewModel.isLoading.value)
    }
}
