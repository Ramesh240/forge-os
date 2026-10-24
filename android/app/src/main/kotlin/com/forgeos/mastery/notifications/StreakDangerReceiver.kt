package com.forgeos.mastery.notifications

import android.Manifest
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

class StreakDangerReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val habitId = intent.getStringExtra(EXTRA_HABIT_ID) ?: return
        val habitTitle = intent.getStringExtra(EXTRA_HABIT_TITLE) ?: "Habit Streak"
        val streakCount = intent.getIntExtra(EXTRA_STREAK_COUNT, 1)

        createNotificationChannel(context)

        // Android 13+ runtime permission check
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val hasPerm = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!hasPerm) return
        }

        // Deep link intent to launch ForgeOS with ?startHabit=<habitId>
        val deepLinkIntent = Intent(
            Intent.ACTION_VIEW,
            Uri.parse("https://forge-os-eta-five.vercel.app/?startHabit=$habitId"),
            context,
            MainActivity::class.java
        ).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            (habitId + "_danger").hashCode(),
            deepLinkIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val streakText = if (streakCount > 1) "$streakCount-Day Streak" else "Streak"
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("⚡ Streak at Risk: $habitTitle")
            .setContentText("Your $streakText is on the line. 2-min micro-start before midnight saves it!")
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText("Your $streakText is on the line. Complete your 2-minute micro-start for \"$habitTitle\" before midnight to keep your momentum alive!")
            )
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .build()

        val notificationManager = NotificationManagerCompat.from(context)
        try {
            notificationManager.notify((habitId + "_danger").hashCode(), notification)
        } catch (_: SecurityException) {
            // Handled safely if permission revoked
        }
    }

    companion object {
        const val CHANNEL_ID = "forge_streak_danger"
        const val EXTRA_HABIT_ID = "extra_habit_id"
        const val EXTRA_HABIT_TITLE = "extra_habit_title"
        const val EXTRA_STREAK_COUNT = "extra_streak_count"

        fun createNotificationChannel(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val name = "Streak Danger Alerts"
                val descriptionText = "Urgent evening reminders when an active habit streak is at risk of breaking"
                val importance = NotificationManager.IMPORTANCE_HIGH
                val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                    description = descriptionText
                    enableVibration(true)
                }
                val notificationManager =
                    context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                notificationManager.createNotificationChannel(channel)
            }
        }
    }
}
// Source: https://developer.android.com/develop/ui/views/notifications/build-notification
