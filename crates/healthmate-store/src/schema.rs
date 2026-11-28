use crate::{Error, Result};
use rusqlite::{Connection, TransactionBehavior};
use serde::de::IgnoredAny;
use std::{collections::BTreeMap, time::Duration};

pub const SCHEMA_VERSION: i64 = 13;
const MIGRATIONS: &[(i64, &str)] = &[
    (1, include_str!("../migrations/01.sql")),
    (2, include_str!("../migrations/02.sql")),
    (3, include_str!("../migrations/03.sql")),
    (4, include_str!("../migrations/04.sql")),
    (5, include_str!("../migrations/05.sql")),
    (6, include_str!("../migrations/06.sql")),
    (7, include_str!("../migrations/07.sql")),
    (8, include_str!("../migrations/08.sql")),
    (9, include_str!("../migrations/09.sql")),
    (10, include_str!("../migrations/10.sql")),
    (12, include_str!("../migrations/12.sql")),
    (13, include_str!("../migrations/13.sql")),
];

pub fn initialize(db: &mut Connection) -> Result<()> {
    db.busy_timeout(Duration::from_secs(5))?;
    db.pragma_update(None, "foreign_keys", true)?;
    let current: i64 = db.pragma_query_value(None, "user_version", |r| r.get(0))?;
    if !(0..=SCHEMA_VERSION).contains(&current) {
        return Err(Error::UnsupportedSchema(current));
    }
    db.pragma_update(None, "journal_mode", "WAL")?;
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let current: i64 = tx.pragma_query_value(None, "user_version", |r| r.get(0))?;
    if !(0..=SCHEMA_VERSION).contains(&current) {
        return Err(Error::UnsupportedSchema(current));
    }
    for &(version, sql) in MIGRATIONS {
        if version > current {
            tx.execute_batch(sql)?;
            tx.pragma_update(None, "user_version", version)?;
        }
    }
    tx.execute_batch(
        "CREATE TABLE IF NOT EXISTS sync_workspace (
        id INTEGER PRIMARY KEY CHECK(id = 1), revision INTEGER NOT NULL DEFAULT 0,
        change_version INTEGER NOT NULL DEFAULT 0, clean_version INTEGER NOT NULL DEFAULT 0,
        pending TEXT, pending_version INTEGER);
        INSERT OR IGNORE INTO sync_workspace (id) VALUES (1);",
    )?;
    let tables: BTreeMap<String, IgnoredAny> =
        serde_json::from_str(include_str!("../../../server/pb_hooks/sync-schema.json"))?;
    for table in tables.keys() {
        debug_assert!(table.bytes().all(|b| b.is_ascii_lowercase() || b == b'_'));
        for action in ["insert", "update", "delete"] {
            tx.execute_batch(&format!(
                "CREATE TRIGGER IF NOT EXISTS sync_{table}_{action} AFTER {action} ON \"{table}\"
                 BEGIN UPDATE sync_workspace SET change_version = change_version + 1 WHERE id = 1; END;"
            ))?;
        }
    }
    tx.execute_batch(
        "UPDATE sync_workspace SET change_version = change_version + 1 WHERE id = 1
        AND EXISTS (SELECT 1 FROM app_config WHERE key = 'workout_preference_upload_pending');
        DELETE FROM app_config WHERE key = 'workout_preference_upload_pending';",
    )?;
    tx.commit()?;
    Ok(())
}
