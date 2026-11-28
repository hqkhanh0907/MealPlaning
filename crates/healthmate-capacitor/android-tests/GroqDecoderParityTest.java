package com.healthmate.ai.sync;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;
import static org.junit.Assume.assumeTrue;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Test;

public final class GroqDecoderParityTest {
    private static String reference(byte[] body) {
        try {
            JSONObject doc = new JSONObject(new String(body, StandardCharsets.UTF_8));
            Object content = doc.getJSONArray("choices").getJSONObject(0)
                .getJSONObject("message").get("content");
            return content instanceof String text && !text.trim().isEmpty() ? text : null;
        } catch (JSONException malformed) {
            return null;
        }
    }

    private static class Reply extends HttpURLConnection {
        final int status;
        final byte[] bytes;
        boolean read;
        boolean closed;

        Reply(int status, byte[] bytes) throws Exception {
            super(URI.create("https://example.invalid/fixture").toURL());
            this.status = status;
            this.bytes = bytes;
        }
        @Override public void connect() {}
        @Override public void disconnect() { closed = true; }
        @Override public boolean usingProxy() { return false; }
        @Override public int getResponseCode() { return status; }
        @Override public OutputStream getOutputStream() { return OutputStream.nullOutputStream(); }
        @Override public InputStream getInputStream() {
            read = true;
            return bytes == null ? null : new ByteArrayInputStream(bytes);
        }
    }

    private static String normal(Reply reply) throws Exception {
        GroqTransport.Response response = new GroqTransport(url -> reply).generate(
            new GroqTransport.Request(utf8("{}"), 5000), "synthetic");
        assertEquals(reply.status, response.status());
        return response.content();
    }

    private static void compare(byte[] bytes) throws Exception {
        String expected = reference(bytes);
        Reply reply = new Reply(200, bytes);
        if (expected == null) {
            assertEquals("groq_invalid_response",
                assertThrows(GroqTransport.Failure.class, () -> normal(reply)).code);
        } else {
            assertArrayEquals(expected.toCharArray(), normal(reply).toCharArray());
        }
        assertTrue(reply.read);
        assertTrue(reply.closed);
    }

    private static byte[] utf8(String value) { return value.getBytes(StandardCharsets.UTF_8); }
    private static String envelope(String token) { return "{\"choices\":[{\"message\":{\"content\":" + token + "}}]}"; }

    @Test public void reportsTheSelectedDecoder() {
        boolean requireNative = "Dalvik".equals(System.getProperty("java.vm.name"))
            || Boolean.getBoolean("healthmate.groq.requireNative");
        assumeTrue(requireNative || Boolean.getBoolean("healthmate.groq.requireLegacy"));
        assertEquals(requireNative, GroqTransport.usesRustDecoder());
    }

    @Test public void comparesContentAndEveryCodeUnitWithAndroidJson() throws Exception {
        for (String token : new String[]{"null","true","0","{}","[]","\"\"","\" \\t\\n\\u0000\"",
            "\"\\u001f\"","\"\\u0020\"","\"\\u0021\"","\"\\u00a0\"","\"\\u2003\"","\"\\ufeff\"",
            "\"  Chào 🥗\\n \"","\"a\\u0000b\"","\"\\ud800\"","\"\\udc00\"","\"\\ud83e\\udd57\""}) {
            compare(utf8(envelope(token)));
        }
        for (String text : new String[]{"","[{}]","{}","{\"choices\":[]}","{\"choices\":[null]}",
            "{\"choices\":{\"0\":{\"message\":{\"content\":\"object instead of array\"}}}}",
            "{\"choices\":[{\"message\":null}]}","{\"choices\":[{\"message\":{}},{\"message\":{\"content\":\"second\"}}]}",
            "{choices:[{message:{content:'phiên bản'}}]}","/* comment */"+envelope("\"ok\""),envelope("\"ok\"")+" trailing",
            "{\"choices\":null,\"choices\":[{\"message\":{\"content\":\"first\",\"content\":\"last\"}}]}",
            "\ufeff"+envelope("\"ok\"")}) compare(utf8(text));
        byte[] prefix=utf8("{\"choices\":[{\"message\":{\"content\":\"");
        for(byte[] bad: new byte[][]{{(byte)0xff},{(byte)0xc2,65},{(byte)0xed,(byte)0xa0,(byte)0x80}}) {
            ByteArrayOutputStream output=new ByteArrayOutputStream();
            output.write(prefix);
            output.write(bad);
            output.write(utf8("\"}}]}"));
            compare(output.toByteArray());
        }
    }

