# ProGuard rules for ForgeOS native WebView wrapper
# Minimal rules — most shrinking is handled by R8's default config.

# Keep WebViewClient subclasses (reflection-based by Android system)
-keep class com.forgeos.mastery.** { *; }
-keep class * extends android.webkit.WebViewClient { *; }
-keep class * extends android.webkit.WebChromeClient { *; }

# Keep AndroidX WebKit compat classes
-keep class androidx.webkit.** { *; }

# Compose
-keep class androidx.compose.** { *; }
-dontwarn androidx.compose.**

# Kotlin coroutines / StateFlow
-keepnames class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.coroutines.**

# Kotlin metadata (needed for reflection-free Kotlin code)
-keep class kotlin.Metadata { *; }
