package com.healthmate.ai.sync;

import static org.junit.Assert.*;
import java.io.*;
import java.net.CookieHandler;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.FutureTask;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import okhttp3.HttpUrl;
import org.json.JSONObject;
import org.junit.Test;

public final class AccountAuthHttpTest {
    private record Request(String first, Map<String,String> headers, String body) {}

    private static final class Server implements AutoCloseable {
        final ServerSocket listener;
        final FutureTask<List<Request>> captured;
        final HttpUrl origin;

        Server(String... replies) throws Exception {
            listener = new ServerSocket(0, 4, InetAddress.getByName("127.0.0.1"));
            listener.setSoTimeout(3000);
            origin = HttpUrl.get("http://127.0.0.1:" + listener.getLocalPort());
            captured = new FutureTask<>(() -> {
                List<Request> requests = new ArrayList<>();
                for (String reply : replies) {
                    try (Socket socket = listener.accept()) {
                        socket.setSoTimeout(3000);
                        var in = new BufferedInputStream(socket.getInputStream());
                        String first = line(in);
                        Map<String,String> headers = new HashMap<>();
                        for (String h = line(in); !h.isEmpty(); h = line(in)) {
                            String[] pair = h.split(":", 2);
                            headers.put(pair[0].toLowerCase(Locale.ROOT), pair[1].trim());
                        }
                        int count = Integer.parseInt(headers.getOrDefault("content-length","0"));
                        requests.add(new Request(first, headers, new String(in.readNBytes(count),StandardCharsets.UTF_8)));
                        socket.getOutputStream().write(reply.getBytes(StandardCharsets.US_ASCII));
                    }
                }
                return requests;
            });
            Thread thread = new Thread(captured,"fixture-account-http");
            thread.setDaemon(true);
            thread.start();
        }
        @Override public void close() throws IOException {listener.close();}
    }

    private static String line(InputStream in) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        for(int value; (value = in.read()) != '\n';) {
            if (value == -1) throw new EOFException();
            if (value != '\r') bytes.write(value);
        }
        return bytes.toString(StandardCharsets.US_ASCII);
    }

    private static String response(String status,String headers) {
        return "HTTP/1.1 "+status+"\r\n"+headers+"Content-Length: 2\r\nConnection: close\r\n\r\n{}";
    }

    @Test public void ignoresTheProcessCookieHandlerInBothDirectionsAndPreservesSameOriginPostRedirects() throws Exception {
        CookieHandler before = CookieHandler.getDefault();
        AtomicInteger touched = new AtomicInteger();
        CookieHandler.setDefault(new CookieHandler() {
            @Override public Map<String,List<String>> get(URI uri, Map<String,List<String>> h) {
                touched.incrementAndGet(); return Map.of("Cookie",List.of("account-test=secret-fixture"));
            }
            @Override public void put(URI uri,Map<String,List<String>> headers) {touched.incrementAndGet();}
        });
        try(Server server = new Server(response("307 Temporary Redirect","Location: /session-target\r\nSet-Cookie: fixture=response\r\n"),response("200 OK",""))) {
            String body = "{\"name\":\"Bình\"}";
            Object[] reply = new AccountHttp("",server.origin).apply("/api/mealplan/session",body);
            assertEquals(200,reply[0]);
            List<Request> seen = server.captured.get(4,TimeUnit.SECONDS);
            assertEquals("POST /api/mealplan/session HTTP/1.1",seen.get(0).first());
            assertEquals("POST /session-target HTTP/1.1",seen.get(1).first());
            for(Request req:seen){
                assertEquals(body,req.body());
                assertFalse(req.headers().containsKey("cookie"));
                assertFalse(req.headers().containsKey("authorization"));
            }
            assertEquals(0,touched.get());
        } finally {CookieHandler.setDefault(before);}
    }

    @Test public void sendsOnlyTheNativeAccessGrantForRenameAndNeverFollowsACrossOriginRedirect() throws Exception {
        try(Server server = new Server(response("303 See Other","Location: /profile-result\r\n"),response("403 Forbidden",""))) {
            Object[] reply = new AccountHttp("native-fixture",server.origin).apply("/api/mealplan/profile","{}");
            assertEquals(403,reply[0]);
            List<Request> seen=server.captured.get(4,TimeUnit.SECONDS);
            assertEquals("native-fixture",seen.get(0).headers().get("authorization"));
            assertEquals("GET /profile-result HTTP/1.1",seen.get(1).first());
            assertEquals("",seen.get(1).body());
        }
        try(Server server = new Server(response("307 Temporary Redirect","Location: https://other.invalid/\r\n"))) {
            assertEquals(0,new AccountHttp("",server.origin).apply("/api/mealplan/session","{}")[0]);
            assertEquals(1,server.captured.get(4,TimeUnit.SECONDS).size());
        }
        try(Server server = new Server(response("503 Unavailable","Retry-After: 0\r\n"))) {
            assertEquals(503,new AccountHttp("",server.origin).apply("/api/collections/users/records","{}")[0]);
            assertEquals(1,server.captured.get(4,TimeUnit.SECONDS).size());
        }
    }

    @Test public void publishesOnlyIdentityAndGenerationToTheWebview() throws Exception {
        SessionVault.Session saved = new SessionVault.Session(new JSONObject()
            .put("ownerId","aaaaaaaaaaaaaaa").put("username","an").put("fullName","An").put("generation","gen")
            .put("accessToken","private-access-fixture").put("sessionToken","private-refresh-fixture").put("groqKey","private-groq-fixture"));
        JSONObject result=MealPlanAccountPlugin.publicSession(saved);
        assertEquals(2,result.length());
        assertEquals(3,result.getJSONObject("identity").length());
        assertEquals("An",result.getJSONObject("identity").getString("name"));
        assertFalse(result.toString().contains("private-"));
    }
}
