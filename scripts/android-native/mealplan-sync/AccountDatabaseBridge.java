package com.healthmate.ai.sync;

import android.content.Context;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

public abstract class AccountDatabaseBridge extends Plugin {
    private static final ExecutorService IO = Executors.newSingleThreadExecutor();
    private Context context;
    private SessionVault vault;
    private Boolean linked;

    protected abstract String scope();
    protected abstract boolean accepts(String op);
    protected abstract String execute(String directory, String owner, String database, String command, Runnable beforeWrite) throws IOException;

    private String label() {
        String value = scope();
        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }

    @Override public void load() {
        context = getContext().getApplicationContext();
        vault = new SessionVault(context);
    }

    private synchronized boolean available() throws IOException {
        if (linked == null) {
            try {
                System.loadLibrary("sqlcipher");
                System.loadLibrary("healthmate_capacitor");
                linked = "1".equals(execute("", "", "", "{\"op\":\"probe\"}", null));
            } catch (UnsatisfiedLinkError absent) {
                linked = false;
            }
        }
        return linked;
    }

    static String issue(String scope, String owner, String generation, String reason, SessionVault.Session current) {
        if (current == null || current.generation.isEmpty()) return scope + "_session_required";
        if (owner == null || !owner.equals(current.ownerId)) return scope + "_session_changed";
        if ("session_revoked".equals(current.reason)) return scope + "_session_revoked";
        if (generation != null && (!generation.equals(current.generation) || !current.reason.equals(reason))) {
            return scope + "_session_changed";
        }
        return null;
    }

    private static JSObject identity(SessionVault.Session session) {
        return new JSObject().put("ownerId", session.ownerId)
            .put("generation", session.generation).put("reason", session.reason);
    }

    @PluginMethod public final void binding(PluginCall call) {
        IO.execute(() -> {
            try {
                SessionVault.Session current = vault.read();
                String issue = issue(scope(), call.getString("ownerId"), null, null, current);
                if (issue != null) {
                    call.reject(label() + " account not available", issue);
                    return;
                }
                vault.whileCurrent(current, () -> {
                    SessionVault.Session latest = vault.read();
                    String changed = issue(scope(), current.ownerId, current.generation, current.reason, latest);
                    if (changed != null) call.reject(label() + " account changed", changed);
                    else call.resolve(identity(latest));
                    return null;
                });
            } catch (SessionVault.SessionChanged changed) {
                call.reject(label() + " account changed", scope() + "_session_changed");
            } catch (Exception error) {
                call.reject("Could not read " + scope() + " session", scope() + "_session_required");
            }
        });
    }

    @PluginMethod public final void apply(PluginCall call) {
        String owner = call.getString("ownerId");
        String generation = call.getString("generation");
        String reason = call.getString("reason");
        JSObject request = call.getObject("command");
        if (generation == null || generation.isEmpty() || reason == null || request == null ||
            !accepts(request.optString("op"))) {
            call.reject("Invalid " + scope() + " operation", scope() + "_invalid_request");
            return;
        }
        IO.execute(() -> {
            try {
                SessionVault.Session expected = vault.read();
                String issue = issue(scope(), owner, generation, reason, expected);
                if (issue != null) {
                    call.reject(label() + " account not available", issue);
                    return;
                }
                if (!available()) {
                    call.reject("Native " + scope() + " storage unavailable", scope() + "_native_unavailable");
                    return;
                }
                vault.whileCurrent(expected, () -> {
                    SessionVault.Session current = vault.read();
                    String changed = issue(scope(), owner, generation, reason, current);
                    if (changed != null || !expected.dbName.equals(current.dbName)) {
                        call.reject(label() + " account changed", changed == null ? scope() + "_session_changed" : changed);
                        return null;
                    }
                    String directory = context.getDatabasePath("healthmateSQLite.db").getParent();
                    JSONObject result = new JSONObject(execute(directory, owner, current.dbName,
                        request.toString(), () -> schedule(current, true)));
                    if (result.getBoolean("changed")) schedule(current, false);
                    call.resolve(identity(current).put("value", result.get("value")));
                    return null;
                });
            } catch (SessionVault.SessionChanged changed) {
                call.reject(label() + " account changed", scope() + "_session_changed");
            } catch (Exception error) {
                call.reject(error.getMessage(), scope() + "_data_error");
            }
        });
    }

    private void schedule(SessionVault.Session account, boolean guard) {
        try {
            new SyncSchedule(context).enqueue(account, guard);
        } catch (Exception | LinkageError unavailable) {
            android.util.Log.w("MealPlanSync", "Could not schedule sync. The periodic task will retry.");
        }
    }
}
