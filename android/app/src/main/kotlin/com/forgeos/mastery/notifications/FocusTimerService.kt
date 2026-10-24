package com.forgeos.mastery.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.Uri
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import com.forgeos.mastery.MainActivity
import com.forgeos.mastery.R

class FocusTimerService : Service() {

    private var currentTitle: String = "ForgeOS Focus Timer"
    private var currentSubtitle: String = "Session in progress"
    private var currentBaseTime: Long = 0L
    private var currentIsCountdown: Boolean = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: ACTION_START

        when (action) {
            ACTION_STOP -> {
                ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_STOP_AND_LOG -> {
                ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
                stopSelf()

                val stopIntent = Intent(
                    Intent.ACTION_VIEW,
                    Uri.parse("https://forge-os-eta-five.vercel.app/?action=stop_and_log"),
                    this,
                    MainActivity::class.java
                ).apply {
                    this.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
                }
                startActivity(stopIntent)
                return START_NOT_STICKY
            }
            ACTION_EXTEND_5M -> {
                if (currentBaseTime != 0L) {
                    currentBaseTime += 300_000L
                }

                updateNotification()

                val extendIntent = Intent(
                    Intent.ACTION_VIEW,
                    Uri.parse("https://forge-os-eta-five.vercel.app/?action=extend_5m"),
                    this,
                    MainActivity::class.java
                ).apply {
                    this.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
                }
                startActivity(extendIntent)
                return START_NOT_STICKY
            }
            ACTION_START, ACTION_UPDATE -> {
                currentTitle = intent?.getStringExtra(EXTRA_TITLE) ?: "ForgeOS Focus Timer"
                currentSubtitle = intent?.getStringExtra(EXTRA_SUBTITLE) ?: "Session in progress"
                currentBaseTime = intent?.getLongExtra(EXTRA_BASE_TIME, System.currentTimeMillis()) ?: System.currentTimeMillis()
                currentIsCountdown = intent?.getBooleanExtra(EXTRA_IS_COUNTDOWN, false) ?: false

                createNotificationChannel(this)
                val notification = buildNotification()

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ServiceCompat.startForeground(
                        this,
                        NOTIFICATION_ID,
                        notification,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
                    )
                } else {
                    startForeground(NOTIFICATION_ID, notification)
                }
            }
        }

        return START_NOT_STICKY
    }

    private fun updateNotification() {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        manager?.notify(NOTIFICATION_ID, buildNotification())
    }

    private fun buildNotification(): android.app.Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            NOTIFICATION_ID,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopAndLogPendingIntent = PendingIntent.getService(
            this,
            ACTION_CODE_STOP_AND_LOG,
            Intent(this, FocusTimerService::class.java).apply {
                action = ACTION_STOP_AND_LOG
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val extend5mPendingIntent = PendingIntent.getService(
            this,
            ACTION_CODE_EXTEND_5M,
            Intent(this, FocusTimerService::class.java).apply {
                action = ACTION_EXTEND_5M
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(currentTitle)
            .setContentText(currentSubtitle)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(pendingIntent)
            .setWhen(currentBaseTime)
            .setUsesChronometer(true)
            .setChronometerCountDown(currentIsCountdown)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .addAction(
                android.R.drawable.ic_media_pause,
                "Stop & Log",
                stopAndLogPendingIntent
            )
            .addAction(
                android.R.drawable.ic_input_add,
                "+5 Min",
                extend5mPendingIntent
            )
            .build()
    }

    companion object {
        const val CHANNEL_ID = "forge_focus_timer_channel"
        const val NOTIFICATION_ID = 2001
        private const val ACTION_CODE_STOP_AND_LOG = 2002
        private const val ACTION_CODE_EXTEND_5M = 2003

        const val ACTION_START = "com.forgeos.mastery.ACTION_START_TIMER"
        const val ACTION_UPDATE = "com.forgeos.mastery.ACTION_UPDATE_TIMER"
        const val ACTION_STOP = "com.forgeos.mastery.ACTION_STOP_TIMER"
        const val ACTION_STOP_AND_LOG = "com.forgeos.mastery.ACTION_STOP_AND_LOG"
        const val ACTION_EXTEND_5M = "com.forgeos.mastery.ACTION_EXTEND_5M"

        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_SUBTITLE = "extra_subtitle"
        const val EXTRA_BASE_TIME = "extra_base_time"
        const val EXTRA_IS_COUNTDOWN = "extra_is_countdown"

        fun createNotificationChannel(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "Focus Timer Active",
                    NotificationManager.IMPORTANCE_LOW
                ).apply {
                    description = "Displays live stopwatch and Pomodoro timers while ForgeOS is in the background."
                    setShowBadge(false)
                }
                val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
                manager?.createNotificationChannel(channel)
            }
        }
    }
}
// Source: https://developer.android.com/develop/background-work/services/foreground-services
