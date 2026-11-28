package com.healthmate.ai.sync;

import android.content.Context;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

@CapacitorPlugin(name = "MealPlanProfile")
public final class MealPlanProfilePlugin extends Plugin {
    private static final ExecutorService IO = Executors.newSingleThreadExecutor();
    private Context context;
    private SessionVault vault;
    private static Boolean linked;

    @Override public void load() {
        context = getContext().getApplicationContext();
        vault = new SessionVault(context);
    }

    private static native String profileNative(String directory, String owner, String database,
                                              String command, Runnable beforeWrite) throws IOException;

    private static synchronized boolean available() throws IOException {
        if (linked == null) {
            try {
                System.loadLibrary("sqlcipher");
                System.loadLibrary("healthmate_capacitor");
                linked = "1".equals(profileNative("", "", "", "{\"op\":\"probe\"}", null));
            } catch (UnsatisfiedLinkError absent) {
                linked = false;
            }
        }
        return linked;
    }

    static String sessionIssue(String owner, String generation, String reason, SessionVault.Session current) {
        if (current == null || current.generation.isEmpty()) return "profile_session_required";
        if (owner == null || !owner.equals(current.ownerId)) return "profile_session_changed";
        if ("session_revoked".equals(current.reason)) return "profile_session_revoked";
        if (generation != null && (!generation.equals(current.generation) || !current.reason.equals(reason))) {
            return "profile_session_changed";
        }
        return null;
    }

    private static JSObject identity(SessionVault.Session session) {
        JSObject value = new JSObject();
        value.put("ownerId", session.ownerId);
        value.put("generation", session.generation);
        value.put("reason", session.reason);
        return value;
    }

    @PluginMethod public void binding(PluginCall call) {
        IO.execute(() -> {
            try {
                SessionVault.Session current = vault.read();
                String issue = sessionIssue(call.getString("ownerId"), null, null, current);
                if (issue != null) {
                    call.reject("Profile account not available", issue);
                    return;
                }
                vault.whileCurrent(current, () -> {
                    SessionVault.Session latest = vault.read();
                    String changed = sessionIssue(current.ownerId, current.generation, current.reason, latest);
                    if (changed != null) call.reject("Profile account changed", changed);
                    else call.resolve(identity(latest));
                    return null;
                });
            } catch (SessionVault.SessionChanged changed) {
                call.reject("Profile account changed", "profile_session_changed");
            } catch (Exception error) {
                call.reject("Could not read profile session", "profile_session_required");
            }
        });
    }

    @PluginMethod public void apply(PluginCall call) {
        String owner = call.getString("ownerId");
        String generation = call.getString("generation");
        String reason = call.getString("reason");
        JSObject request = call.getObject("command");
        if (generation == null || generation.isEmpty() || reason == null || request == null ||
            !isOperation(request.optString("op"))) {
            call.reject("Invalid profile operation", "profile_invalid_request");
            return;
        }
        IO.execute(() -> {
            try {
                SessionVault.Session expected = vault.read();
                String issue = sessionIssue(owner, generation, reason, expected);
                if (issue != null) {
                    call.reject("Profile account not available", issue);
                    return;
                }
                if (!available()) {
                    call.reject("Native profile storage unavailable", "profile_native_unavailable");
                    return;
                }
                vault.whileCurrent(expected, () -> {
                    SessionVault.Session current = vault.read();
                    String currentIssue = sessionIssue(owner, generation, reason, current);
                    if (currentIssue != null || !expected.dbName.equals(current.dbName)) {
                        call.reject("Profile account changed", currentIssue == null ? "profile_session_changed" : currentIssue);
                        return null;
                    }
                    String directory = context.getDatabasePath("healthmateSQLite.db").getParent();
                    JSONObject result = new JSONObject(profileNative(directory, owner, current.dbName,
                        request.toString(), () -> schedule(current, true)));
                    if (result.getBoolean("changed")) schedule(current, false);
                    JSObject reply = identity(current);
                    reply.put("value", result.get("value"));
                    call.resolve(reply);
                    return null;
                });
            } catch (SessionVault.SessionChanged changed) {
                call.reject("Profile account changed", "profile_session_changed");
            } catch (Exception error) {
                call.reject(error.getMessage(), "profile_data_error");
            }
        });
    }

    private static boolean isOperation(String op) {
        return switch (op) {
            case "get", "latestWeight", "previousWeight", "insert", "update" -> true;
            default -> false;
        };
    }

    private void schedule(SessionVault.Session account, boolean guard) {
        try {
            new SyncSchedule(context).enqueue(account, guard);
        } catch (Exception | LinkageError unavailable) {
            android.util.Log.w("MealPlanProfile", "Could not schedule sync. The periodic task will retry.");
        }
    }
}
