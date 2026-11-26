package com.healthmate.ai.sync;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.os.Build;
import android.text.InputFilter;
import android.text.InputType;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.view.inputmethod.EditorInfo;
import android.widget.EditText;
import android.widget.FrameLayout;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

@CapacitorPlugin(name = "MealPlanGroq")
public final class MealPlanGroqPlugin extends Plugin {
    private static final Executor CONTROL = Executors.newSingleThreadExecutor();
    private static final Executor NETWORK = Executors.newFixedThreadPool(2);
    private final GroqTransport transport = new GroqTransport();
    private final AtomicBoolean dialogOpen = new AtomicBoolean();
    private SessionVault vault;

    @Override public void load() {
        vault = new SessionVault(getContext().getApplicationContext());
    }

    @PluginMethod public void status(PluginCall call) {
        run(call, CONTROL, () -> {
            SessionVault.Session account = requireOwner(call);
            resolveCurrent(call, account, statusOf(account, false));
        });
    }

    @PluginMethod public void configure(PluginCall call) {
        run(call, CONTROL, () -> {
            SessionVault.Session account = requireOwner(call);
            Activity activity = getActivity();
            if (activity == null || !dialogOpen.compareAndSet(false, true)) {
                throw new GroqTransport.Failure("groq_unavailable");
            }
            activity.runOnUiThread(() -> {
                try {
                    vault.requireCurrentGroq(account);
                    showKeyDialog(activity, call, account);
                } catch (Exception failed) {
                    dialogOpen.set(false);
                    reject(call, failed);
                }
            });
        });
    }

    @PluginMethod public void clear(PluginCall call) {
        run(call, CONTROL, () -> {
            SessionVault.Session account = vault.updateGroqKey(requireOwner(call), null);
            resolveCurrent(call, account, statusOf(account, false));
        });
    }

    @PluginMethod public void generate(PluginCall call) {
        run(call, CONTROL, () -> {
            SessionVault.Session account = requireOwner(call);
            if (account.groqKey.isEmpty()) throw new GroqTransport.Failure("groq_not_configured");
            run(call, NETWORK, () -> completeGeneration(call, account));
        });
    }

    private void completeGeneration(PluginCall call, SessionVault.Session account) throws Exception {
        GroqTransport.Response result;
        try {
            GroqTransport.Request request = GroqTransport.prepare(call.getObject("payload"), call.getInt("timeoutMs"));
            vault.requireCurrentGroq(account);
            result = transport.generate(request, account.groqKey);
        } catch (Exception failed) {
            vault.whileCurrentGroq(account, () -> {
                reject(call, failed);
                return null;
            });
            return;
        }
        JSObject reply = new JSObject();
        reply.put("status", result.status());
        if (result.content() != null) reply.put("content", result.content());
        resolveCurrent(call, account, reply);
    }

    private void showKeyDialog(Activity activity, PluginCall call, SessionVault.Session account) throws Exception {
        if (activity.isFinishing() || activity.isDestroyed()) throw new GroqTransport.Failure("groq_unavailable");
        AlertDialog.Builder builder = new AlertDialog.Builder(activity, android.R.style.Theme_Material_Light_Dialog_Alert);
        FrameLayout container = new FrameLayout(builder.getContext());
        int inset = Math.round(24 * activity.getResources().getDisplayMetrics().density);
        container.setPadding(inset, 0, inset, 0);
        EditText input = new EditText(builder.getContext());
        input.setHint("Khóa API Groq");
        input.setSingleLine(true);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        input.setImeOptions(EditorInfo.IME_FLAG_NO_PERSONALIZED_LEARNING | EditorInfo.IME_FLAG_NO_EXTRACT_UI);
        input.setSaveEnabled(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) input.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO);
        input.setFilters(new InputFilter[]{new InputFilter.LengthFilter(GroqTransport.MAX_KEY_LENGTH + 1)});
        container.addView(input);
        AlertDialog dialog = builder.setTitle("Khóa Groq")
            .setView(container)
            .setNegativeButton("Hủy", null)
            .setPositiveButton("Lưu", null)
            .create();
        Window window = dialog.getWindow();
        if (window == null) throw new GroqTransport.Failure("groq_unavailable");
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        AtomicBoolean submitted = new AtomicBoolean();
        dialog.setOnDismissListener(ignored -> {
            input.getText().clear();
            dialogOpen.set(false);
            if (!submitted.get()) run(call, CONTROL, () -> resolveCurrent(call, account, statusOf(account, true)));
        });
        dialog.show();
        dialog.getButton(DialogInterface.BUTTON_POSITIVE).setOnClickListener(ignored -> {
            String key;
            try { key = GroqTransport.normalizeKey(input.getText().toString()); }
            catch (GroqTransport.Failure invalid) {
                input.setError("Nhập khóa Groq hợp lệ, không có khoảng trắng bên trong.");
                return;
            }
            submitted.set(true);
            run(call, CONTROL, () -> {
                SessionVault.Session updated = vault.updateGroqKey(account, key);
                resolveCurrent(call, updated, statusOf(updated, false));
            });
            dialog.dismiss();
        });
    }

    private SessionVault.Session requireOwner(PluginCall call) throws Exception {
        String owner = call.getString("ownerId", "");
        if (owner.isEmpty()) throw new GroqTransport.Failure("groq_invalid_request");
        SessionVault.Session account = vault.read();
        if (account == null) throw new GroqTransport.Failure("groq_no_session");
        if (!owner.equals(account.ownerId)) throw new SessionVault.SessionChanged();
        return account;
    }

    private void resolveCurrent(PluginCall call, SessionVault.Session account, JSObject result) throws Exception {
        vault.whileCurrentGroq(account, () -> {
            call.resolve(result);
            return null;
        });
    }

    private static JSObject statusOf(SessionVault.Session account, boolean cancelled) {
        JSObject result = new JSObject();
        result.put("configured", !account.groqKey.isEmpty());
        if (cancelled) result.put("cancelled", true);
        return result;
    }

    private void run(PluginCall call, Executor executor, Action action) {
        executor.execute(() -> {
            try { action.run(); }
            catch (Exception failed) { reject(call, failed); }
        });
    }

    private static void reject(PluginCall call, Exception failed) {
        String code = "groq_unavailable";
        if (failed instanceof SessionVault.SessionChanged) code = "groq_session_changed";
        else if (failed instanceof GroqTransport.Failure error) code = error.code;
        call.reject("Groq could not complete the request", code);
    }

    private interface Action { void run() throws Exception; }
}
