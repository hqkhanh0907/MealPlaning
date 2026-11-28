package com.healthmate.ai.sync;

import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.IOException;

@CapacitorPlugin(name = "MealPlanWorkout")
public final class MealPlanWorkoutPlugin extends AccountDatabaseBridge {
    private static native String workoutNative(String directory, String owner, String database, String command, Runnable beforeWrite) throws IOException;

    @Override protected String scope() { return "workout"; }

    @Override protected boolean accepts(String op) {
        return switch (op) {
            case "addSet", "skipSet", "completeSession", "reviseCompletedSet", "getSession", "getActiveSession" -> true;
            default -> false;
        };
    }

    @Override protected String execute(String directory, String owner, String database, String command, Runnable beforeWrite) throws IOException {
        return workoutNative(directory, owner, database, command, beforeWrite);
    }
}
