package com.healthmate.ai.sync;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Before;
import org.junit.Test;

public final class SnapshotMergeTest {
    private WorkspaceSchema schema;
    private JSONObject base;
    private JSONObject server;

    @Before
    public void loadWorkspaceSchema() throws Exception {
        try (InputStream input = getClass().getResourceAsStream("/mealplan-sync-schema.json")) {
            assertNotNull("Workspace schema resource", input);
            schema = new WorkspaceSchema(new JSONObject(new String(input.readAllBytes(), StandardCharsets.UTF_8)));
        }
        base = snapshot(6, 5);
        server = snapshot(6, 7);
    }

    @Test
    public void computesVolumeWhenIndependentEditsHaveEqualTotals() throws Exception {
        assertMerged(snapshot(8, 5), 8, 600);
    }

    @Test
    public void computesVolumeWhenIndependentEditsHaveDifferentTotals() throws Exception {
        assertMerged(snapshot(9, 5), 9, 640);
    }

    @Test
    public void mergesPendingPreviousVersionWithMigratedVenueSettings() throws Exception {
        base.put("schemaVersion", 12);
        base.getJSONObject("tables").remove("workout_preference");
        JSONObject local = snapshot(6, 5);
        local.getJSONObject("tables").getJSONArray("workout_preference").put(new JSONObject()
            .put("key", "fitness_default_place").put("value", "gym").put("updated_at", "2026-11-27"));
        JSONObject merged = SnapshotMerge.merge(schema, base, local, server);
        assertEquals("preserved venue", "gym", merged.getJSONObject("tables").getJSONArray("workout_preference")
            .getJSONObject(0).getString("value"));
    }

    @Test(expected = SnapshotMerge.Conflict.class)
    public void rejectsOverlappingSetChanges() throws Exception {
        SnapshotMerge.merge(schema, base, snapshot(6, 8), server);
    }

    private void assertMerged(JSONObject local, int firstReps, double total) throws Exception {
        double originalLocalTotal = total(local, "workout_exercise");
        double originalServerTotal = total(server, "workout_session");
        JSONObject merged = SnapshotMerge.merge(schema, base, local, server);
        JSONArray sets = merged.getJSONObject("tables").getJSONArray("workout_set");
        assertEquals("local set", firstReps, sets.getJSONObject(0).getInt("reps"));
        assertEquals("remote set", 7, sets.getJSONObject(1).getInt("reps"));
        assertEquals("timed set duration", 30, sets.getJSONObject(2).getInt("duration_seconds"));
        assertEquals("legacy set value", 21, sets.getJSONObject(3).getInt("reps"));
        assertEquals("merged exercise volume", total, total(merged, "workout_exercise"), 0.0);
        assertEquals("merged session volume", total, total(merged, "workout_session"), 0.0);
        assertEquals("local input", originalLocalTotal, total(local, "workout_exercise"), 0.0);
        assertEquals("server input", originalServerTotal, total(server, "workout_session"), 0.0);
    }

    private JSONObject snapshot(int first, int second) throws Exception {
        JSONObject tables = new JSONObject();
        for (WorkspaceSchema.Table table : schema.tables) {
            tables.put(table.name(), new JSONArray());
        }
        double pendingVolume = 40.0 * (first + second);
        tables.getJSONArray("workout_session").put(new JSONObject().put("id", "session")
            .put("total_volume", pendingVolume));
        tables.getJSONArray("workout_exercise").put(new JSONObject().put("id", "exercise")
            .put("workout_session_id", "session").put("total_volume", pendingVolume));
        tables.getJSONArray("workout_set")
            .put(set("first", first, "logged", JSONObject.NULL, 0))
            .put(set("second", second, "logged", JSONObject.NULL, 0))
            .put(set("timed", 20, "logged", 30, 0))
            .put(set("unknown", 21, "logged", JSONObject.NULL, 1))
            .put(set("skipped", 22, "skipped", JSONObject.NULL, 0));
        return new JSONObject().put("schemaVersion", schema.version).put("tables", tables);
    }

    private static JSONObject set(String id, int reps, String status, Object duration, int unknown) throws Exception {
        return new JSONObject().put("id", id).put("workout_exercise_id", "exercise")
            .put("weight_kg", 40).put("reps", reps).put("status", status)
            .put("duration_seconds", duration).put("legacy_unit_unknown", unknown);
    }

    private static double total(JSONObject snapshot, String table) throws Exception {
        return snapshot.getJSONObject("tables").getJSONArray(table).getJSONObject(0).getDouble("total_volume");
    }

}
