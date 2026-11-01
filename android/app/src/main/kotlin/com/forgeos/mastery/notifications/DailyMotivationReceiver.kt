package com.forgeos.mastery.notifications

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.forgeos.mastery.MainActivity
import com.forgeos.mastery.R
import java.util.Calendar

class DailyMotivationReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED -> {
                scheduleDailyAlarm(context)
            }
            ACTION_DAILY_MOTIVATION -> {
                showDailyNotification(context)
                scheduleDailyAlarm(context)
            }
        }
    }

    companion object {
        const val CHANNEL_ID = "forge_daily_motivation"
        const val ACTION_DAILY_MOTIVATION = "com.forgeos.mastery.DAILY_MOTIVATION"
        private const val NOTIF_ID = 3001
        private const val REQUEST_CODE = 3002
        private const val DEFAULT_HOUR = 9 // 9:00 AM
        private const val DEFAULT_MINUTE = 0

        private val MESSAGES = listOf(
            "🔥 Time to Forge. Your habits are waiting.",
            "⚡ 2 minutes. That's all it takes to keep your streak alive.",
            "🎯 Champions show up every day. Will you?",
            "💪 Your future self is built one micro-start at a time.",
            "🧠 Consistency compounds. Open ForgeOS and add to yours.",
            "⚡ The forge doesn't cool down. Neither should you.",
            "🌅 New day. New rep. Keep building your identity.",
            "🔑 Your habits are the key. Forge them today.",
            "🎖️ Day by day, rep by rep — you're becoming unstoppable.",
            "🚀 Small actions, massive results. Start your 2-minute micro-habit.",
            "💎 Diamond is formed under pressure. Show up anyway.",
            "🏆 Every streak started with one decision. Make it now."
        )

        fun createNotificationChannel(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "Daily Motivation",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "Daily habit-building nudges to keep your streak alive"
                    enableVibration(true)
                }
                val notificationManager =
                    context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                notificationManager.createNotificationChannel(channel)
            }
        }

        fun scheduleDailyAlarm(context: Context, hour: Int = DEFAULT_HOUR, minute: Int = DEFAULT_MINUTE) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
            val pendingIntent = buildPendingIntent(context)

            val calendar = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, hour)
                set(Calendar.MINUTE, minute)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
                if (timeInMillis <= System.currentTimeMillis()) {
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

        private fun buildPendingIntent(context: Context): PendingIntent {
            val intent = Intent(context, DailyMotivationReceiver::class.java).apply {
                action = ACTION_DAILY_MOTIVATION
            }
            return PendingIntent.getBroadcast(
                context,
                REQUEST_CODE,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }

        private fun showDailyNotification(context: Context) {
            createNotificationChannel(context)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                val hasPerm = ContextCompat.checkSelfPermission(
                    context,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED
                if (!hasPerm) return
            }

            val dayOfYear = Calendar.getInstance().get(Calendar.DAY_OF_YEAR)
            val messageIndex = dayOfYear % MESSAGES.size
            val motivationalQuote = MESSAGES[messageIndex]

            val openAppIntent = Intent(
                Intent.ACTION_VIEW,
                Uri.parse("https://forge-os-eta-five.vercel.app/"),
                context,
                MainActivity::class.java
            ).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }

            val pendingIntent = PendingIntent.getActivity(
                context,
                NOTIF_ID,
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("ForgeOS Daily Mastery")
                .setContentText(motivationalQuote)
                .setStyle(NotificationCompat.BigTextStyle().bigText(motivationalQuote))
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .build()

            val notificationManager = NotificationManagerCompat.from(context)
            try {
                notificationManager.notify(NOTIF_ID, notification)
            } catch (_: SecurityException) {
            }
        }
    }
}

// Source: https://developer.android.com/develop/ui/views/notifications/build-notification

