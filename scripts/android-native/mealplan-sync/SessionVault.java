package com.healthmate.ai.sync;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.AtomicFile;
import com.getcapacitor.JSObject;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.Arrays;
import java.util.UUID;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.json.JSONObject;

final class SessionVault {
    private static final String KEY_ALIAS = "mealplan.session.v2";
    private static final int NONCE_BYTES = 12;
    private static final Object LOCK = new Object();
    private final AtomicFile file;

    SessionVault(Context context) {
        file = new AtomicFile(new File(context.getNoBackupFilesDir(), "mealplan-session-v2"));
    }

    static final class Session {
        final JSONObject data;
        final String ownerId;
        final String generation;
        final String origin;
        final String dbName;
        final String accessToken;
        final String sessionToken;
        final String accessExpiresAt;
        final String reason;

        Session(JSONObject data) {
            this.data = data;
            ownerId = data.optString("ownerId");
            generation = data.optString("generation");
            origin = data.optString("origin");
            dbName = data.optString("dbName");
            accessToken = data.optString("accessToken");
            sessionToken = data.optString("sessionToken");
            accessExpiresAt = data.optString("accessExpiresAt");
            reason = data.optString("reason");
        }

        JSObject publicData() {
            JSObject result = new JSObject();
            result.put("ownerId", ownerId);
            result.put("username", data.optString("username"));
            result.put("fullName", data.optString("fullName"));
            result.put("accessToken", accessToken);
            result.put("accessExpiresAt", accessExpiresAt);
            result.put("reason", reason);
            result.put("reauthenticationRequired", !reason.isEmpty());
            return result;
        }
    }

    Session read() throws Exception {
        synchronized (LOCK) { return readLocked(); }
    }

    Session replace(JSONObject input) throws Exception {
        synchronized (LOCK) {
            JSONObject data = new JSONObject(input.toString());
            data.remove("reason");
            data.put("generation", UUID.randomUUID().toString());
            writeLocked(data);
            return new Session(data);
        }
    }

    Session update(Session expected, JSONObject fields) throws Exception {
        synchronized (LOCK) {
            Session current = readLocked();
            if (!same(expected, current)) throw new SessionChanged();
            for (java.util.Iterator<String> keys = fields.keys(); keys.hasNext();) {
                String key = keys.next();
                current.data.put(key, fields.get(key));
            }
            writeLocked(current.data);
            return new Session(current.data);
        }
    }

    Session clear() throws Exception {
        synchronized (LOCK) {
            try { return readLocked(); }
            finally { file.delete(); }
        }
    }

    void requireCurrent(Session expected) throws Exception {
        synchronized (LOCK) {
            if (!same(expected, readLocked())) throw new SessionChanged();
        }
    }

    <T> T whileCurrent(Session expected, Checked<T> action) throws Exception {
        synchronized (LOCK) {
            requireCurrent(expected);
            return action.run();
        }
    }

    interface Checked<T> { T run() throws Exception; }

    static final class SessionChanged extends Exception {}

    private boolean same(Session expected, Session current) {
        return current != null && expected.ownerId.equals(current.ownerId) && expected.generation.equals(current.generation);
    }

    private Session readLocked() throws Exception {
        byte[] bytes;
        try { bytes = file.readFully(); }
        catch (FileNotFoundException absent) { return null; }
        if (bytes.length <= NONCE_BYTES) throw new IllegalStateException("Invalid session data");
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, Arrays.copyOf(bytes, NONCE_BYTES)));
        byte[] clear = cipher.doFinal(bytes, NONCE_BYTES, bytes.length - NONCE_BYTES);
        return new Session(new JSONObject(new String(clear, StandardCharsets.UTF_8)));
    }

    private void writeLocked(JSONObject data) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key());
        byte[] nonce = cipher.getIV();
        if (nonce.length != NONCE_BYTES) throw new IllegalStateException("Invalid session nonce");
        byte[] encrypted = cipher.doFinal(data.toString().getBytes(StandardCharsets.UTF_8));
        FileOutputStream output = file.startWrite();
        try {
            output.write(nonce);
            output.write(encrypted);
            file.finishWrite(output);
        } catch (Exception error) {
            file.failWrite(output);
            throw error;
        }
    }

    private SecretKey key() throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");
        store.load(null);
        if (store.containsAlias(KEY_ALIAS)) return (SecretKey) store.getKey(KEY_ALIAS, null);
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256).build());
        return generator.generateKey();
    }
}
