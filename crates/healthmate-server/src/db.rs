use rusqlite::{Connection, OpenFlags, TransactionBehavior};
use std::{path::Path, time::Duration};

pub(crate) const APPLICATION_ID: i32 = 0x484d5356;

pub(crate) fn open(path: &Path) -> rusqlite::Result<Connection> {
    let db = Connection::open_with_flags(
        path,
        OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )?;
    db.busy_timeout(Duration::from_secs(5))?;
    db.pragma_update(None, "foreign_keys", "ON")?;
    Ok(db)
}

pub(crate) fn initialize(path: &Path) -> rusqlite::Result<()> {
    #[cfg(unix)]
    {
        use std::{fs::OpenOptions, io::ErrorKind, os::unix::fs::OpenOptionsExt};
        match OpenOptions::new()
            .write(true)
            .create_new(true)
            .mode(0o600)
            .open(path)
        {
            Ok(_) => (),
            Err(e) if e.kind() == ErrorKind::AlreadyExists => (),
            Err(e) => return Err(rusqlite::Error::ToSqlConversionFailure(Box::new(e))),
        }
    }
    let mut db = Connection::open(path)?;
    db.busy_timeout(Duration::from_secs(5))?;
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let id: i32 = tx.pragma_query_value(None, "application_id", |r| r.get(0))?;
    let version: i32 = tx.pragma_query_value(None, "user_version", |r| r.get(0))?;
    if id == 0 && version == 0 {
        let tables: i64 = tx.query_row(
            "SELECT count(*) FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'",
            [],
            |r| r.get(0),
        )?;
        if tables != 0 {
            return Err(rusqlite::Error::InvalidQuery);
        }
        tx.execute_batch(include_str!("schema.sql"))?;
        tx.pragma_update(None, "application_id", APPLICATION_ID)?;
        tx.pragma_update(None, "user_version", 1)?;
    } else if id != APPLICATION_ID || version != 1 {
        return Err(rusqlite::Error::InvalidQuery);
    }
    tx.commit()?;
    db.pragma_update(None, "journal_mode", "WAL")?;
    Ok(())
}
