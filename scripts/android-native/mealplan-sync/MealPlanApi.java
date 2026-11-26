package com.healthmate.ai.sync;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

final class MealPlanApi {
    static final String WORKSPACE = "/api/mealplan/workspace";
    static final String SESSION = "/api/mealplan/session";
    static final String LOGOUT = "/api/mealplan/logout";
    private final String origin;

    MealPlanApi(String origin) { this.origin = origin; }

    JSONObject request(String path, String token, JSONObject payload) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(origin + path).openConnection();
        connection.setConnectTimeout(12000);
        connection.setReadTimeout(12000);
        connection.setInstanceFollowRedirects(false);
        connection.setUseCaches(false);
        connection.setRequestProperty("Accept", "application/json");
        if (!token.isEmpty()) connection.setRequestProperty("Authorization", token);
        try {
            if (payload != null) {
                byte[] body = payload.toString().getBytes(StandardCharsets.UTF_8);
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setDoOutput(true);
                connection.setFixedLengthStreamingMode(body.length);
                try (OutputStream output = connection.getOutputStream()) { output.write(body); }
            }
            int status = connection.getResponseCode();
            boolean success = status >= 200 && status < 300;
            String content = read(success ? connection.getInputStream() : connection.getErrorStream());
            if (success) return content.isEmpty() ? new JSONObject() : new JSONObject(content);
            String code = "";
            try {
                JSONObject fields = new JSONObject(content).optJSONObject("data");
                if (fields != null) code = fields.optString("code");
            } catch (Exception malformed) { /* HTTP status remains authoritative. */ }
            throw new ResponseError(status, code);
        } finally { connection.disconnect(); }
    }

    private String read(InputStream input) throws IOException {
        if (input == null) return "";
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8))) {
            StringBuilder result = new StringBuilder();
            char[] buffer = new char[8192];
            int count;
            while ((count = reader.read(buffer)) >= 0) {
                result.append(buffer, 0, count);
                if (result.length() > 16 * 1024 * 1024) throw new IOException("Workspace response exceeded limit");
            }
            return result.toString();
        }
    }

    static final class ResponseError extends IOException {
        final int status;
        final String code;

        ResponseError(int status, String code) {
            super("Workspace request failed with status " + status);
            this.status = status;
            this.code = code;
        }
    }
}
