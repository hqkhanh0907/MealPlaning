package com.healthmate.ai.sync;

import android.content.Context;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.function.BiFunction;
import okhttp3.Call;
import okhttp3.CookieJar;
import okhttp3.HttpUrl;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okio.BufferedSink;
import org.json.JSONObject;

@CapacitorPlugin(name = "MealPlanAccount")
public final class MealPlanAccountPlugin extends Plugin {
    static final String ORIGIN = "https://cachyos-x8664.tailb306f9.ts.net";
    private static final ExecutorService NETWORK = Executors.newFixedThreadPool(3);
    private static final ExecutorService RENAMES = Executors.newSingleThreadExecutor();
    private static Boolean linked;
    private static final String SCHEDULE_PENDING = "authSchedulePending";
    private Context context;
    private SessionVault vault;

    @Override public void load() {
        context = getContext().getApplicationContext();
        vault = new SessionVault(context);
    }

    private static native String accountNative(String operation, String usernameOrOwner, String password,
        String name, String deviceLabel, BiFunction<String,String,Object[]> http) throws IOException;

    static synchronized boolean available() {
        if (linked == null) {
            try {
                System.loadLibrary("sqlcipher");
                System.loadLibrary("healthmate_capacitor");
                linked = "1".equals(accountNative("probe", "", "", null, "", null));
            } catch (UnsatisfiedLinkError unavailable) {
                linked = false;
            } catch (IOException failed) {
                throw new IllegalStateException("Could not verify native account capability", failed);
            }
        }
        return linked;
    }

    @PluginMethod public void capability(PluginCall call) {
        call.resolve(new JSObject().put("supported", available()));
    }

    @PluginMethod public void identity(PluginCall call) {
        try {
            SessionVault.Session current = vault.read();
            if (current == null) call.resolve(new JSObject().put("identity", JSONObject.NULL));
            else vault.whileCurrent(current, () -> {
                SessionVault.Session latest = vault.read();
                call.resolve(publicSession(latest));
                if (latest.data.optBoolean(SCHEDULE_PENDING)) NETWORK.execute(() -> {
                    try { installPending(vault, latest, () -> new SyncSchedule(context).periodic(latest)); }
                    catch (Exception changed) { return; }
                });
                return null;
            });
        } catch (Exception changed) {
            call.reject("Account session changed", "account_changed");
        }
    }

    static JSObject publicSession(SessionVault.Session account) {
        JSObject identity = new JSObject().put("id", account.ownerId).put("username", account.data.optString("username"))
            .put("name", account.data.optString("fullName"));
        return new JSObject().put("identity", identity).put("generation", account.generation);
    }

    @PluginMethod public void authenticate(PluginCall call) {
        if (!available()) { call.reject("Native account unavailable", "native_account_unavailable"); return; }
        String prefix = call.getString("databasePrefix");
        String user = call.getString("username");
        String password = call.getString("password");
        if (!("healthmate".equals(prefix) || "healthmate_dev".equals(prefix)) || user == null || password == null) {
            call.reject("Invalid account request", "invalid_request");
            return;
        }
        String name = call.getString("name");
        long ticket = vault.beginAuthentication();
        NETWORK.execute(() -> {
            try {
                String label = Build.MODEL == null ? "Android" : Build.MODEL;
                AccountHttp http = new AccountHttp("");
                SignIn result = authenticateNative(vault, ticket, prefix, user, password, name, label, http);
                if (result.error() != null) {
                    call.resolve(new JSObject().put("error", result.error()));
                    return;
                }
                SessionVault.Session account = result.current();
                SessionVault.Session old = result.previous();
                vault.whileCurrent(account, () -> {
                    try {
                        new SyncProgress(context).cancel();
                        if (old != null) new SyncSchedule(context).cancel(old);
                    } catch (Exception | LinkageError unavailable) {
                        android.util.Log.w("MealPlanAccount", "Could not cancel the previous sync schedule.");
                    }
                    installPending(vault, account, () -> new SyncSchedule(context).periodic(account));
                    call.resolve(publicSession(account));
                    return null;
                });
            } catch (SessionVault.SessionChanged changed) {
                call.reject("Account session changed", "account_changed");
            } catch (Exception failed) {
                call.reject("Could not finish account sign-in", "account_auth_failed");
            }
        });
    }

