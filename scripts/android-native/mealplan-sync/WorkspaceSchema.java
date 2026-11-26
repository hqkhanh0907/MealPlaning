package com.healthmate.ai.sync;

import android.content.Context;
import android.content.res.AssetManager;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import org.json.JSONObject;

final class WorkspaceSchema {
    record Table(String name, String key, List<String> columns) {}

    final int version;
    final List<Table> tables;

    WorkspaceSchema(Context context) throws Exception {
        this(read(context.getAssets()));
    }

    WorkspaceSchema(JSONObject source) throws Exception {
        version = source.getInt("schemaVersion");
        tables = new ArrayList<>();
        JSONObject definitions = source.getJSONObject("tables");
        for (Iterator<String> names = definitions.keys(); names.hasNext();) {
            String name = names.next();
            JSONObject table = definitions.getJSONObject(name);
            List<String> columns = new ArrayList<>();
            for (Iterator<String> namesOfColumns = table.getJSONObject("cols").keys(); namesOfColumns.hasNext();) {
                columns.add(namesOfColumns.next());
            }
            tables.add(new Table(name, table.getString("key"), columns));
        }
    }

    private static JSONObject read(AssetManager assets) throws Exception {
        try (InputStream input = assets.open("mealplan-sync-schema.json")) {
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] block = new byte[8192];
            int count;
            while ((count = input.read(block)) >= 0) buffer.write(block, 0, count);
            return new JSONObject(new String(buffer.toByteArray(), StandardCharsets.UTF_8));
        }
    }
}
