package com.healthmate.ai.sync;

import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.IOException;

@CapacitorPlugin(name = "MealPlanProfile")
public final class MealPlanProfilePlugin extends AccountDatabaseBridge {
    private static native String profileNative(String directory, String owner, String database, String command, Runnable beforeWrite) throws IOException;

    @Override protected String scope() { return "profile"; }

    static String sessionIssue(String owner, String generation, String reason, SessionVault.Session current) {
        return issue("profile", owner, generation, reason, current);
    }

    @Override protected boolean accepts(String op) {
        return switch (op) {
            case "get", "latestWeight", "previousWeight", "insert", "update" -> true;
            default -> false;
        };
    }

    @Override protected String execute(String directory, String owner, String database, String command, Runnable beforeWrite) throws IOException {
        return profileNative(directory, owner, database, command, beforeWrite);
    }
}
