package com.healthmate.ai.sync;

import java.util.concurrent.locks.ReentrantLock;
import org.json.JSONObject;

final class SessionAuthorizer {
    private static final ReentrantLock REFRESH = new ReentrantLock();
    private final SessionVault vault;

    SessionAuthorizer(SessionVault vault) { this.vault = vault; }

    SessionVault.Session get(SessionVault.Session expected, String rejectedAccess) throws Exception {
        REFRESH.lockInterruptibly();
        try {
            vault.requireCurrent(expected);
            SessionVault.Session current = vault.read();
            if (current == null || !current.generation.equals(expected.generation)) throw new SessionVault.SessionChanged();
            if (!current.reason.isEmpty()) throw new Reauthentication(current.reason);
            if (!current.sessionToken.isEmpty() && !current.accessToken.equals(rejectedAccess) && SyncTime.live(current.accessExpiresAt)) {
                return current;
            }
            MealPlanApi api = new MealPlanApi(current.origin);
            try {
                JSONObject fresh;
                if (current.sessionToken.isEmpty()) {
                    if (current.accessToken.isEmpty()) return reject(current, "session_expired");
                    fresh = api.request(MealPlanApi.SESSION, current.accessToken, new JSONObject());
                } else {
                    fresh = api.request(MealPlanApi.SESSION + "/refresh", "", new JSONObject().put("sessionToken", current.sessionToken));
                }
                if (!current.ownerId.equals(fresh.getString("ownerId"))) return reject(current, "account_forbidden");
                JSONObject fields = new JSONObject().put("accessToken", fresh.getString("accessToken"))
                    .put("accessExpiresAt", fresh.getString("accessExpiresAt"));
                if (current.sessionToken.isEmpty()) fields.put("sessionToken", fresh.getString("sessionToken"));
                if (fresh.has("username")) fields.put("username", fresh.getString("username"));
                if (fresh.has("name")) fields.put("fullName", fresh.optString("name"));
                return vault.update(current, fields);
            } catch (MealPlanApi.ResponseError error) {
                if (error.status == 403) return reject(current, "account_forbidden");
                if (error.status == 401) return reject(current, terminalReason(error.code));
                throw error;
            }
        } finally { REFRESH.unlock(); }
    }

    JSONObject request(SessionVault.Session session, String path, JSONObject payload) throws Exception {
        SessionVault.Session current = get(session, null);
        MealPlanApi api = new MealPlanApi(current.origin);
        try {
            vault.requireCurrent(current);
            return api.request(path, current.accessToken, payload);
        } catch (MealPlanApi.ResponseError error) {
            if (error.status == 403) {
                reject(current, "account_forbidden");
            } else if (error.status == 401) {
                if (error.code.equals("session_revoked") || error.code.equals("session_expired")) reject(current, error.code);
                SessionVault.Session renewed = get(current, current.accessToken);
                try {
                    vault.requireCurrent(renewed);
                    return api.request(path, renewed.accessToken, payload);
                } catch (MealPlanApi.ResponseError repeated) {
                    if (repeated.status == 403) reject(renewed, "account_forbidden");
                    if (repeated.status == 401) reject(renewed, terminalReason(repeated.code));
                    throw repeated;
                }
            }
            throw error;
        }
    }

    private SessionVault.Session reject(SessionVault.Session session, String reason) throws Exception {
        vault.update(session, new JSONObject().put("reason", reason).put("accessToken", ""));
        throw new Reauthentication(reason);
    }

    private String terminalReason(String code) {
        return code.equals("session_revoked") ? "session_revoked" : "session_expired";
    }

    static final class Reauthentication extends Exception {
        final String reason;
        Reauthentication(String reason) { this.reason = reason; }
    }
}
