# ForgeOS — Native Android App

Native Android WebView wrapper for the ForgeOS Next.js web app.
Replaces the Bubblewrap/PWABuilder TWA shell to **permanently eliminate
the Chrome address-bar flash** on cold launch.

## How it works

```
TWA (old):   Android → Chrome Custom Tab → assetlinks verify → load URL
             Chrome controls splash → flash occurs

Native (new): Android → MainActivity → native SplashScreen → WebView
              YOU control splash → held until onPageFinished → no flash
```

## Project Structure

```
android/
├── build.gradle.kts              Root Gradle build
├── settings.gradle.kts           Module declarations
├── gradle/
│   ├── libs.versions.toml        Version catalog (all dependency versions)
│   └── wrapper/
│       └── gradle-wrapper.properties
└── app/
    ├── build.gradle.kts          App-level build
    ├── proguard-rules.pro
    └── src/main/
        ├── AndroidManifest.xml
        ├── kotlin/com/forgeos/mastery/
        │   ├── MainActivity.kt         Entry point — splash screen logic
        │   ├── WebAppViewModel.kt      isLoading StateFlow
        │   └── ui/
        │       └── ForgeWebView.kt     Compose WebView wrapper
        └── res/
            ├── drawable/ic_splash_icon.xml
            ├── values/colors.xml
            ├── values/strings.xml
            └── values/themes.xml
```

## Setup in Android Studio

### 1. Open the project
- Android Studio → **File → Open** → select the `android/` folder

### 2. Replace the splash icon
- Right-click `res/` → **New → Image Asset**
- Asset type: **Launcher Icons (Adaptive and Legacy)**
- Source: browse to `../public/icons/icon-512.png`
- Package name: `com.forgeos.mastery`
- Click **Next → Finish**
- This generates `mipmap-*/ic_launcher*` at all densities

### 3. Update `ic_splash_icon` reference
After generating the icon, update `res/values/themes.xml`:
```xml
<item name="windowSplashScreenAnimatedIcon">@mipmap/ic_launcher</item>
```

### 4. Build & sign for Play Store
```bash
# In Android Studio: Build → Generate Signed Bundle/APK
# Choose Android App Bundle (.aab)
# Use your existing keystore (same one used for the TWA)
# versionCode MUST be ≥ 3 (codes 1 and 2 were used by the TWA)
```

### 5. Upload to Play Console
- Go to **Closed Testing → Create new release**
- Upload the signed `.aab`
- Version code: `3`, version name: `1.0.3`

## Updating the app URL

If you move from Vercel to a custom domain, update in `app/build.gradle.kts`:
```kotlin
buildConfigField("String", "APP_URL", "\"https://your-custom-domain.com\"")
```

No Kotlin source changes needed.

## Key files

| File | Purpose |
|------|---------|
| [`MainActivity.kt`](app/src/main/kotlin/com/forgeos/mastery/MainActivity.kt) | Holds native splash open until WebView is ready |
| [`WebAppViewModel.kt`](app/src/main/kotlin/com/forgeos/mastery/WebAppViewModel.kt) | `isLoading` StateFlow — bridges WebView events to splash screen |
| [`ui/ForgeWebView.kt`](app/src/main/kotlin/com/forgeos/mastery/ui/ForgeWebView.kt) | Secure WebView: JS, DOM storage, back nav, domain allow-list |
| [`themes.xml`](app/src/main/res/values/themes.xml) | Splash screen colours — must match `#060609` |

## API compliance

- `targetSdk = 36` (Android 16) — no orientation lock, no `resizeableActivity=false`
- No deprecated APIs: no `AsyncTask`, no `onBackPressed()`, no `MutableLiveData`
- Back navigation uses `BackHandler` (Compose Predictive Back compatible)
- All dependency versions verified via [Google Maven](https://maven.google.com)
