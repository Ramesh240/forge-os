# ProGuard / R8 optimization rules for ForgeOS
# Source: https://developer.android.com/build/shrink-code

# Preserve JavaScript interface methods for WebView bridge reflection
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve ForgeAndroidBridge public methods accessed via WebView
-keepclassmembers class com.forgeos.mastery.bridge.ForgeAndroidBridge {
    public *;
}

# Google Play In-App Billing Client
-keep class com.android.billingclient.api.** { *; }
-dontwarn com.android.billingclient.api.**

# Coroutines internal dispatcher preservation
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-dontwarn kotlinx.coroutines.**