    record SignIn(SessionVault.Session previous, SessionVault.Session current, JSONObject error) {}
    interface InstallSchedule { void run() throws Exception; }

    static boolean installPending(SessionVault vault, SessionVault.Session account, InstallSchedule schedule) throws Exception {
        return vault.whileCurrent(account, () -> {
            if (!vault.read().data.optBoolean(SCHEDULE_PENDING)) return true;
            try {
                schedule.run();
                vault.update(account, new JSONObject().put(SCHEDULE_PENDING, false));
                return true;
            } catch (Exception | LinkageError unavailable) {
                return false;
            }
        });
    }

    static SignIn authenticateNative(SessionVault vault, long ticket, String prefix, String user,
            String password, String name, String label, BiFunction<String,String,Object[]> http) throws Exception {
        JSONObject result = new JSONObject(accountNative("authenticate", user, password, name, label, (path, body) -> {
            try { vault.requireAuthentication(ticket); }
            catch (SessionVault.SessionChanged changed) { return AccountHttp.unavailable(); }
            return http.apply(path, body);
        }));
        if (result.has("error")) {
            vault.requireAuthentication(ticket);
            return new SignIn(null, null, result.getJSONObject("error"));
        }
        JSONObject grant = result.getJSONObject("grant");
        Instant.parse(grant.getString("accessExpiresAt"));
        grant.put("dbName", prefix + "_" + grant.getString("ownerId")).put("origin", ORIGIN).put(SCHEDULE_PENDING,true);
        SessionVault.Session previous;
        try { previous = vault.read(); }
        catch (Exception unreadable) { previous = null; }
        try {
            return new SignIn(previous, vault.replaceAfterAuthentication(ticket, grant), null);
        } catch (SessionVault.SessionChanged changed) {
            revokeUnpublished(vault,grant,previous,http);
            throw changed;
        }
    }

    private static void revokeUnpublished(SessionVault vault, JSONObject grant, SessionVault.Session previous,
                                          BiFunction<String,String,Object[]> http) {
        String token = grant.optString("sessionToken");
        if (!token.isEmpty() && (previous == null || !token.equals(previous.sessionToken))) NETWORK.execute(() -> {
            try {
                SessionVault.Session current = vault.read();
                if (current == null || !token.equals(current.sessionToken)) {
                    http.apply(MealPlanApi.LOGOUT, new JSONObject().put("sessionToken",token).toString());
                }
            } catch (Exception unavailable) { return; }
        });
    }

    @PluginMethod public void rename(PluginCall call) {
        if (!available()) { call.reject("Native account unavailable", "native_account_unavailable"); return; }
        String owner = call.getString("ownerId");
        String generation = call.getString("generation");
        String name = call.getString("name");
        if (owner == null || generation == null || name == null) {
            call.reject("Invalid account request", "invalid_request");
            return;
        }
        RENAMES.execute(() -> {
            try {
                SessionVault.Session account = vault.read();
                if (account == null || !owner.equals(account.ownerId) || !generation.equals(account.generation)) {
                    call.resolve(reauthenticate(""));
                    return;
                }
                SessionVault.Session active;
                String reason = "";
                try { active = new SessionAuthorizer(vault).get(account, null); }
                catch (SessionAuthorizer.Reauthentication expired) {
                    active = vault.whileCurrent(account, vault::read);
                    reason = expired.reason;
                } catch (IOException offline) {
                    active = vault.whileCurrent(account, vault::read);
                    reason = "offline";
                }
                if (active.accessToken.isEmpty()) {
                    call.resolve(reauthenticate(reason.isEmpty() ? active.reason : reason));
                    return;
                }
                vault.requireCurrent(active);
                JSONObject result = new JSONObject(accountNative("rename", owner,"",name,"", new AccountHttp(active.accessToken)));
                SessionVault.Session authorized = active;
                vault.whileCurrent(authorized, () -> {
                    SessionVault.Session current = vault.read();
                    if (current.accessToken.isEmpty() || !current.reason.isEmpty()) {
                        call.resolve(reauthenticate(current.reason));
                    } else if (result.has("error")) {
                        call.resolve(new JSObject().put("error",result.getJSONObject("error")));
                    } else if (result.isNull("fullName")) {
                        call.resolve(new JSObject().put("identity",JSONObject.NULL));
                    } else {
                        SessionVault.Session updated = vault.update(current, new JSONObject().put("fullName",result.getString("fullName")));
                        call.resolve(publicSession(updated));
                    }
                    return null;
                });
            } catch (SessionVault.SessionChanged changed) {
                call.resolve(new JSObject().put("identity", JSONObject.NULL));
            } catch (Exception failed) {
                call.reject("Could not update account name", "account_profile_failed");
            }
        });
    }

