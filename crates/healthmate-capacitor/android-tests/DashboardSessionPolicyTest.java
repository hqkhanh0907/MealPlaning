package com.healthmate.ai.sync;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import com.getcapacitor.JSObject;
import org.json.JSONObject;
import org.junit.Test;

public final class DashboardSessionPolicyTest {
    private static SessionVault.Session session(String owner, String generation, String reason) throws Exception {
        return new SessionVault.Session(new JSONObject().put("ownerId", owner).put("generation", generation)
            .put("dbName", "healthmate_" + owner).put("reason", reason));
    }

    @Test public void switchingOwnerLoggingOutAndReplacingGenerationCannotDeliverOldData() throws Exception {
        SessionVault.Session original = session("aaaaaaaaaaaaaaa", "one", "");
        assertNull(MealPlanSyncPlugin.dashboardSessionIssue(original, session("aaaaaaaaaaaaaaa", "one", "")));
        for (SessionVault.Session changed : new SessionVault.Session[] {
            session("bbbbbbbbbbbbbbb", "one", ""), session("aaaaaaaaaaaaaaa", "two", ""), null
        }) {
            assertEquals("dashboard_session_changed", MealPlanSyncPlugin.dashboardSessionIssue(original, changed));
        }
        assertEquals("dashboard_session_required", MealPlanSyncPlugin.dashboardSessionIssue(null, null));
    }

    @Test public void revocationWhileReadingWinsAndOfflineExpiryDoesNotEraseLocalAccess() throws Exception {
        SessionVault.Session original = session("aaaaaaaaaaaaaaa", "one", "");
        SessionVault.Session expired = session("aaaaaaaaaaaaaaa", "one", "session_expired");
        SessionVault.Session revoked = session("aaaaaaaaaaaaaaa", "one", "session_revoked");
        assertNull(MealPlanSyncPlugin.dashboardSessionIssue(null, expired));
        assertNull(MealPlanSyncPlugin.dashboardSessionIssue(expired, expired));
        assertEquals("dashboard_session_changed", MealPlanSyncPlugin.dashboardSessionIssue(original, expired));
        assertEquals("dashboard_session_revoked", MealPlanSyncPlugin.dashboardSessionIssue(original, revoked));
        assertEquals("dashboard_session_revoked", MealPlanSyncPlugin.dashboardSessionIssue(null, revoked));
    }

    @Test public void deliveredSnapshotGetsTheVerifiedOwnerForEachAccount() throws Exception {
        SessionVault.Session alice = session("aaaaaaaaaaaaaaa", "one", "");
        SessionVault.Session bob = session("bbbbbbbbbbbbbbb", "two", "");
        for (SessionVault.Session active : new SessionVault.Session[] {alice, bob}) {
            JSObject snapshot = new JSObject().put("ownerId", "untrusted");
            assertNull(MealPlanSyncPlugin.bindDashboardOwner(active, active, snapshot));
            assertEquals(active.ownerId, snapshot.getString("ownerId"));
        }
        JSObject stale = new JSObject();
        assertEquals("dashboard_session_changed", MealPlanSyncPlugin.bindDashboardOwner(alice, bob, stale));
        assertNull(stale.opt("ownerId"));
    }
}
