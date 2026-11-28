package com.healthmate.ai.sync;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import org.json.JSONObject;
import org.junit.Test;

public final class ProfileDataSessionTest {
    private static final String OWNER = "aaaaaaaaaaaaaaa";

    private static SessionVault.Session session(String owner, String generation, String reason) throws Exception {
        return new SessionVault.Session(new JSONObject()
            .put("ownerId", owner)
            .put("generation", generation)
            .put("reason", reason)
            .put("dbName", "healthmate_" + owner));
    }

    @Test public void rejectsMissingRevokedReplacedAndCrossAccountSessions() throws Exception {
        assertEquals("profile_session_required", MealPlanProfilePlugin.sessionIssue(OWNER, "g1", "", null));
        assertEquals("profile_session_required", MealPlanProfilePlugin.sessionIssue(OWNER, "g1", "", session(OWNER, "", "")));
        assertEquals("profile_session_revoked", MealPlanProfilePlugin.sessionIssue(OWNER, null, null, session(OWNER, "g1", "session_revoked")));
        assertEquals("profile_session_revoked", MealPlanProfilePlugin.sessionIssue(OWNER, "g1", "", session(OWNER, "g1", "session_revoked")));
        assertEquals("profile_session_changed", MealPlanProfilePlugin.sessionIssue(OWNER, "g1", "", session(OWNER, "g2", "")));
        assertEquals("profile_session_changed", MealPlanProfilePlugin.sessionIssue(OWNER, "g1", "", session("bbbbbbbbbbbbbbb", "g1", "")));
        assertEquals("profile_session_changed", MealPlanProfilePlugin.sessionIssue(OWNER, "g1", "", session(OWNER, "g1", "session_expired")));
    }

    @Test public void keepsBoundLocalDataAccessibleWithoutWorkingServerCredentials() throws Exception {
        for (String reason : new String[]{"", "session_expired", "account_forbidden"}) {
            assertNull(MealPlanProfilePlugin.sessionIssue(OWNER, "g1", reason, session(OWNER, "g1", reason)));
        }
    }
}
