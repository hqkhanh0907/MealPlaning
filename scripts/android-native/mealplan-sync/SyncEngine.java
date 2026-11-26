package com.healthmate.ai.sync;

import android.content.Context;
import android.database.sqlite.SQLiteDatabaseLockedException;
import android.util.Log;
import com.getcapacitor.JSObject;
import java.io.IOException;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.BooleanSupplier;
import org.json.JSONObject;

final class SyncEngine {
    private static final ReentrantLock TRANSFER = new ReentrantLock();
    private static final String TAG = "MealPlanSync";
    private static final String METADATA = MealPlanApi.WORKSPACE + "?metadata=1";
    private final Context context;
    private final SessionVault vault;
    private final SessionAuthorizer authorizer;

    SyncEngine(Context context) {
        this.context = context;
        vault = new SessionVault(context);
        authorizer = new SessionAuthorizer(vault);
    }

    JSObject run(SessionVault.Session account, String source, String runId, Boolean useServer,
                 BooleanSupplier stopped) throws Exception {
        SyncStatus status = new SyncStatus(context, account.ownerId);
        TRANSFER.lockInterruptibly();
        try {
            check(account, stopped);
            vault.whileCurrent(account, () -> { status.begin(source); return null; });
            Log.i(TAG, "start source=" + source + " work=" + runId);
            return new Transfer(account, source, runId, stopped, status).perform(useServer);
        } catch (SessionVault.SessionChanged changed) {
            return idle();
        } finally { TRANSFER.unlock(); }
    }

    static JSObject idle() {
        JSObject result = new JSObject();
        result.put("status", "idle");
        return result;
    }

    private void check(SessionVault.Session account, BooleanSupplier stopped) throws Exception {
        if (stopped.getAsBoolean() || Thread.currentThread().isInterrupted()) throw new InterruptedException();
        vault.requireCurrent(account);
    }

    private final class Transfer {
        private final SessionVault.Session account;
        private final String source;
        private final String runId;
        private final BooleanSupplier stopped;
        private final SyncStatus status;
        private final SyncProgress progress = new SyncProgress(context);
        private long appliedRevision;
        private long serverRevision;

        Transfer(SessionVault.Session account, String source, String runId, BooleanSupplier stopped, SyncStatus status) {
            this.account = account;
            this.source = source;
            this.runId = runId;
            this.stopped = stopped;
            this.status = status;
        }

        JSObject perform(Boolean useServer) throws Exception {
            try (WorkspaceStore store = new WorkspaceStore(context, account)) {
                if (!account.reason.isEmpty()) return reauthenticate(account.reason);
                if (useServer != null) resolve(store, useServer);
                for (int attempt = 0; attempt < 4; attempt++) {
                    if (synchronize(store)) return finish("saved", "");
                }
                return finish("offline", "database_busy");
            } catch (SessionAuthorizer.Reauthentication rejected) {
                return reauthenticate(rejected.reason);
            } catch (MealPlanApi.ResponseError response) {
                if (response.status == 409) return finish("conflict", "workspace_conflict");
                if (response.status == 429 || response.status >= 500) return finish("offline", "server_unavailable");
                return finish("error", "server_rejected_sync");
            } catch (SnapshotMerge.Conflict conflict) {
                return finish("conflict", "workspace_conflict");
            } catch (WorkspaceStore.NotReady missing) {
                return finish("offline", "database_not_ready");
            } catch (WorkspaceStore.Changed | SQLiteDatabaseLockedException busy) {
                return finish("offline", "database_busy");
            } catch (WorkspaceStore.Incompatible invalid) {
                return finish("error", "upgrade_required");
            } catch (IOException offline) {
                return finish("offline", "network_unavailable");
            } catch (SessionVault.SessionChanged | InterruptedException cancelled) {
                progress.cancel();
                throw cancelled;
            } catch (Exception error) {
                Log.w(TAG, "sync failed type=" + error.getClass().getSimpleName());
                return finish("error", "sync_failed");
            }
        }

        private boolean synchronize(WorkspaceStore store) throws Exception {
            ensureActive();
            WorkspaceStore.State state = store.state();
            if (state.dirty()) {
                WorkspaceStore.Pending pending = vault.whileCurrent(account, store::prepare);
                if (pending != null) send(store, pending);
                return !store.state().dirty();
            }
            long latest = request(METADATA, null).getLong("revision");
            serverRevision = latest;
            if (latest > state.revision()) receive(store, state, false, latest);
            return !store.state().dirty();
        }

        private void resolve(WorkspaceStore store, boolean useServer) throws Exception {
            WorkspaceStore.State local = store.state();
            if (useServer) {
                receive(store, local, true, local.revision());
            } else {
                long revision = request(METADATA, null).getLong("revision");
                vault.whileCurrent(account, () -> { store.keepLocal(revision, local); return null; });
            }
        }

        private void send(WorkspaceStore store, WorkspaceStore.Pending pending) throws Exception {
            ensureActive();
            progress.sending();
            Log.i(TAG, "send source=" + source + " work=" + runId + " operation=" + pending.id());
            JSONObject response = request(MealPlanApi.WORKSPACE, pending.request());
            if (!pending.id().equals(response.getString("operationId"))) throw new IOException("Unexpected sync receipt");
            long receiptRevision = response.getLong("revision");
            long latest = request(METADATA, null).getLong("revision");
            if (latest < receiptRevision) throw new IOException("Workspace revision changed");
            if (response.optBoolean("merged") || latest > receiptRevision) {
                progress.receiving();
                JSONObject remote = request(MealPlanApi.WORKSPACE, null);
                long revision = remote.getLong("revision");
                if (revision < latest) throw new IOException("Workspace revision changed");
                JSONObject snapshot = remote.getJSONObject("snapshot");
                vault.whileCurrent(account, () -> { store.acknowledge(pending, revision, snapshot); return null; });
                appliedRevision = revision;
                serverRevision = revision;
            } else {
                vault.whileCurrent(account, () -> { store.acknowledge(pending, receiptRevision, null); return null; });
                serverRevision = receiptRevision;
            }
        }

        private void receive(WorkspaceStore store, WorkspaceStore.State local, boolean overwrite, long minimum) throws Exception {
            ensureActive();
            progress.receiving();
            JSONObject remote = request(MealPlanApi.WORKSPACE, null);
            long revision = remote.getLong("revision");
            if (revision < minimum) throw new IOException("Workspace revision changed");
            JSONObject snapshot = remote.getJSONObject("snapshot");
            vault.whileCurrent(account, () -> { store.adopt(snapshot, revision, local, overwrite); return null; });
            appliedRevision = revision;
            serverRevision = revision;
        }

        private JSONObject request(String path, JSONObject payload) throws Exception {
            ensureActive();
            JSONObject result = authorizer.request(account, path, payload);
            ensureActive();
            return result;
        }

        private void ensureActive() throws Exception { check(account, stopped); }

        private JSObject reauthenticate(String reason) throws Exception {
            return finish(reason.equals("account_forbidden") ? "forbidden" : "expired", reason);
        }

        private JSObject finish(String state, String reason) throws Exception {
            return vault.whileCurrent(account, () -> {
                if (state.equals("saved")) progress.complete();
                else progress.cancel();
                status.finish(state, reason, appliedRevision);
                Log.i(TAG, "finish source=" + source + " work=" + runId + " status=" + state +
                    " reason=" + reason + " revision=" + serverRevision);
                return status.details(appliedRevision > 0);
            });
        }
    }
}
