package com.forgeos.mastery.billing

import android.app.Activity
import android.util.Log
import android.webkit.WebView
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryProductDetailsResult
import com.android.billingclient.api.QueryPurchasesParams

class PlayBillingManager(
    private val activity: Activity,
    private val webViewProvider: () -> WebView?,
) : PurchasesUpdatedListener {

    private var billingClient: BillingClient = BillingClient.newBuilder(activity)
        .setListener(this)
        .enablePendingPurchases(
            PendingPurchasesParams.newBuilder()
                .enableOneTimeProducts()
                .build()
        )
        .build()

    private var isConnected = false
    private var cachedProductDetails: Map<String, ProductDetails> = emptyMap()

    init {
        startConnection()
    }

    fun startConnection(onReady: (() -> Unit)? = null) {
        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    isConnected = true
                    Log.d(TAG, "Google Play Billing setup succeeded.")
                    queryAvailableProducts()
                    restorePurchases()
                    onReady?.invoke()
                } else {
                    Log.w(TAG, "Billing setup finished with code: ${billingResult.responseCode}")
                }
            }

            override fun onBillingServiceDisconnected() {
                isConnected = false
                Log.w(TAG, "Billing service disconnected. Will reconnect on next attempt.")
            }
        })
    }

    fun queryAvailableProducts() {
        if (!isConnected) return

        val productList = listOf(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(PRODUCT_ID_PRIMARY)
                .setProductType(BillingClient.ProductType.INAPP)
                .build(),
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(PRODUCT_ID_FALLBACK)
                .setProductType(BillingClient.ProductType.INAPP)
                .build()
        )

        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(productList)
            .build()

        billingClient.queryProductDetailsAsync(params) { billingResult, productDetailsResult ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                val detailsList = productDetailsResult.productDetailsList
                if (!detailsList.isNullOrEmpty()) {
                    cachedProductDetails = detailsList.associateBy { it.productId }
                    Log.d(TAG, "Loaded in-app products: ${cachedProductDetails.keys.joinToString()}")
                }
            }
        }
    }

    fun launchPurchaseFlow(customProductId: String? = null) {
        val targetProduct = customProductId?.let(cachedProductDetails::get)
            ?: cachedProductDetails[PRODUCT_ID_PRIMARY]
            ?: cachedProductDetails[PRODUCT_ID_FALLBACK]
        if (targetProduct == null) {
            // If details not cached yet, reconnect and query
            startConnection {
                val product = customProductId?.let(cachedProductDetails::get)
                    ?: cachedProductDetails[PRODUCT_ID_PRIMARY]
                    ?: cachedProductDetails[PRODUCT_ID_FALLBACK]
                if (product != null) {
                    executeLaunchFlow(product)
                } else {
                    notifyWebPurchaseError("Google Play product details unavailable. Please verify Play Console setup.")
                }
            }
            return
        }

        executeLaunchFlow(targetProduct)
    }

    private fun executeLaunchFlow(productDetails: ProductDetails) {
        val productDetailsParams = BillingFlowParams.ProductDetailsParams.newBuilder()
            .setProductDetails(productDetails)
            .build()

        val billingFlowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(listOf(productDetailsParams))
            .build()

        billingClient.launchBillingFlow(activity, billingFlowParams)
    }

    override fun onPurchasesUpdated(billingResult: BillingResult, purchases: List<Purchase>?) {
        when (billingResult.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                if (!purchases.isNullOrEmpty()) {
                    for (purchase in purchases) {
                        handlePurchase(purchase)
                    }
                }
            }
            BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> {
                Log.d(TAG, "Item already owned. Automatically restoring purchases.")
                restorePurchases()
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> {
                Log.d(TAG, "Google Play purchase cancelled by user.")
                notifyWebPurchaseCancelled()
            }
            else -> {
                Log.e(TAG, "Google Play purchase failed with code: ${billingResult.responseCode}")
                notifyWebPurchaseError("Play purchase failed: ${billingResult.debugMessage}")
            }
        }
    }

    private fun handlePurchase(purchase: Purchase) {
        if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
            val productId = purchase.products.firstOrNull()
            if (productId.isNullOrBlank()) {
                notifyWebPurchaseError("Google Play did not return a product identifier.")
                return
            }
            // The server verifies and acknowledges the purchase with Google before granting Pro.
            notifyWebPurchaseSuccess(purchase.purchaseToken, productId)
        }
    }

    fun restorePurchases() {
        if (!isConnected) {
            startConnection { restorePurchases() }
            return
        }

        val params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.INAPP)
            .build()

        billingClient.queryPurchasesAsync(params) { billingResult, purchases ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                for (purchase in purchases) {
                    if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
                        handlePurchase(purchase)
                    }
                }
            }
        }
    }

    private fun notifyWebPurchaseSuccess(purchaseToken: String, productId: String) {
        activity.runOnUiThread {
            webViewProvider()?.evaluateJavascript(
                "if (window.onGooglePlayPurchaseSuccess) { window.onGooglePlayPurchaseSuccess(${org.json.JSONObject.quote(purchaseToken)}, ${org.json.JSONObject.quote(productId)}); }",
                null
            )
        }
    }

    private fun notifyWebPurchaseError(message: String) {
        activity.runOnUiThread {
            webViewProvider()?.evaluateJavascript(
                "if (window.onGooglePlayPurchaseError) { window.onGooglePlayPurchaseError(${org.json.JSONObject.quote(message)}); }",
                null
            )
        }
    }

    private fun notifyWebPurchaseCancelled() {
        activity.runOnUiThread {
            webViewProvider()?.evaluateJavascript(
                "if (window.onGooglePlayPurchaseCancelled) { window.onGooglePlayPurchaseCancelled(); }",
                null
            )
        }
    }

    companion object {
        private const val TAG = "PlayBillingManager"
        const val PRODUCT_ID_PRIMARY = "forgeos_pro_lifetime"
        const val PRODUCT_ID_FALLBACK = "pro_lifetime"
    }
}
// Source: https://developer.android.com/google/play/billing/integrate
