// app/build.gradle.kts
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.compose.compiler)
}

android {
    namespace  = "com.forgeos.mastery"
    compileSdk = 36

    defaultConfig {
        applicationId   = "com.forgeos.mastery"
        minSdk          = 26        // Android 8.0 — covers 97%+ of active devices
        targetSdk       = 36        // Android 16 — required by Play Store Aug 2026
        versionCode     = 8         // Bumped for splash screen & performance release
        versionName     = "1.0.8"

        // Your deployed Vercel URL
        buildConfigField("String", "APP_URL", "\"https://forge-os-eta-five.vercel.app\"")
    }

    signingConfigs {
        // Release signing is done via Android Studio's "Generate Signed Bundle"
        // or via CI using environment variables. Do NOT hardcode keystore paths here.
    }

    buildTypes {
        getByName("debug") {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
        getByName("release") {
            isMinifyEnabled    = true
            isShrinkResources  = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            ndk {
                debugSymbolLevel = "SYMBOL_TABLE"
            }
        }
    }

    buildFeatures {
        compose     = true
        buildConfig = true   // Needed for BuildConfig.APP_URL
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime)
    implementation(libs.androidx.lifecycle.viewmodel)
    implementation(libs.androidx.activity.compose)

    // Splash screen — holds native splash until WebView is ready
    implementation(libs.splashscreen)

    // WebKit — stable WebView wrapper with WebViewFeature compat checks
    implementation(libs.webkit)

    // Google Play In-App Billing for native Play Store purchases
    implementation(libs.play.billing)

    // Compose BOM — pins all androidx.compose.* to a consistent, tested set
    // Source: https://developer.android.com/jetpack/compose/bom
    val composeBom = platform(libs.compose.bom)
    implementation(composeBom)
    implementation(libs.compose.ui)
    implementation(libs.compose.material3)
    implementation(libs.compose.animation)
    implementation(libs.compose.ui.tooling.preview)
    debugImplementation(libs.compose.ui.tooling)

    testImplementation(libs.junit)
}

// Source: https://developer.android.com/develop/ui/views/launch/splash-screen
// Source: https://developer.android.com/jetpack/compose/bom
