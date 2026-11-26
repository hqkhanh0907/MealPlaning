package com.healthmate.ai.sync;

import android.content.Context;
import androidx.work.BackoffPolicy;
import androidx.work.Constraints;
import androidx.work.Data;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.Operation;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import java.util.concurrent.TimeUnit;

final class SyncSchedule {
    private static final Constraints CONNECTED = new Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED).build();
    private final WorkManager manager;

    SyncSchedule(Context context) { manager = WorkManager.getInstance(context); }

    void periodic(SessionVault.Session account) throws Exception {
        PeriodicWorkRequest work = new PeriodicWorkRequest.Builder(MealPlanSyncWorker.class, 60, TimeUnit.MINUTES)
            .setConstraints(CONNECTED).setInputData(input(account, "periodic")).addTag(tag(account))
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 10, TimeUnit.SECONDS).build();
        await(manager.enqueueUniquePeriodicWork(tag(account) + "-periodic", ExistingPeriodicWorkPolicy.KEEP, work));
    }

    void enqueue(SessionVault.Session account, boolean guard) throws Exception {
        String source = guard ? "guard" : "pending";
        OneTimeWorkRequest.Builder builder = new OneTimeWorkRequest.Builder(MealPlanSyncWorker.class)
            .setConstraints(CONNECTED).setInputData(input(account, source)).addTag(tag(account))
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 10, TimeUnit.SECONDS);
        if (guard) builder.setInitialDelay(30, TimeUnit.SECONDS);
        await(manager.enqueueUniqueWork(tag(account) + "-" + source,
            guard ? ExistingWorkPolicy.REPLACE : ExistingWorkPolicy.KEEP, builder.build()));
    }

    void cancel(SessionVault.Session account) throws Exception { await(manager.cancelAllWorkByTag(tag(account))); }

    private static String tag(SessionVault.Session account) {
        return "mealplan-sync-" + account.ownerId + "-" + account.generation;
    }

    private static Data input(SessionVault.Session account, String source) {
        return new Data.Builder().putString("ownerId", account.ownerId)
            .putString("generation", account.generation).putString("source", source).build();
    }

    private static void await(Operation operation) throws Exception { operation.getResult().get(8, TimeUnit.SECONDS); }
}
