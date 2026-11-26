package com.healthmate.ai.sync;

import android.content.Context;
import android.database.Cursor;
import android.text.TextUtils;
import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import net.zetetic.database.sqlcipher.SQLiteDatabase;
import org.json.JSONArray;
import org.json.JSONObject;

final class WorkspaceStore implements AutoCloseable {
    record Pending(JSONObject request, long version) {
        String id() throws Exception { return request.getString("operationId"); }
    }
    record State(long revision, long change, long clean, Pending pending) {
        boolean dirty() { return change != clean || pending != null; }
    }

    private final SQLiteDatabase database;
    private final WorkspaceSchema schema;

    WorkspaceStore(Context context, SessionVault.Session session) throws Exception {
        schema = new WorkspaceSchema(context);
        File file = context.getDatabasePath(session.dbName + "SQLite.db");
        if (!file.isFile()) throw new NotReady();
        System.loadLibrary("sqlcipher");
        database = SQLiteDatabase.openDatabase(file.getPath(), "", null,
            SQLiteDatabase.OPEN_READWRITE, null);
        try {
            if (database.getVersion() != schema.version) throw new NotReady();
            database.setForeignKeyConstraintsEnabled(true);
            try (Cursor cursor = database.rawQuery("SELECT count(*) FROM sqlite_master WHERE name = 'sync_workspace' AND type = 'table'", (String[]) null)) {
                if (!cursor.moveToFirst() || cursor.getInt(0) == 0) throw new NotReady();
            }
        } catch (Exception error) {
            database.close();
            throw error;
        }
    }

    State state() throws Exception {
        try (Cursor cursor = database.rawQuery(
            "SELECT revision, change_version, clean_version, pending, pending_version FROM sync_workspace WHERE id = 1",
            (String[]) null)) {
            if (!cursor.moveToFirst()) throw new NotReady();
            Pending pending = cursor.isNull(3) ? null : new Pending(new JSONObject(cursor.getString(3)), cursor.getLong(4));
            return new State(cursor.getLong(0), cursor.getLong(1), cursor.getLong(2), pending);
        }
    }

    Pending prepare() throws Exception {
        return transaction(() -> {
            State current = state();
            if (current.pending() != null || !current.dirty()) return current.pending();
            JSONObject request = new JSONObject().put("operationId", UUID.randomUUID().toString())
                .put("baseRevision", current.revision()).put("snapshot", snapshot()).put("mergeIndependent", true);
            database.execSQL("UPDATE sync_workspace SET pending = ?, pending_version = ? WHERE id = 1",
                new Object[]{request.toString(), current.change()});
            return new Pending(request, current.change());
        });
    }

    void prepareResolution(String operationId, long revision, JSONObject choices) throws Exception {
        transaction(() -> {
            State current = state();
            Pending pending = current.pending();
            if (pending == null || !operationId.equals(pending.id())) return null;
            JSONObject request = new JSONObject(pending.request().toString());
            request.put("operationId", UUID.randomUUID().toString());
            request.remove("resolution");
            if (pending.version() == current.change()) {
                request.put("resolution", new JSONObject().put("revision", revision).put("choices", choices));
            } else {
                request.put("snapshot", snapshot());
            }
            database.execSQL("UPDATE sync_workspace SET pending = ?, pending_version = ? WHERE id = 1",
                new Object[]{request.toString(), current.change()});
            return null;
        });
    }

    void acknowledge(Pending pending, long revision, JSONObject remote) throws Exception {
        transaction(() -> {
            State current = state();
            if (current.pending() == null || !pending.id().equals(current.pending().id())) throw new Changed();
            if (remote == null) {
                update(revision, pending.version());
            } else if (pending.version() == current.change()) {
                replace(remote);
                markClean(revision);
            } else {
                JSONObject merged = SnapshotMerge.merge(schema, pending.request().getJSONObject("snapshot"), snapshot(), remote);
                replace(merged);
                update(revision, pending.version());
            }
            return null;
        });
    }

