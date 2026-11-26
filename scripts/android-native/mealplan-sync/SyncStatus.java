package com.healthmate.ai.sync;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import org.json.JSONException;
import org.json.JSONObject;

final class SyncStatus {
    private final SharedPreferences prefs;

    SyncStatus(Context context, String ownerId) {
        prefs = context.getSharedPreferences("mealplan_sync_status_" + ownerId, Context.MODE_PRIVATE);
    }

    void begin(String source) {
        prefs.edit().putString("status", "working").putString("reason", "")
            .putString("source", source).putString("lastStarted", SyncTime.now()).apply();
    }

    void finish(String state, String reason, long remoteVersion, JSONObject conflict) {
        String now = SyncTime.now();
        SharedPreferences.Editor editor = prefs.edit().putString("status", state).putString("reason", reason)
            .putString("lastFinished", now);
        if (state.equals("saved")) editor.putString("lastSync", now);
        if (remoteVersion > 0) editor.putLong("remoteRevision", remoteVersion);
        if (conflict == null) editor.remove("workoutConflict");
        else editor.putString("workoutConflict", conflict.toString());
        editor.apply();
    }

    JSONObject workoutConflict() {
        String value = prefs.getString("workoutConflict", null);
        if (value == null) return null;
        try { return new JSONObject(value); }
        catch (JSONException invalid) { return null; }
    }

    JSObject details(boolean remoteApplied) {
        JSObject result = new JSObject();
        result.put("status", prefs.getString("status", "idle"));
        result.put("reason", prefs.getString("reason", ""));
        result.put("source", prefs.getString("source", ""));
        result.put("lastSync", prefs.getString("lastSync", ""));
        result.put("lastStarted", prefs.getString("lastStarted", ""));
        result.put("lastFinished", prefs.getString("lastFinished", ""));
        result.put("remoteApplied", remoteApplied);
        result.put("remoteRevision", prefs.getLong("remoteRevision", 0));
        JSONObject conflict = workoutConflict();
        if (conflict != null && result.getString("status", "").equals("conflict")) result.put("workoutConflict", conflict);
        return result;
    }
}
