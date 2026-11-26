package com.healthmate.ai.sync;

import android.content.Context;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import com.getcapacitor.JSObject;

public final class MealPlanSyncWorker extends Worker {
    public MealPlanSyncWorker(@NonNull Context context, @NonNull WorkerParameters parameters) {
        super(context, parameters);
    }

    @NonNull @Override public Result doWork() {
        Context context = getApplicationContext();
        try {
            SessionVault.Session account = new SessionVault(context).read();
            if (account == null || !account.ownerId.equals(getInputData().getString("ownerId")) ||
                !account.generation.equals(getInputData().getString("generation"))) return Result.success();
            String source = getInputData().getString("source");
            JSObject state = new SyncEngine(context).run(account, source, getId().toString(), null, this::isStopped);
            return "offline".equals(state.optString("status")) ? Result.retry() : Result.success();
        } catch (InterruptedException stopped) {
            Thread.currentThread().interrupt();
            return Result.retry();
        } catch (Exception failed) {
            Log.w("MealPlanSync", "worker retry type=" + failed.getClass().getSimpleName());
            return Result.retry();
        }
    }
}
