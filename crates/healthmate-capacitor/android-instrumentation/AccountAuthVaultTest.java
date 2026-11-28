package com.healthmate.ai.sync;

import static org.junit.Assert.*;
import android.content.Context;
import android.content.ContextWrapper;
import android.os.Build;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.*;
import java.net.InetAddress;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.FutureTask;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import javax.net.ssl.SSLServerSocket;
import okhttp3.HttpUrl;
import okhttp3.OkHttpClient;
import okhttp3.tls.HandshakeCertificates;
import okhttp3.tls.HeldCertificate;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public final class AccountAuthVaultTest {
    private static final String OWNER = "aaaaaaaaaaaaaaa";
    private File privateDir;
    private SessionVault vault;

    @Before public void openIsolatedVault() {
        assertTrue("The account JNI must be present in this APK", MealPlanAccountPlugin.available());
        Context app = InstrumentationRegistry.getInstrumentation().getTargetContext();
        privateDir = new File(app.getCacheDir(), "account-proof-" + UUID.randomUUID());
        assertTrue(privateDir.mkdir());
        vault = new SessionVault(new ContextWrapper(app) {
            @Override public File getNoBackupFilesDir() { return privateDir; }
        });
    }

    @After public void removeOnlyTheFixture() throws Exception {
        if (vault != null) vault.clear();
        if (privateDir != null) assertTrue(privateDir.delete());
    }

    private static JSONObject grant(String token) throws Exception {
        return new JSONObject().put("ownerId",OWNER).put("username","an_42").put("name","An Nguyễn")
            .put("accessToken","fixture-access-" + token).put("sessionToken",token).put("accessExpiresAt","2030-01-01T00:00:00Z");
    }

    @Test public void registersOverLocalTlsAndPublishesOnlyTheVerifiedAccount() throws Exception {
        try (LocalTls server = new LocalTls(-1, "{}", grant("fixture-register").toString())) {
            MealPlanAccountPlugin.SignIn result = MealPlanAccountPlugin.authenticateNative(
                vault,vault.beginAuthentication(),"healthmate_dev","  AN_42  ","password-fixture","  An Nguyễn  ",Build.MODEL,server.http);
            assertNull(result.error());assertNull(result.previous());
            SessionVault.Session reopened=vault.read();
            assertEquals(result.current().generation,reopened.generation);
            assertEquals("healthmate_dev_" + OWNER,reopened.dbName);
            assertEquals("fixture-register",reopened.sessionToken);
            JSONObject publicData=MealPlanAccountPlugin.publicSession(reopened);
            assertEquals(3,publicData.getJSONObject("identity").length());
            assertFalse(publicData.toString().contains("fixture-"));
            assertFalse(reopened.publicData().has("accessToken"));
            assertFalse(reopened.publicData(false).has("accessToken"));
            assertFalse(reopened.publicData(!MealPlanAccountPlugin.available()).has("accessToken"));
            JSONObject legacy = reopened.publicData(true);
            assertEquals(reopened.accessToken, legacy.getString("accessToken"));
            assertFalse(legacy.has("sessionToken"));
            assertFalse(legacy.has("groqKey"));
            List<Captured> calls=server.observed.get(10,TimeUnit.SECONDS);
            assertEquals("POST /api/collections/users/records HTTP/1.1",calls.get(0).request());
            assertEquals("An Nguyễn",calls.get(0).data().getString("name"));
            assertEquals("an_42",calls.get(0).data().getString("username"));
            assertEquals("POST /api/mealplan/session HTTP/1.1",calls.get(1).request());
            assertEquals(Build.MODEL,calls.get(1).data().getString("deviceLabel"));
        }
    }

    @Test public void schedulerFailureRetriesTheCommittedGenerationWithoutAnotherLogin() throws Exception {
        AtomicInteger posts = new AtomicInteger();
        AtomicInteger schedules = new AtomicInteger();
        byte[] response = grant("schedule-fixture").toString().getBytes(StandardCharsets.UTF_8);
        MealPlanAccountPlugin.SignIn result = MealPlanAccountPlugin.authenticateNative(vault,
            vault.beginAuthentication(), "healthmate", "an_42", "fixture-password", null, "Android",
            (path, body) -> { posts.incrementAndGet(); return new Object[]{200,"OK",response}; });
        SessionVault.Session account = result.current();
        assertFalse(MealPlanAccountPlugin.installPending(vault, account, () -> { throw new IOException("fixture unavailable"); }));
        assertEquals(account.generation, vault.read().generation);
        assertTrue(vault.read().data.getBoolean("authSchedulePending"));
        assertFalse(MealPlanAccountPlugin.publicSession(vault.read()).has("authSchedulePending"));
        assertTrue(MealPlanAccountPlugin.installPending(vault, account, schedules::incrementAndGet));
        assertTrue(MealPlanAccountPlugin.installPending(vault, account, schedules::incrementAndGet));
        assertEquals(1, posts.get());
        assertEquals(1, schedules.get());
        assertFalse(vault.read().data.getBoolean("authSchedulePending"));
        JSONObject next=grant("other-generation").put("authSchedulePending",true);
        vault.replaceAfterAuthentication(vault.beginAuthentication(),next);
        assertThrows(SessionVault.SessionChanged.class, () -> MealPlanAccountPlugin.installPending(vault,account,schedules::incrementAndGet));
        assertTrue(vault.read().data.getBoolean("authSchedulePending"));
        assertEquals(1,schedules.get());
    }

    @Test public void newAttemptAndClearInvalidateOlderTicketsEvenWhenSignedOut() throws Exception {
        long first=vault.beginAuthentication();
        long second=vault.beginAuthentication();
        assertThrows(SessionVault.SessionChanged.class,()->vault.replaceAfterAuthentication(first,grant("older")));
        SessionVault.Session saved=vault.replaceAfterAuthentication(second,grant("newer"));
        saved=vault.updateGroqKey(saved,"local-test-key");
        SessionVault.Session again=vault.replaceAfterAuthentication(vault.beginAuthentication(),grant("same-owner-new-grant"));
        assertNotEquals(saved.generation,again.generation);
        assertEquals("local-test-key",again.groqKey);
        vault.clear();
        long pending=vault.beginAuthentication();vault.clear();
        assertThrows(SessionVault.SessionChanged.class,()->vault.replaceAfterAuthentication(pending,grant("late")));
        assertNull(vault.read());
    }

    @Test public void queuedLogoutCannotRemoveTheNewSessionOrCancelItsProgress() throws Exception {
        SessionVault.Session original=vault.replaceAfterAuthentication(vault.beginAuthentication(),grant("before-clear"));
        long queued=vault.beginClear(original.ownerId,original.generation);
        JSONObject next=grant("new-login").put("ownerId","bbbbbbbbbbbbbbb");
        SessionVault.Session winner=vault.replaceAfterAuthentication(vault.beginAuthentication(),next);
        AtomicInteger cancelled=new AtomicInteger();
        assertThrows(SessionVault.SessionChanged.class,()->vault.clearAfter(queued,cancelled::incrementAndGet));
        assertThrows(SessionVault.SessionChanged.class,()->vault.beginClear(original.ownerId,original.generation));
        assertEquals(0,cancelled.get());
        assertEquals(winner.generation,vault.read().generation);
        long valid=vault.beginClear(winner.ownerId,winner.generation);
        assertEquals(winner.generation,vault.clearAfter(valid,cancelled::incrementAndGet).generation);
        assertEquals(1,cancelled.get());
        assertNull(vault.read());
    }

    @Test public void lateServerGrantCannotOverwriteTheWinningSession() throws Exception {
        try (LocalTls server = new LocalTls(0, grant("late-session-token").toString(), "{}")) {
            long ticket=vault.beginAuthentication();
            FutureTask<MealPlanAccountPlugin.SignIn> slow=new FutureTask<>(() ->
                MealPlanAccountPlugin.authenticateNative(vault,ticket,"healthmate","an_42","private-fixture",null,Build.MODEL,server.http));
            Thread thread=new Thread(slow);thread.start();
            assertTrue(server.received.await(10,TimeUnit.SECONDS));
            SessionVault.Session winner=vault.replaceAfterAuthentication(vault.beginAuthentication(),grant("winning-session-token"));
            server.release.countDown();
            ExecutionException error=assertThrows(ExecutionException.class,()->slow.get(10,TimeUnit.SECONDS));
            assertTrue(error.getCause() instanceof SessionVault.SessionChanged);
            assertEquals(winner.generation,vault.read().generation);
            List<Captured> requests=server.observed.get(10,TimeUnit.SECONDS);
            assertEquals("POST /api/mealplan/logout HTTP/1.1",requests.get(1).request());
            assertEquals("late-session-token",requests.get(1).data().getString("sessionToken"));
        }
    }

    private record Captured(String request,JSONObject data) {}

    private static final class LocalTls implements AutoCloseable {
        final SSLServerSocket server;
        final AccountHttp http;
        final FutureTask<List<Captured>> observed;
        final CountDownLatch received=new CountDownLatch(1), release=new CountDownLatch(1);

        LocalTls(int pause,String... replies) throws Exception {
            HeldCertificate leaf=new HeldCertificate.Builder().commonName("localhost")
                .addSubjectAlternativeName("127.0.0.1").duration(2,TimeUnit.DAYS).build();
            HandshakeCertificates tlsServer=new HandshakeCertificates.Builder().heldCertificate(leaf).build();
            HandshakeCertificates tlsClient=new HandshakeCertificates.Builder().addTrustedCertificate(leaf.certificate()).build();
            server=(SSLServerSocket)tlsServer.sslContext().getServerSocketFactory().createServerSocket(0,4,InetAddress.getByName("127.0.0.1"));
            server.setSoTimeout(12000);
            OkHttpClient client=AccountHttp.client(new OkHttpClient.Builder().sslSocketFactory(tlsClient.sslSocketFactory(),tlsClient.trustManager()));
            http=new AccountHttp("",HttpUrl.get("https://127.0.0.1:"+server.getLocalPort()),client);
            observed=new FutureTask<>(()->{
                List<Captured> calls=new ArrayList<>();
                for(int i=0;i<replies.length;i++){
                    try(Socket socket=server.accept()){
                        socket.setSoTimeout(10000);
                        InputStream input=new BufferedInputStream(socket.getInputStream());
                        String request=line(input);int length=0;
                        for(String h=line(input);!h.isEmpty();h=line(input)){
                            if(h.toLowerCase(Locale.ROOT).startsWith("content-length:"))length=Integer.parseInt(h.substring(h.indexOf(':')+1).trim());
                        }
                        calls.add(new Captured(request,new JSONObject(new String(input.readNBytes(length),StandardCharsets.UTF_8))));
                        if(i==pause){received.countDown();if(!release.await(10,TimeUnit.SECONDS))throw new IOException("test release timed out");}
                        byte[] bytes=replies[i].getBytes(StandardCharsets.UTF_8);
                        OutputStream out=socket.getOutputStream();
                        out.write(("HTTP/1.1 200 OK\r\nContent-Length: "+bytes.length+"\r\nConnection: close\r\n\r\n").getBytes(StandardCharsets.US_ASCII));
                        out.write(bytes);out.flush();
                    }
                }
                return calls;
            });
            Thread thread=new Thread(observed,"account-test-tls");thread.setDaemon(true);thread.start();
        }
        private static String line(InputStream input)throws IOException{
            ByteArrayOutputStream result=new ByteArrayOutputStream();
            for(int c;(c=input.read())!='\n';){if(c<0)throw new EOFException();if(c!='\r')result.write(c);}
            return result.toString(StandardCharsets.US_ASCII.name());
        }
        @Override public void close() throws IOException {release.countDown();server.close();}
    }
}
