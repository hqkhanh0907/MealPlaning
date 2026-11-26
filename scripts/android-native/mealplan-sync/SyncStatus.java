package com.healthmate.ai.sync;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;

final class SyncStatus {
    private final SharedPreferences prefs;

    SyncStatus(Context context, String ownerId) {
        prefs = context.getSharedPreferences("mealplan_sync_status_" + ownerId, Context.MODE_PRIVATE);
    }

    void begin(String source) {
        prefs.edit().putString("status", "working").putString("reason", "")
            .putString("source", source).putString("lastStarted", SyncTime.now()).apply();
    }

    void finish(String state, String reason, long remoteVersion) {
        String now = SyncTime.now();
        SharedPreferences.Editor editor = prefs.edit().putString("status", state).putString("reason", reason)
            .putString("lastFinished", now);
        if (state.equals("saved")) editor.putString("lastSync", now);
        if (remoteVersion > 0) editor.putLong("remoteRevision", remoteVersion);
        editor.apply();
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
        return result;
    }
}
