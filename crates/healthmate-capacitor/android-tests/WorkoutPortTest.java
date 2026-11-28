package com.healthmate.ai.sync;

import static org.junit.Assert.assertNotNull;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import org.junit.Test;

public final class WorkoutPortTest {
    @Test public void bothPluginsExposeTheSameCapacitorTransactionEntryPoints() throws Exception {
        for (Class<?> plugin : new Class<?>[]{MealPlanProfilePlugin.class, MealPlanWorkoutPlugin.class}) {
            for (String method : new String[]{"binding", "apply"}) {
                assertNotNull(plugin.getMethod(method, PluginCall.class).getAnnotation(PluginMethod.class));
            }
        }
    }
}
