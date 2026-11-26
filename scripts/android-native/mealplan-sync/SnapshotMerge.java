package com.healthmate.ai.sync;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import org.json.JSONArray;
import org.json.JSONObject;

final class SnapshotMerge {
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
                if (chosen != null) result.put(chosen);
            }
            tables.put(table.name(), result);
        }
        return new JSONObject().put("schemaVersion", schema.version).put("tables", tables);
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
            Object a = left.opt(column);
            Object b = right.opt(column);
            if (a instanceof Number && b instanceof Number) {
                if (((Number) a).doubleValue() != ((Number) b).doubleValue()) return false;
            } else if (!java.util.Objects.equals(a, b)) return false;
        }
        return true;
    }

    static final class Conflict extends Exception {}
}
