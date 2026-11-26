package com.healthmate.ai.sync;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

final class SyncTime {
    private SyncTime() {}

    static String now() { return format().format(new Date()); }

    static boolean live(String expiration) {
        try {
            Date parsed = format().parse(expiration);
            return parsed != null && parsed.getTime() > System.currentTimeMillis() + 30000;
        } catch (Exception invalid) { return false; }
    }

    private static SimpleDateFormat format() {
        SimpleDateFormat clock = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.ROOT);
        clock.setLenient(false);
        clock.setTimeZone(TimeZone.getTimeZone("UTC"));
        return clock;
    }
}
