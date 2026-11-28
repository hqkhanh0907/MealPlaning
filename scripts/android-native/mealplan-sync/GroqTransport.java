package com.healthmate.ai.sync;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.SocketTimeoutException;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.JSONException;
import org.json.JSONObject;

final class GroqTransport {
    static final String MODEL = "qwen/qwen3.8-27b";
    static final int MAX_KEY_LENGTH = 512;
    private static final URI ENDPOINT = URI.create("https://api.groq.com/openai/v1/chat/completions");
    private static final int MAX_REQUEST_BYTES = 8 * 1024 * 1024;
    private static final int MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
    private static final int MAX_TIMEOUT_MS = 60000;
    private static final ScheduledThreadPoolExecutor DEADLINES = new ScheduledThreadPoolExecutor(2, task -> {
        Thread thread = new Thread(task, "mealplan-groq-timeouts");
        thread.setDaemon(true);
        return thread;
    });
    static { DEADLINES.setRemoveOnCancelPolicy(true); }

    interface Connections {
        HttpURLConnection open(URL url) throws IOException;
    }

    record Request(byte[] body, int timeoutMs) {}
    record Response(int status, String content) {}

    static final class Failure extends Exception {
        final String code;
        Failure(String code) { super(code); this.code = code; }
    }

    private final Connections connections;

    GroqTransport() { this(url -> (HttpURLConnection) url.openConnection()); }

    GroqTransport(Connections connections) { this.connections = connections; }

    private static native String decodeContentNative(byte[] bytes);

    private static final class NativeDecoder {
        static final boolean AVAILABLE = load();

        private static boolean load() {
            try {
                System.loadLibrary("healthmate_capacitor");
                // Older packaged libraries can load successfully but lack this decoder symbol.
                decodeContentNative(new byte[0]);
                return true;
            } catch (UnsatisfiedLinkError unsupported) {
                return false;
            }
        }
    }

    static boolean usesRustDecoder() { return NativeDecoder.AVAILABLE; }

    static String normalizeKey(String value) throws Failure {
        String key = value == null ? "" : value.trim();
        if (key.isEmpty() || key.length() > MAX_KEY_LENGTH ||
            !key.chars().allMatch(character -> character >= 33 && character <= 126)) {
            throw new Failure("groq_invalid_request");
        }
        return key;
    }

    static Request prepare(JSONObject payload, Integer timeoutMs) throws Failure {
        if (payload == null || !MODEL.equals(payload.optString("model")) ||
            timeoutMs == null || timeoutMs <= 0 || timeoutMs > MAX_TIMEOUT_MS) {
            throw new Failure("groq_invalid_request");
        }
        String encoded = payload.toString();
        if (encoded == null || encoded.length() > MAX_REQUEST_BYTES) throw new Failure("groq_invalid_request");
        byte[] body = encoded.getBytes(StandardCharsets.UTF_8);
        if (body.length > MAX_REQUEST_BYTES) throw new Failure("groq_invalid_request");
        return new Request(body, timeoutMs);
    }

    Response generate(Request request, String key) throws Failure {
        HttpURLConnection connection;
        try {
            connection = connections.open(ENDPOINT.toURL());
        } catch (IOException failed) {
            throw new Failure("groq_unavailable");
        }
        AtomicBoolean timedOut = new AtomicBoolean();
        ScheduledFuture<?> deadline = DEADLINES.schedule(() -> {
            timedOut.set(true);
            connection.disconnect();
        }, request.timeoutMs(), TimeUnit.MILLISECONDS);
        try {
            connection.setConnectTimeout(request.timeoutMs());
            connection.setReadTimeout(request.timeoutMs());
            connection.setInstanceFollowRedirects(false);
            connection.setUseCaches(false);
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("Authorization", "Bearer " + key);
            connection.setDoOutput(true);
            connection.setFixedLengthStreamingMode(request.body().length);
            try (OutputStream output = connection.getOutputStream()) { output.write(request.body()); }
            int status = connection.getResponseCode();
            if (timedOut.get()) throw new Failure("groq_timeout");
            if (status < 100 || status > 599) throw new Failure("groq_unavailable");
            if (status != 200) return new Response(status, null);
            String content = readContent(connection.getInputStream());
            if (timedOut.get()) throw new Failure("groq_timeout");
            return new Response(status, content);
        } catch (SocketTimeoutException timeout) {
            throw new Failure("groq_timeout");
        } catch (IOException network) {
            throw new Failure(timedOut.get() ? "groq_timeout" : "groq_unavailable");
        } finally {
            deadline.cancel(false);
            connection.disconnect();
        }
    }

    private static String readContent(InputStream stream) throws IOException, Failure {
        if (stream == null) throw new Failure("groq_invalid_response");
        try (InputStream input = stream; ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = input.read(buffer)) != -1) {
                if (output.size() + read > MAX_RESPONSE_BYTES) throw new Failure("groq_invalid_response");
                output.write(buffer, 0, read);
            }
            byte[] bytes = output.toByteArray();
            if (usesRustDecoder()) {
                String content = decodeContentNative(bytes);
                if (content == null) throw new Failure("groq_invalid_response");
                return content;
            }
            JSONObject result = new JSONObject(new String(bytes, StandardCharsets.UTF_8));
            Object content = result.getJSONArray("choices").getJSONObject(0).getJSONObject("message").get("content");
            if (content instanceof String text && !text.trim().isEmpty()) return text;
            throw new Failure("groq_invalid_response");
        } catch (JSONException malformed) {
            throw new Failure("groq_invalid_response");
        }
    }
}
