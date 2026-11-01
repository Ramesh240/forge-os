package com.forgeos.mastery.bridge

import android.Manifest
import android.app.Activity
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.webkit.JavascriptInterface
import android.widget.Toast
import androidx.core.app.ActivityCompat
import com.forgeos.mastery.billing.PlayBillingManager
import com.forgeos.mastery.notifications.HabitReminderReceiver
import com.forgeos.mastery.notifications.StreakDangerReceiver
import java.util.Calendar

class ForgeAndroidBridge(
    private val activity: Activity,
    private val playBillingManager: PlayBillingManager? = null,
    private val onAppContentReady: (() -> Unit)? = null,
) {

    @JavascriptInterface
    fun isNativeApp(): Boolean = true

    /**
     * Returns the exact version name configured in build.gradle.kts (e.g., "1.0.12").
     * Allows the Web UI (Quick Tools, Settings) to dynamically display the matching native version.
     */
    @JavascriptInterface
    fun getAppVersion(): String {
        return try {
            val pInfo = activity.packageManager.getPackageInfo(activity.packageName, 0)
            pInfo.versionName ?: "1.0.12"
        } catch (_: Exception) {
            "1.0.12"
        }
    }

    @JavascriptInterface
    fun isGooglePlayBillingSupported(): Boolean = true

    @JavascriptInterface
    fun launchGooglePlayPurchase(productId: String?) {
        activity.runOnUiThread {
            playBillingManager?.launchPurchaseFlow(productId)
        }
    }

    @JavascriptInterface
    fun restoreGooglePlayPurchases() {
        activity.runOnUiThread {
            playBillingManager?.restorePurchases()
        }
    }

    @JavascriptInterface
    fun requestNotificationPermission() {
        activity.runOnUiThread {
            HabitReminderReceiver.createNotificationChannel(activity)
            StreakDangerReceiver.createNotificationChannel(activity)
            com.forgeos.mastery.notifications.DailyMotivationReceiver.createNotificationChannel(activity)
            com.forgeos.mastery.notifications.DailyMotivationReceiver.scheduleDailyAlarm(activity)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                ActivityCompat.requestPermissions(
                    activity,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    REQUEST_CODE_POST_NOTIFICATIONS
                )
            } else {
                Toast.makeText(
                    activity,
                    "Habit notifications are active!",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    @JavascriptInterface
    fun scheduleAllDailyNotifications() {
        activity.runOnUiThread {
            com.forgeos.mastery.notifications.DailyMotivationReceiver.createNotificationChannel(activity)
            com.forgeos.mastery.notifications.DailyMotivationReceiver.scheduleDailyAlarm(activity)
        }
    }

    @JavascriptInterface
    fun onAppContentReady() {
        activity.runOnUiThread {
            onAppContentReady?.invoke()
        }
    }

    @JavascriptInterface
    fun scheduleHabitReminder(habitId: String, title: String, hour: Int, minute: Int) {
        val alarmManager = activity.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return

        val intent = Intent(activity, HabitReminderReceiver::class.java).apply {
            putExtra(HabitReminderReceiver.EXTRA_HABIT_ID, habitId)
            putExtra(HabitReminderReceiver.EXTRA_HABIT_TITLE, title)
        }

        val pendingIntent = PendingIntent.getBroadcast(
            activity,
            habitId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            if (before(Calendar.getInstance())) {
                add(Calendar.DAY_OF_YEAR, 1)
            }
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    calendar.timeInMillis,
                    pendingIntent
                )
            } else {
                alarmManager.set(
                    AlarmManager.RTC_WAKEUP,
                    calendar.timeInMillis,
                    pendingIntent
                )
            }
        } catch (_: SecurityException) {
            alarmManager.set(
                AlarmManager.RTC_WAKEUP,
                calendar.timeInMillis,
                pendingIntent
            )
        }
    }

    @JavascriptInterface
    fun cancelHabitReminder(habitId: String) {
        val alarmManager = activity.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val intent = Intent(activity, HabitReminderReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            activity,
            habitId.hashCode(),
            intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent)
            pendingIntent.cancel()
        }
    }

    @JavascriptInterface
    fun scheduleStreakDangerAlert(habitId: String, title: String, streakCount: Int) {
        val alarmManager = activity.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return

        val intent = Intent(activity, StreakDangerReceiver::class.java).apply {
            putExtra(StreakDangerReceiver.EXTRA_HABIT_ID, habitId)
            putExtra(StreakDangerReceiver.EXTRA_HABIT_TITLE, title)
            putExtra(StreakDangerReceiver.EXTRA_STREAK_COUNT, streakCount)
        }

        val pendingIntent = PendingIntent.getBroadcast(
            activity,
            (habitId + "_danger").hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 20)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            if (before(Calendar.getInstance())) {
                add(Calendar.DAY_OF_YEAR, 1)
            }
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    calendar.timeInMillis,
                    pendingIntent
                )
            } else {
                alarmManager.set(
                    AlarmManager.RTC_WAKEUP,
                    calendar.timeInMillis,
                    pendingIntent
                )
            }
        } catch (_: SecurityException) {
            alarmManager.set(
                AlarmManager.RTC_WAKEUP,
                calendar.timeInMillis,
                pendingIntent
            )
        }
    }

    @JavascriptInterface
    fun cancelStreakDangerAlert(habitId: String) {
        val alarmManager = activity.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val intent = Intent(activity, StreakDangerReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            activity,
            (habitId + "_danger").hashCode(),
            intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent)
            pendingIntent.cancel()
        }
    }

    @JavascriptInterface
    fun setSystemBarTheme(theme: String?, isDark: Boolean) {
        activity.runOnUiThread {
            try {
                androidx.core.view.WindowCompat.getInsetsController(activity.window, activity.window.decorView)?.let { controller ->
                    controller.isAppearanceLightStatusBars = !isDark
                    controller.isAppearanceLightNavigationBars = !isDark
                }
            } catch (_: Exception) {
            }
        }
    }

    @JavascriptInterface
    fun startFocusTimerService(title: String, subtitle: String, baseTimeMillis: Long, isCountdown: Boolean) {
    }

    @JavascriptInterface
    fun stopFocusTimerService() {
    }

    @JavascriptInterface
    fun showToast(message: String) {
        activity.runOnUiThread {
            Toast.makeText(activity, message, Toast.LENGTH_SHORT).show()
        }
    }

    companion object {
        const val REQUEST_CODE_POST_NOTIFICATIONS = 1001
    }
}

// Source: https://developer.android.com/reference/android/webkit/JavascriptInterface
// Source: https://developer.android.com/reference/android/content/pm/PackageManager