    @Test public void preservesHttpErrorsWithoutOpeningResponseStreams() throws Exception {
        for (int code : new int[]{100, 201, 204, 301, 401, 403, 429, 500, 599}) {
            Reply reply = new Reply(code, null);
            assertNull(normal(reply));
            assertFalse(reply.read);
            assertTrue(reply.closed);
        }
        for (int code : new int[]{-1, 0, 99, 600}) {
            Reply reply = new Reply(code, null);
            assertEquals("groq_unavailable",
                assertThrows(GroqTransport.Failure.class, () -> normal(reply)).code);
            assertFalse(reply.read);
            assertTrue(reply.closed);
        }
    }

    @Test public void enforcesTheRawByteLimitBeforeParsing() throws Exception {
        int limit = 2 * 1024 * 1024;
        byte[] response = utf8(envelope("\"Cơm\""));
        byte[] bytes = Arrays.copyOf(response, limit);
        Arrays.fill(bytes, response.length, limit, (byte)' ');
        assertEquals("Cơm", normal(new Reply(200, bytes)));
        Reply tooLarge = new Reply(200, Arrays.copyOf(bytes, limit + 1));
        assertEquals("groq_invalid_response",
            assertThrows(GroqTransport.Failure.class, () -> normal(tooLarge)).code);
        assertEquals("groq_invalid_response",
            assertThrows(GroqTransport.Failure.class, () -> normal(new Reply(200, null))).code);
    }

    @Test public void preservesNetworkErrorsBeforeAndDuringAResponse() throws Exception {
        GroqTransport unavailable = new GroqTransport(url -> { throw new IOException("synthetic"); });
        GroqTransport.Request request = new GroqTransport.Request(utf8("{}"), 5000);
        assertEquals("groq_unavailable", assertThrows(GroqTransport.Failure.class,
            () -> unavailable.generate(request, "synthetic")).code);
        Reply interrupted = new Reply(200, null) {
            @Override public InputStream getInputStream() {
                return new InputStream() {
                    @Override public int read() throws IOException { throw new IOException("synthetic"); }
                };
            }
        };
        assertEquals("groq_unavailable", assertThrows(GroqTransport.Failure.class,
            () -> normal(interrupted)).code);
        assertTrue(interrupted.closed);
    }

    @Test public void decodesRepliesWithoutGrantingAccessAfterTheVaultChanges() throws Exception {
        SessionVault.Session expected = session("owner-a", "g1", "key1");
        for (SessionVault.Session next : new SessionVault.Session[]{
            session("owner-b", "g1", "key1"), session("owner-a", "g2", "key1"),
            session("owner-a", "g1", "key2"), null,
        }) {
            var current = new AtomicReference<>(expected);
            Reply reply = new Reply(200, utf8(envelope("\"fixture\""))) {
                @Override public InputStream getInputStream() {
                    current.set(next);
                    return super.getInputStream();
                }
            };
            assertEquals("fixture", normal(reply));
            assertFalse(SessionVault.sameGroq(expected, current.get()));
        }
    }

    private static SessionVault.Session session(String owner, String generation, String revision) throws JSONException {
        return new SessionVault.Session(new JSONObject().put("ownerId", owner)
            .put("generation", generation).put("groqRevision", revision));
    }
}
