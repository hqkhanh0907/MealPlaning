package com.healthmate.ai.sync;

import android.content.Context;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.FileNotFoundException;
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
    private static final ExecutorService DASHBOARD = Executors.newSingleThreadExecutor();
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
            new SyncProgress(context).cancel();
            SyncSchedule schedule = new SyncSchedule(context);
            if (previous != null) schedule.cancel(previous);
            schedule.periodic(account);
            return null;
        });
    }

    private static JSObject publicSession(SessionVault.Session account) {
        return account.publicData(!MealPlanAccountPlugin.available());
    }

    @PluginMethod public void session(PluginCall call) {
        boolean renew = Boolean.TRUE.equals(call.getBoolean("renew", false));
        run(call, renew ? NETWORK : CONTROL, () -> {
            SessionVault.Session account = vault.read();
            if (account == null) return new JSObject();
            if (!renew) return publicSession(account);
            try {
                return publicSession(new SessionAuthorizer(vault).get(account, null));
            } catch (SessionAuthorizer.Reauthentication expired) {
                return vault.whileCurrent(account, () -> publicSession(vault.read()));
            } catch (IOException offline) {
                return vault.whileCurrent(account, () -> {
                    JSObject result = publicSession(vault.read());
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

    @PluginMethod public void deviceLabel(PluginCall call) {
        call.resolve(new JSObject().put("label", android.os.Build.MODEL));
    }

    @PluginMethod public void listDeviceSessions(PluginCall call) {
        String owner = call.getString("ownerId", "");
        run(call, NETWORK, () -> DeviceSessions.list(vault, owner));
    }

    @PluginMethod public void revokeDeviceSession(PluginCall call) {
        String owner = call.getString("ownerId", "");
        String id = call.getString("id", "");
        run(call, NETWORK, () -> DeviceSessions.revoke(vault, owner, id));
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

    private static native String dashboardSummaryNative(String directory, String owner, String dbName, String date) throws IOException;
    private static native String calendarDaysNative(String directory, String owner, String dbName, String start, String end) throws IOException;

    private static native String catalogReadNative(String directory, String owner, String dbName, String command) throws IOException;

    private interface AccountRead {
        String load(String directory, SessionVault.Session session) throws IOException;
    }

    static String dashboardSessionIssue(SessionVault.Session expected, SessionVault.Session current) {
        return readSessionIssue("dashboard", expected, current);
    }

    private static String readSessionIssue(String scope, SessionVault.Session expected, SessionVault.Session current) {
        if (current == null || current.generation.isEmpty()) {
            return scope + (expected == null ? "_session_required" : "_session_changed");
        }
        if (expected != null && (!expected.ownerId.equals(current.ownerId) ||
            !expected.generation.equals(current.generation) || !expected.dbName.equals(current.dbName))) return scope + "_session_changed";
        if ("session_revoked".equals(current.reason)) return scope + "_session_revoked";
        return expected != null && !expected.reason.equals(current.reason) ? scope + "_session_changed" : null;
    }

    static String bindDashboardOwner(SessionVault.Session expected, SessionVault.Session current, JSObject snapshot) {
        return bindReadOwner("dashboard", expected, current, snapshot);
    }

    private static String bindReadOwner(String scope, SessionVault.Session expected, SessionVault.Session current, JSObject snapshot) {
        String issue = readSessionIssue(scope, expected, current);
        if (issue == null) snapshot.put("ownerId", current.ownerId);
        return issue;
    }

    @PluginMethod public void dashboardSummary(PluginCall call) {
        String date = call.getString("date");
        if (date == null || call.getData().length() != 1) {
            call.reject("Supply a calendar date only", "dashboard_invalid_date");
            return;
        }
        requestRead(call, "Dashboard", (directory, session) ->
            dashboardSummaryNative(directory, session.ownerId, session.dbName, date));
    }

    @PluginMethod public void catalogRead(PluginCall call) {
        String owner = call.getString("ownerId");
        JSONObject command = call.getObject("command");
        if (owner == null || command == null || call.getData().length() != 2) {
            call.reject("Supply an account and a catalog command", "catalog_invalid_request");
            return;
        }
        requestRead(call, "Catalog", (directory, session) -> {
            if (!session.ownerId.equals(owner)) throw new SecurityException("Catalog account changed");
            return catalogReadNative(directory, session.ownerId, session.dbName, command.toString());
        });
    }

    @PluginMethod public void calendarDays(PluginCall call) {
        String start = call.getString("start");
        String end = call.getString("end");
        if (start == null || end == null || call.getData().length() != 2) {
            call.reject("Supply start and end dates only", "calendar_invalid_date");
            return;
        }
        requestRead(call, "Calendar", (directory, session) ->
            calendarDaysNative(directory, session.ownerId, session.dbName, start, end));
    }

    private void requestRead(PluginCall call, String label, AccountRead query) {
        String scope = label.toLowerCase(java.util.Locale.ROOT);
        try {
            SessionVault.Session expected = vault.read();
            String issue = readSessionIssue(scope, null, expected);
            if (issue != null) {
                call.reject(label + " session unavailable", issue);
                return;
            }
            DASHBOARD.execute(() -> readSnapshot(call, expected, scope, label, query));
        } catch (Exception unavailable) {
            call.reject("Could not read the local session", scope + "_session_required");
        }
    }

    private void readSnapshot(PluginCall call, SessionVault.Session expected, String scope, String label, AccountRead query) {
        try {
            String directory = context.getDatabasePath("healthmateSQLite.db").getParent();
            System.loadLibrary("sqlcipher");
            System.loadLibrary("healthmate_capacitor");
            JSObject snapshot = new JSObject(query.load(directory, expected));
            vault.whileCurrent(expected, () -> {
                String issue = bindReadOwner(scope, expected, vault.read(), snapshot);
                if (issue == null) call.resolve(snapshot);
                else call.reject(label + " session unavailable", issue);
                return null;
            });
        } catch (SessionVault.SessionChanged stale) {
            call.reject("The active session changed", scope + "_session_changed");
        } catch (IllegalArgumentException invalid) {
            call.reject("Invalid " + scope + " date", scope + "_invalid_date");
        } catch (SecurityException invalid) {
            call.reject("Invalid account database binding", scope + "_session_changed");
        } catch (FileNotFoundException unavailable) {
            call.reject("Account database not ready", scope + "_database_unavailable");
        } catch (UnsatisfiedLinkError unavailable) {
            call.reject(label + " native library unavailable", scope + "_native_unavailable");
        } catch (Exception failure) {
            call.reject("Could not read local " + scope, scope + "_read_failed");
        }
    }

    @PluginMethod public void syncNow(PluginCall call) { transfer(call, null); }

    @PluginMethod public void resolveConflict(PluginCall call) {
        Boolean useServer = call.getBoolean("useServer");
        if (useServer == null) call.reject("Missing conflict choice", "native_sync_choice_required");
        else transfer(call, useServer);
    }

    @PluginMethod public void resolveWorkoutConflict(PluginCall call) {
        JSONObject choice = call.getObject("resolution");
        if (choice == null || choice.optJSONObject("choices") == null) {
            call.reject("Missing conflict choices", "native_sync_choice_required");
        } else {
            transfer(call, null, choice);
        }
    }

    @PluginMethod public void clear(PluginCall call) {
        final long ticket;
        try {
            ticket = vault.beginClear(call.getString("ownerId"), call.getString("generation"));
        } catch (Exception stale) {
            call.reject("Account session changed", "account_changed");
            return;
        }
        run(call, CONTROL, () -> {
            SessionVault.Session account = null;
            try { account = vault.clearAfter(ticket, () -> new SyncProgress(context).cancel()); }
            catch (SessionVault.SessionChanged changed) { throw changed; }
            catch (Exception invalid) { Log.w("MealPlanSync", "cleared unavailable session"); }
            if (account != null) {
                SessionVault.Session signedOut = account;
                NETWORK.execute(() -> revoke(signedOut));
                new SyncSchedule(context).cancel(account);
            }
            return null;
        });
    }

    private void transfer(PluginCall call, Boolean choice) {
        transfer(call, choice, null);
    }

    private void transfer(PluginCall call, Boolean choice, JSONObject workoutChoice) {
        String owner = call.getString("ownerId", "");
        if (owner.isEmpty()) {
            call.reject("Missing sync owner", "native_sync_owner_required");
            return;
        }
        CONTROL.execute(() -> {
            try {
                SessionVault.Session account = vault.read();
                if (account == null || !owner.equals(account.ownerId)) {
                    call.resolve(SyncEngine.idle());
                    return;
                }
                run(call, NETWORK, () -> new SyncEngine(context).run(
                    account, "manual", UUID.randomUUID().toString(), choice, workoutChoice, () -> false));
            } catch (Exception error) {
                reject(call, error);
            }
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
                reject(call, error);
            }
        });
    }

    private void reject(PluginCall call, Exception error) {
        if (error instanceof InterruptedException) Thread.currentThread().interrupt();
        Log.w("MealPlanSync", "bridge failed type=" + error.getClass().getSimpleName());
        call.reject("Native synchronization could not finish", "native_sync_failed");
    }
}
