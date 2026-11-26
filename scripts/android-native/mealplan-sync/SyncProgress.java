package com.healthmate.ai.sync;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.NotificationCompat;

final class SyncProgress {
    private static final String CHANNEL = "mealplan_data_sync";
    private static final int ID = 3028;
    private final Context context;
    private final NotificationManager manager;
    private boolean active;

    SyncProgress(Context context) {
        this.context = context;
        manager = context.getSystemService(NotificationManager.class);
    }

    void createChannel() {
        if (manager != null && Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(CHANNEL, "Đồng bộ dữ liệu", NotificationManager.IMPORTANCE_LOW);
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PRIVATE);
            manager.createNotificationChannel(channel);
        }
    }

    void sending() { show("Đang gửi dữ liệu", false); }
    void receiving() { show("Đang nhận dữ liệu", false); }

    void complete() {
        if (active) show("Đã hoàn tất đồng bộ", true);
        active = false;
    }

    void cancel() {
        if (manager != null) manager.cancel(ID);
        active = false;
    }

    private void show(String stage, boolean complete) {
        if (manager == null || !manager.areNotificationsEnabled()) return;
        if (Build.VERSION.SDK_INT >= 33 && context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return;
        createChannel();
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL)
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setContentTitle("Đồng bộ dữ liệu").setContentText(stage)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE).setOnlyAlertOnce(true)
            .setOngoing(!complete).setProgress(0, 0, !complete);
        if (complete) builder.setTimeoutAfter(4000).setAutoCancel(true);
        try {
            manager.notify(ID, builder.build());
            active = !complete;
        } catch (SecurityException revoked) { active = false; }
    }
}
