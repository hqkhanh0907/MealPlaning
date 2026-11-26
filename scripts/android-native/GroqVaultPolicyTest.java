package com.healthmate.ai.sync;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;

import org.json.JSONObject;
import org.junit.Test;

public final class GroqVaultPolicyTest {
    private static final String FIXTURE_KEY = "fixture-only-native-credential";

    @Test
    public void keepsCredentialInternalAndPreservesItOnlyForSameOwnerReauthentication() throws Exception {
        SessionVault.Session previous = session("owner-a", "generation-1", "credential-1", FIXTURE_KEY);
        assertFalse(previous.publicData().has("groqKey"));
        assertFalse(previous.publicData().has("groqRevision"));
        assertFalse(previous.publicData().toString().contains(FIXTURE_KEY));

        SessionVault.Session refreshed = new SessionVault.Session(
            SessionVault.replacementData(new JSONObject().put("ownerId", "owner-a"), previous));
        assertEquals(FIXTURE_KEY, refreshed.groqKey);
        assertNotEquals(previous.generation, refreshed.generation);
        assertFalse(SessionVault.sameGroq(previous, refreshed));

        SessionVault.Session other = new SessionVault.Session(
            SessionVault.replacementData(new JSONObject().put("ownerId", "owner-b").put("groqKey", FIXTURE_KEY), previous));
        assertEquals("", other.groqKey);
        assertFalse(SessionVault.sameGroq(previous, other));
    }

    @Test
    public void removalAndReprovisionInvalidateEarlierOperationsEvenWithTheSameKey() throws Exception {
        SessionVault.Session previous = session("owner-a", "generation-1", "credential-1", FIXTURE_KEY);
        assertTrue(SessionVault.sameGroq(previous, session("owner-a", "generation-1", "credential-1", FIXTURE_KEY)));
        assertFalse(SessionVault.sameGroq(previous, session("owner-a", "generation-1", "credential-2", "")));
        assertFalse(SessionVault.sameGroq(previous, session("owner-a", "generation-1", "credential-3", FIXTURE_KEY)));
        assertFalse(SessionVault.sameGroq(previous, null));
    }

    private static SessionVault.Session session(String owner, String generation, String revision, String key) throws Exception {
        return new SessionVault.Session(new JSONObject().put("ownerId", owner).put("generation", generation)
            .put("groqRevision", revision).put("groqKey", key));
    }
}