    private static JSObject reauthenticate(String reason) {
        return new JSObject().put("error",new JSObject().put("status",401).put("field","").put("code",reason)
            .put("message","Đăng nhập lại để đổi họ và tên."));
    }
}

final class AccountHttp implements BiFunction<String,String,Object[]> {
    private static final MediaType JSON = MediaType.get("application/json");
    static OkHttpClient client(OkHttpClient.Builder builder) {
        return builder
        .cookieJar(CookieJar.NO_COOKIES)
        .retryOnConnectionFailure(false)
        .followRedirects(false)
        .followSslRedirects(false)
        .callTimeout(10, TimeUnit.SECONDS)
        .build();
    }
    private static final OkHttpClient CLIENT = client(new OkHttpClient.Builder());
    private final String token;
    private final HttpUrl origin;
    private final OkHttpClient transport;

    AccountHttp(String token) { this(token, HttpUrl.get(MealPlanAccountPlugin.ORIGIN)); }
    AccountHttp(String token, HttpUrl origin) { this(token, origin, CLIENT); }
    AccountHttp(String token, HttpUrl origin, OkHttpClient transport) {
        this.token = token;
        this.origin = origin;
        this.transport = transport;
    }

    static Object[] unavailable() { return new Object[]{0, "", new byte[0]}; }

    private static RequestBody credentialBody(String json) {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        return new RequestBody() {
            @Override public MediaType contentType() { return JSON; }
            @Override public long contentLength() { return bytes.length; }
            @Override public boolean isOneShot() { return true; }
            @Override public void writeTo(BufferedSink sink) throws IOException { sink.write(bytes); }
        };
    }

    @Override public Object[] apply(String path, String json) {
        if (!path.equals("/api/collections/users/records") && !path.equals("/api/mealplan/session") &&
            !path.equals("/api/mealplan/profile") && !path.equals("/api/mealplan/logout")) return unavailable();
        HttpUrl url = origin.resolve(path);
        if (url == null) return unavailable();
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
        boolean post = true;
        for (int redirects = 0; redirects <= 20; redirects++) {
            if (System.nanoTime() >= deadline) return unavailable();
            Request.Builder builder = new Request.Builder().url(url).header("Accept", "application/json")
                .header("Cache-Control", "no-store");
            if (!token.isEmpty()) builder.header("Authorization", token);
            if (post) builder.post(credentialBody(json));
            Call request = transport.newCall(builder.build());
            request.timeout().deadlineNanoTime(deadline);
            try (Response reply = request.execute()) {
                int status = reply.code();
                String location = reply.header("Location");
                if (location != null && (status == 301 || status == 302 || status == 303 || status == 307 || status == 308)) {
                    HttpUrl next = url.resolve(location);
                    if (next == null || !next.scheme().equals(origin.scheme()) || !next.host().equals(origin.host()) ||
                        next.port() != origin.port() || !next.username().isEmpty() || !next.password().isEmpty()) return unavailable();
                    if (status == 301 || status == 302 || status == 303) post = false;
                    url = next;
                    continue;
                }
                return new Object[]{status, reply.message(), reply.body().bytes()};
            } catch (IOException failed) {
                return unavailable();
            }
        }
        return unavailable();
    }
}
