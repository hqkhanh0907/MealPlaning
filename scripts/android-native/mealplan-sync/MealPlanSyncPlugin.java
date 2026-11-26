package com.healthmate.ai.sync;

import android.content.Context;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

@CapacitorPlugin(name = "MealPlanSync")
public final class MealPlanSyncPlugin extends Plugin {
    private static final String ALLOWED_ORIGIN = "https://cachyos-x8664.tailb306f9.ts.net";
    private static final ExecutorService CONTROL = Executors.newSingleThreadExecutor();
    private static final ExecutorService NETWORK = Executors.newFixedThreadPool(3);
    private Context context;
    private SessionVault vault;

    @Override public void load() {
        context = getContext().getApplicationContext();
        vault = new SessionVault(context);
        new SyncProgress(context).createChannel();
    }

    @PluginMethod public void configure(PluginCall call) {
        run(call, CONTROL, () -> {
            String owner = call.getString("ownerId", "");
            String database = call.getString("dbName", "");
            String origin = call.getString("origin", "");
            String access = call.getString("accessToken", "");
            if (!owner.matches("[a-z0-9]{15}") || !database.matches("healthmate(?:_dev)?_" + owner) ||
                !origin.equals(ALLOWED_ORIGIN) || access.isEmpty()) throw new IllegalArgumentException("Invalid account configuration");
            SessionVault.Session previous = null;
            try { previous = vault.read(); }
            catch (Exception invalid) { Log.w("MealPlanSync", "previous session unavailable"); }
            JSONObject input = new JSONObject().put("ownerId", owner).put("dbName", database).put("origin", origin)
                .put("accessToken", access).put("sessionToken", call.getString("sessionToken", ""))
                .put("accessExpiresAt", call.getString("accessExpiresAt", ""))
                .put("username", call.getString("username", "")).put("fullName", call.getString("fullName", ""));
            SessionVault.Session account = vault.replace(input);
            SyncSchedule schedule = new SyncSchedule(context);
            if (previous != null) schedule.cancel(previous);
            schedule.periodic(account);
            return null;
        });
    }

    @PluginMethod public void session(PluginCall call) {
        boolean renew = Boolean.TRUE.equals(call.getBoolean("renew", false));
        run(call, renew ? NETWORK : CONTROL, () -> {
            SessionVault.Session account = vault.read();
            if (account == null) return new JSObject();
            if (!renew) return account.publicData();
            try {
                return new SessionAuthorizer(vault).get(account, null).publicData();
            } catch (SessionAuthorizer.Reauthentication expired) {
                return vault.whileCurrent(account, () -> vault.read().publicData());
            } catch (IOException offline) {
                return vault.whileCurrent(account, () -> {
                    JSObject result = vault.read().publicData();
                    result.put("reason", "offline");
                    return result;
                });
            } catch (SessionVault.SessionChanged changed) {
                return new JSObject();
            }
        });
    }

    @PluginMethod public void updateProfile(PluginCall call) {
        run(call, CONTROL, () -> {
            SessionVault.Session account = vault.read();
            if (account != null) vault.update(account, new JSONObject().put("fullName", call.getString("fullName", "")));
            return null;
        });
    }

    @PluginMethod public void enqueue(PluginCall call) {
        run(call, CONTROL, () -> {
            SessionVault.Session account = vault.read();
            if (account != null && account.reason.isEmpty() && account.ownerId.equals(call.getString("ownerId"))) {
                new SyncSchedule(context).enqueue(account, Boolean.TRUE.equals(call.getBoolean("guard", false)));
            }
            return null;
        });
    }

    @PluginMethod public void status(PluginCall call) {
        run(call, CONTROL, () -> {
            SessionVault.Session account = vault.read();
            return account == null ? SyncEngine.idle() : new SyncStatus(context, account.ownerId).details(false);
        });
    }

    @PluginMethod public void syncNow(PluginCall call) { transfer(call, null); }

    @PluginMethod public void resolveConflict(PluginCall call) {
        Boolean useServer = call.getBoolean("useServer");
        if (useServer == null) call.reject("Missing conflict choice", "native_sync_choice_required");
        else transfer(call, useServer);
    }

    @PluginMethod public void clear(PluginCall call) {
        run(call, CONTROL, () -> {
            SessionVault.Session account = null;
            try { account = vault.clear(); }
            catch (Exception invalid) { Log.w("MealPlanSync", "cleared unavailable session"); }
            new SyncProgress(context).cancel();
            if (account != null) {
                SessionVault.Session signedOut = account;
                NETWORK.execute(() -> revoke(signedOut));
                new SyncSchedule(context).cancel(account);
            }
            return null;
        });
    }

    private void transfer(PluginCall call, Boolean choice) {
        run(call, NETWORK, () -> {
            SessionVault.Session account = vault.read();
            if (account == null) return SyncEngine.idle();
            return new SyncEngine(context).run(account, "manual", UUID.randomUUID().toString(), choice, () -> false);
        });
    }

    private void revoke(SessionVault.Session account) {
        try {
            JSONObject body = new JSONObject();
            if (!account.sessionToken.isEmpty()) body.put("sessionToken", account.sessionToken);
            new MealPlanApi(account.origin).request(MealPlanApi.LOGOUT, account.accessToken, body);
        } catch (Exception unavailable) {
            Log.i("MealPlanSync", "logout completed on device");
        }
    }

    private void run(PluginCall call, ExecutorService executor, SessionVault.Checked<JSObject> action) {
        executor.execute(() -> {
            try {
                JSObject data = action.run();
                if (data == null) call.resolve();
                else call.resolve(data);
            } catch (Exception error) {
                if (error instanceof InterruptedException) Thread.currentThread().interrupt();
                Log.w("MealPlanSync", "bridge failed type=" + error.getClass().getSimpleName());
                call.reject("Native synchronization could not finish", "native_sync_failed");
            }
        });
    }
}
