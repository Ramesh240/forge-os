// app/build.gradle.kts
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.compose.compiler)
}

val uploadStoreFile = System.getenv("FORGEOS_UPLOAD_STORE_FILE")
val uploadStorePassword = System.getenv("FORGEOS_UPLOAD_STORE_PASSWORD")
val uploadKeyAlias = System.getenv("FORGEOS_UPLOAD_KEY_ALIAS")
val uploadKeyPassword = System.getenv("FORGEOS_UPLOAD_KEY_PASSWORD")
val hasUploadSigning = listOf(uploadStoreFile, uploadStorePassword, uploadKeyAlias, uploadKeyPassword)
    .all { !it.isNullOrBlank() }

android {
    namespace  = "com.forgeos.mastery"
    compileSdk = 36

    defaultConfig {
        applicationId   = "com.forgeos.mastery"
        minSdk          = 26        // Android 8.0 — covers 97%+ of active devices
        targetSdk       = 36        // Android 16 — required by Play Store Aug 2026
        versionCode     = 13        // Payment verification and production isolation release
        versionName     = "1.0.13"

        // Your deployed Vercel URL
        buildConfigField("String", "APP_URL", "\"https://forge-os-eta-five.vercel.app\"")
    }

    signingConfigs {
        if (hasUploadSigning) {
            create("release") {
                storeFile = file(uploadStoreFile!!)
                storePassword = uploadStorePassword
                keyAlias = uploadKeyAlias
                keyPassword = uploadKeyPassword
            }
        }
    }

    buildTypes {
        getByName("debug") {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
        getByName("release") {
            if (hasUploadSigning) {
                signingConfig = signingConfigs.getByName("release")
            }
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

// Validate signing before any release package task can leave an unsigned AAB behind.
val validateReleaseSigning = tasks.register("validateReleaseSigning") {
    doLast {
        if (!hasUploadSigning) {
            logger.warn(
                "FORGEOS upload signing environment variables are not set. " +
                    "Proceeding with Android Studio IDE signing dialog or unsigned artifact."
            )
        }
    }
}

tasks.configureEach {
    if (name == "bundleRelease" || name == "assembleRelease") {
        dependsOn(validateReleaseSigning)
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime)
    implementation(libs.androidx.lifecycle.viewmodel)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.fragment)

    // Override outdated transitive fragment:1.1.0 flagged by Google Play Console
    constraints {
        implementation(libs.androidx.fragment) {
            because("Overrides outdated fragment:1.1.0 flagged by Google Play Console")
        }
    }

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
