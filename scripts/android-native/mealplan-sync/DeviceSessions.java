package com.healthmate.ai.sync;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import java.io.IOException;
import org.json.JSONArray;
import org.json.JSONObject;

final class DeviceSessions {
    private static final String PATH = "/api/mealplan/sessions";
    private static final String ID_PATTERN = "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}";

    private DeviceSessions() {}

    static JSObject list(SessionVault vault, String owner) throws Exception {
        return request(vault, owner, PATH, null);
    }

    static JSObject revoke(SessionVault vault, String owner, String id) throws Exception {
        if (!id.matches(ID_PATTERN)) return failure("session_not_found");
        return request(vault, owner, PATH + "/revoke", new JSONObject().put("id", id));
    }

    private static JSObject request(SessionVault vault, String owner, String path, JSONObject body) throws Exception {
        SessionVault.Session account = vault.read();
        if (account == null || !account.ownerId.equals(owner)) return failure("account_changed");
        try {
            JSONObject data = new SessionAuthorizer(vault).request(account, path, body);
            return vault.whileCurrent(account, () -> body == null ? summaries(data) : new JSObject());
        } catch (SessionVault.SessionChanged changed) {
            return failure("account_changed");
        } catch (SessionAuthorizer.Reauthentication expired) {
            return failure(expired.reason);
        } catch (MealPlanApi.ResponseError response) {
            if (response.status == 404 && response.code.equals("session_not_found")) return failure(response.code);
            if (response.status == 409 && response.code.equals("current_session")) return failure(response.code);
            return failure("unavailable");
        } catch (IOException unavailable) {
            return failure("offline");
        }
    }

    private static JSObject summaries(JSONObject response) throws Exception {
        JSONArray rows = response.getJSONArray("devices");
        JSArray devices = new JSArray();
        for (int index = 0; index < rows.length(); index++) {
            JSONObject row = rows.getJSONObject(index);
            String id = row.getString("id");
            if (!id.matches(ID_PATTERN)) throw new IOException("Invalid device session id");
            devices.put(new JSObject().put("id", id).put("label", row.getString("label"))
                .put("createdAt", row.getString("createdAt")).put("expiresAt", row.getString("expiresAt"))
                .put("current", row.getBoolean("current")));
        }
        return new JSObject().put("devices", devices);
    }

    private static JSObject failure(String reason) {
        return new JSObject().put("reason", reason);
    }
}
