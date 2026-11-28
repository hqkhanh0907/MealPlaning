# HealthMate server

The Rust binary serves the Android API and a private operations page. SQLite stores accounts, device sessions, workspace revisions and operation receipts. Both listeners bind to loopback.

| Command | Default listener | Responsibility |
|---|---|---|
| `healthmate-server serve-public` | `127.0.0.1:18090` | Public Android API with explicit route and method checks |
| `healthmate-server serve-private` | `127.0.0.1:18089` | Operator authentication and service status |
| `healthmate-server serve` | Both | Local integration testing |

## Build and test

Use Rust 1.100.1. From the repository root, run:

````sh
cargo test --locked --workspace
cargo build --release --locked --bin healthmate-server
crates/healthmate-server/tests/run-legacy-http.sh target/release/healthmate-server
````

The HTTP suite starts isolated servers and exercises two-device synchronization and revocation. The migration test uses a real PocketBase 0.40.6 process and temporary data. Set `POCKETBASE_BIN` to the executable before running:

````sh
cargo test --locked -p healthmate-server imports_real_pocketbase -- --ignored
````

## Data ownership

SQLite on Android stores each account's local data and pending operation. The server derives ownership from authentication. It writes the new workspace and its receipt in one transaction. Replaying an operation with the same content returns its original revision.

Two devices can merge independent changes. Overlapping changes return the items requiring a decision. The server checks parent references and derives workout totals. It projects older clients to workspace version 12 and retains version 13 coaching fields when accepting compatible older writes.

Device settings, AI logs and unfinished set drafts stay on the device. The private operations page exposes service health, release SHA and aggregate sync metrics. Its operator cannot read a user's journal or revoke a user's device.

For an end-to-end check, record 40 kg × 6 and 40 kg × 5 with An offline. Confirm 440 kg before sync. After a lost response, the server must still have one session and two sets. Binh should see an empty history. On a second device, change An's second set to seven repetitions. Confirm 520 kg after both devices synchronize.

## Existing PocketBase installation

Rehearse using an online SQLite backup of the existing `data.db`. Use a new output path for each rehearsal. The importer reads the backup in one transaction and refuses to overwrite an existing output. It imports password verifiers, device sessions, workspace history, receipts and operations counters. Existing mobile session tokens remain valid under the original expiry and revocation rules. Operators sign in again.

For the final cutover, stop writes to the old instance and take a fresh backup. Retain the old release, database and gateway configuration. Run the importer as the service user:

````sh
healthmate-server import-pocketbase /path/to/pocketbase-backup.db /var/lib/mealplaning/healthmate.sqlite3
````

Compare accounts, workspaces and revisions with the source. Test a device session and the private operations page before admitting traffic. A rollback to PocketBase after new writes requires reconciliation. Restoring the old backup alone discards those writes.

## Fresh installations and operators

Set `MEALPLAN_DB_PATH` to the private SQLite file. The operator command reads its password from standard input. Supply it using a protected input file or secret manager:

````sh
healthmate-server operator ops@example.org < /path/to/operator-password
````

Provisioning the same operator rotates the password and revokes that operator's existing sessions. Store the database and credentials outside Git.

## Release layout

Install the release binary at `/opt/mealplaning/releases/<commit>/bin/healthmate-server`. Put `MEALPLAN_RELEASE=<commit>` in that release's `release.env`. Point `/opt/mealplaning/current` at the prepared release.

The two systemd unit files in `deploy/` run the same binary as `mealplan`. They require the database file at `/var/lib/mealplaning/healthmate.sqlite3`. Configure Funnel to forward only to the public listener. Open the operations page through an SSH tunnel to the private listener.

````sh
ssh -o BatchMode=yes -N -L 18091:127.0.0.1:18089 cachyos-root
````

On the workstation, open `http://127.0.0.1:18091/mealplan-admin.html`. The page uses server-rendered HTML. Refresh and sign-out work without JavaScript.

## Backups

Use a new destination for every backup and restore check. Set `MEALPLAN_DB_PATH` to the source for the backup command.

````sh
healthmate-server backup /path/to/new-backup.sqlite3
healthmate-server restore /path/to/new-backup.sqlite3 /path/to/new-restore-check.sqlite3
````

The commands check SQLite integrity and foreign keys before publishing the new file. Verify the restored application through an isolated listener. Keep the active database intact throughout the restore check.
