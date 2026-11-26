package com.healthmate.ai.sync;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import org.json.JSONArray;
import org.json.JSONObject;

final class SnapshotMerge {
    private static final String WORKOUT_SESSION = "workout_session";
    private static final String WORKOUT_EXERCISE = "workout_exercise";
    private static final String TOTAL_VOLUME = "total_volume";

    private SnapshotMerge() {}

    static JSONObject merge(WorkspaceSchema schema, JSONObject base, JSONObject local, JSONObject server) throws Exception {
        JSONObject tables = new JSONObject();
        for (WorkspaceSchema.Table table : schema.tables) {
            Map<String, JSONObject> before = rows(base, table);
            Map<String, JSONObject> here = rows(local, table);
            Map<String, JSONObject> there = rows(server, table);
            Set<String> keys = new LinkedHashSet<>(there.keySet());
            keys.addAll(here.keySet());
            keys.addAll(before.keySet());
            JSONArray result = new JSONArray();
            for (String key : keys) {
                JSONObject old = before.get(key);
                JSONObject localRow = here.get(key);
                JSONObject serverRow = there.get(key);
                JSONObject chosen;
                if (same(table, old, localRow)) chosen = serverRow;
                else if (same(table, old, serverRow) || same(table, localRow, serverRow)) chosen = localRow;
                else throw new Conflict();
                if (chosen != null) {
                    if (hasWorkoutTotal(table)) chosen = new JSONObject(chosen, table.columns().toArray(new String[0]));
                    result.put(chosen);
                }
            }
            tables.put(table.name(), result);
        }
        updateWorkoutTotals(tables);
        return new JSONObject().put("schemaVersion", schema.version).put("tables", tables);
    }

    private static void updateWorkoutTotals(JSONObject tables) throws Exception {
        Map<String, Double> exerciseTotals = new HashMap<>();
        JSONArray sets = tables.getJSONArray("workout_set");
        for (int index = 0; index < sets.length(); index++) {
            JSONObject set = sets.getJSONObject(index);
            if ("logged".equals(set.getString("status")) && set.isNull("duration_seconds") &&
                set.getInt("legacy_unit_unknown") == 0) {
                double volume = set.getDouble("weight_kg") * set.getDouble("reps");
                exerciseTotals.merge(set.getString("workout_exercise_id"), volume, Double::sum);
            }
        }
        Map<String, Double> sessionTotals = new HashMap<>();
        JSONArray exercises = tables.getJSONArray(WORKOUT_EXERCISE);
        for (int index = 0; index < exercises.length(); index++) {
            JSONObject exercise = exercises.getJSONObject(index);
            double volume = exerciseTotals.getOrDefault(exercise.getString("id"), 0.0);
            exercise.put(TOTAL_VOLUME, volume);
            sessionTotals.merge(exercise.getString("workout_session_id"), volume, Double::sum);
        }
        JSONArray sessions = tables.getJSONArray(WORKOUT_SESSION);
        for (int index = 0; index < sessions.length(); index++) {
            JSONObject session = sessions.getJSONObject(index);
            session.put(TOTAL_VOLUME, sessionTotals.getOrDefault(session.getString("id"), 0.0));
        }
    }

    private static Map<String, JSONObject> rows(JSONObject snapshot, WorkspaceSchema.Table table) throws Exception {
        Map<String, JSONObject> result = new LinkedHashMap<>();
        JSONArray rows = snapshot.getJSONObject("tables").getJSONArray(table.name());
        for (int index = 0; index < rows.length(); index++) {
            JSONObject row = rows.getJSONObject(index);
            result.put(row.getString(table.key()), row);
        }
        return result;
    }

    private static boolean same(WorkspaceSchema.Table table, JSONObject left, JSONObject right) {
        if (left == null || right == null) return left == right;
        for (String column : table.columns()) {
            if (TOTAL_VOLUME.equals(column) && hasWorkoutTotal(table)) continue;
            Object a = left.opt(column);
            Object b = right.opt(column);
            if (a instanceof Number && b instanceof Number) {
                if (((Number) a).doubleValue() != ((Number) b).doubleValue()) return false;
            } else if (!java.util.Objects.equals(a, b)) return false;
        }
        return true;
    }

    private static boolean hasWorkoutTotal(WorkspaceSchema.Table table) {
        return WORKOUT_SESSION.equals(table.name()) || WORKOUT_EXERCISE.equals(table.name());
    }

    static final class Conflict extends Exception {}
}
