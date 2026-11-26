package com.healthmate.ai.sync;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.SocketTimeoutException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;

public final class GroqTransportTest {
    private static final String FIXTURE_KEY = "fake-text-fixture-key";

    @Test
    public void trimsKeyAndRejectsWhitespaceNonAsciiAndOversizedKeys() throws Exception {
        assertEquals(FIXTURE_KEY, GroqTransport.normalizeKey("  " + FIXTURE_KEY + "\n"));
        for (String invalid : new String[]{null, "", "some key", "bad\nheader", "tạ", "a".repeat(513)}) {
            GroqTransport.Failure error = assertThrows(GroqTransport.Failure.class,
                () -> GroqTransport.normalizeKey(invalid));
            assertEquals("groq_invalid_request", error.code);
        }
    }

    @Test
    public void validatesOnlyTheModelAndBoundsRequiredForTheBridge() throws Exception {
        JSONObject payload = payload();
        assertEquals(payload.toString(), new String(GroqTransport.prepare(payload, 60000).body(), StandardCharsets.UTF_8));
        assertEquals("groq_invalid_request", assertThrows(GroqTransport.Failure.class,
            () -> GroqTransport.prepare(new JSONObject().put("model", "other"), 5000)).code);
        assertThrows(GroqTransport.Failure.class, () -> GroqTransport.prepare(payload, 0));
        assertThrows(GroqTransport.Failure.class, () -> GroqTransport.prepare(payload, 60001));
        assertThrows(GroqTransport.Failure.class,
            () -> GroqTransport.prepare(payload.put("padding", "a".repeat(8 * 1024 * 1024)), 5000));
    }

    @Test
    public void sendsTheSharedPayloadOnlyToTheExpectedHttpsEndpoint() throws Exception {
        FakeConnection connection = new FakeConnection(200, "{\"choices\":[{\"message\":{\"content\":\"{}\"}}]}");
        GroqTransport client = new GroqTransport(url -> {
            assertEquals("https://api.groq.com/openai/v1/chat/completions", url.toString());
            return connection;
        });
        JSONObject payload = payload();
        GroqTransport.Response result = client.generate(GroqTransport.prepare(payload, 5000), FIXTURE_KEY);
        assertEquals(new GroqTransport.Response(200, "{}"), result);
        assertEquals(payload.toString(), connection.body.toString(StandardCharsets.UTF_8));
        assertEquals("POST", connection.getRequestMethod());
        assertEquals("Bearer " + FIXTURE_KEY, connection.getRequestProperty("Authorization"));
        assertFalse(connection.getInstanceFollowRedirects());
        assertTrue(connection.disconnected);
    }

    @Test
    public void returnsOnlyStatusForHttpFailureAndRedirect() throws Exception {
        for (int status : new int[]{302, 401, 429, 503}) {
            FakeConnection connection = new FakeConnection(status, "private response text");
            GroqTransport.Response result = new GroqTransport(url -> connection).generate(
                GroqTransport.prepare(payload(), 5000), FIXTURE_KEY);
            assertEquals(status, result.status());
            assertNull(result.content());
            assertFalse(connection.readBody);
            assertTrue(connection.disconnected);
        }
    }

    @Test
    public void rejectsMalformedSuccessfulResponsesWithoutExposingTheirContent() throws Exception {
        for (String body : new String[]{"provider text", "{\"choices\":[]}", "a".repeat(2 * 1024 * 1024 + 1)}) {
            FakeConnection connection = new FakeConnection(200, body);
            GroqTransport client = new GroqTransport(url -> connection);
            GroqTransport.Failure error = assertThrows(GroqTransport.Failure.class,
                () -> client.generate(GroqTransport.prepare(payload(), 5000), FIXTURE_KEY));
            assertEquals("groq_invalid_response", error.getMessage());
        }
    }

    @Test
    public void mapsTimeoutWithoutExposingExceptionDetails() throws Exception {
        FakeConnection connection = new FakeConnection(200, "{}") {
            @Override public int getResponseCode() throws SocketTimeoutException {
                throw new SocketTimeoutException("fixture exception details");
            }
        };
        GroqTransport client = new GroqTransport(url -> connection);
        GroqTransport.Failure error = assertThrows(GroqTransport.Failure.class,
            () -> client.generate(GroqTransport.prepare(payload(), 5000), FIXTURE_KEY));
        assertEquals("groq_timeout", error.getMessage());
        assertTrue(connection.disconnected);
    }

    @Test
    public void disconnectsAnUnfinishedRequestAtItsDeadline() throws Exception {
        CountDownLatch disconnectSignal = new CountDownLatch(1);
        FakeConnection connection = new FakeConnection(200, "{}") {
            @Override public int getResponseCode() {
                try { assertTrue(disconnectSignal.await(3, TimeUnit.SECONDS)); }
                catch (InterruptedException interrupted) { throw new AssertionError(interrupted); }
                return 200;
            }
            @Override public void disconnect() { disconnectSignal.countDown(); }
        };
        GroqTransport client = new GroqTransport(url -> connection);
        GroqTransport.Failure error = assertThrows(GroqTransport.Failure.class,
            () -> client.generate(GroqTransport.prepare(payload(), 25), FIXTURE_KEY));
        assertEquals("groq_timeout", error.code);
    }

    private static JSONObject payload() throws Exception {
        return new JSONObject().put("model", GroqTransport.MODEL).put("messages",
            new JSONArray().put(new JSONObject().put("role", "user").put("content", "Fixture")));
    }

    private static class FakeConnection extends HttpURLConnection {
        final ByteArrayOutputStream body = new ByteArrayOutputStream();
        final int status;
        final String response;
        boolean disconnected;
        boolean readBody;

        FakeConnection(int status, String response) throws Exception {
            super(URI.create("https://api.groq.com").toURL());
            this.status = status;
            this.response = response;
        }

        @Override public void connect() {}
        @Override public boolean usingProxy() { return false; }
        @Override public void disconnect() { disconnected = true; }
        @Override public int getResponseCode() throws SocketTimeoutException { return status; }
        @Override public OutputStream getOutputStream() { return body; }
        @Override public InputStream getInputStream() {
            readBody = true;
            return new ByteArrayInputStream(response.getBytes(StandardCharsets.UTF_8));
        }
    }
}