    void adopt(JSONObject snapshot, long revision, State expected, boolean overwrite) throws Exception {
        transaction(() -> {
            State current = state();
            if (current.change() != expected.change() || current.revision() != expected.revision() ||
                (!overwrite && current.dirty())) throw new Changed();
            replace(snapshot);
            markClean(revision);
            return null;
        });
    }

    void keepLocal(long revision, State expected) throws Exception {
        transaction(() -> {
            State current = state();
            if (current.change() != expected.change() || current.revision() != expected.revision()) throw new Changed();
            database.execSQL("UPDATE sync_workspace SET revision = ?, pending = NULL, pending_version = NULL WHERE id = 1", new Object[]{revision});
            return null;
        });
    }

    private void update(long revision, long clean) {
        database.execSQL("UPDATE sync_workspace SET revision = ?, clean_version = ?, pending = NULL, pending_version = NULL WHERE id = 1",
            new Object[]{revision, clean});
    }

    private void markClean(long revision) {
        database.execSQL("UPDATE sync_workspace SET revision = ?, clean_version = change_version, pending = NULL, pending_version = NULL WHERE id = 1",
            new Object[]{revision});
    }

    private JSONObject snapshot() throws Exception {
        JSONObject tables = new JSONObject();
        for (WorkspaceSchema.Table table : schema.tables) {
            JSONArray rows = new JSONArray();
            try (Cursor cursor = database.rawQuery("SELECT " + columns(table) + " FROM " + quote(table.name()) + " ORDER BY " + quote(table.key()),
                (String[]) null)) {
                while (cursor.moveToNext()) {
                    JSONObject row = new JSONObject();
                    for (int index = 0; index < table.columns().size(); index++) {
                        Object value = switch (cursor.getType(index)) {
                            case Cursor.FIELD_TYPE_NULL -> JSONObject.NULL;
                            case Cursor.FIELD_TYPE_INTEGER -> cursor.getLong(index);
                            case Cursor.FIELD_TYPE_FLOAT -> cursor.getDouble(index);
                            case Cursor.FIELD_TYPE_STRING -> cursor.getString(index);
                            default -> throw new IllegalStateException("Unsupported workspace column type");
                        };
                        row.put(table.columns().get(index), value);
                    }
                    rows.put(row);
                }
            }
            tables.put(table.name(), rows);
        }
        return new JSONObject().put("schemaVersion", schema.version).put("tables", tables);
    }

    private void replace(JSONObject snapshot) throws Exception {
        if (snapshot.getInt("schemaVersion") != schema.version) throw new Incompatible();
        JSONObject tables = snapshot.getJSONObject("tables");
        for (int index = schema.tables.size() - 1; index >= 0; index--) {
            database.execSQL("DELETE FROM " + quote(schema.tables.get(index).name()));
        }
        for (WorkspaceSchema.Table table : schema.tables) {
            JSONArray rows = tables.getJSONArray(table.name());
            List<String> placeholders = new ArrayList<>();
            for (String ignored : table.columns()) placeholders.add("?");
            String statement = "INSERT INTO " + quote(table.name()) + " (" + columns(table) + ") VALUES (" + TextUtils.join(", ", placeholders) + ")";
            for (int index = 0; index < rows.length(); index++) {
                JSONObject row = rows.getJSONObject(index);
                Object[] values = new Object[table.columns().size()];
                for (int column = 0; column < values.length; column++) {
                    Object value = row.get(table.columns().get(column));
                    if (value != JSONObject.NULL) values[column] = value;
                }
                database.execSQL(statement, values);
            }
        }
    }

    private String columns(WorkspaceSchema.Table table) {
        List<String> names = new ArrayList<>();
        for (String column : table.columns()) names.add(quote(column));
        return TextUtils.join(", ", names);
    }

    private String quote(String value) { return '"' + value.replace("\"", "\"\"") + '"'; }

    private <T> T transaction(SessionVault.Checked<T> action) throws Exception {
        database.beginTransactionNonExclusive();
        try {
            T result = action.run();
            database.setTransactionSuccessful();
            return result;
        } finally { database.endTransaction(); }
    }

    @Override public void close() { database.close(); }

    static final class NotReady extends Exception {}
    static final class Changed extends Exception {}
    static final class Incompatible extends Exception {}
}
