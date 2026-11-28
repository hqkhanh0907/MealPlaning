use crate::db;
use rusqlite::{Connection, OpenFlags, Transaction, params_from_iter, types::Value};
use std::{io, path::Path};

const TABLES: &[(&str, &str)] = &[
    ("users", "id,username,name,password,mealplan_disabled"),
    ("mealplan_operators", "id,email,password"),
    ("mealplan_sessions", "digest,owner,expires,revoked_at"),
    (
        "mealplan_session_metadata",
        "session,public_id,created_at,device_label",
    ),
    ("mealplan_access", "digest,session,expires"),
    ("mealplan_workspaces", "owner,revision,snapshot"),
    ("mealplan_workspace_history", "owner,revision,snapshot"),
    (
        "mealplan_receipts",
        "owner,operation,request_hash,revision,merged",
    ),
    ("mealplan_operations", "code,count,last_seen_at"),
];

fn transfer(
    src: &Transaction<'_>,
    dst: &Transaction<'_>,
    table: &str,
    cols: &str,
) -> rusqlite::Result<usize> {
    let fields: Vec<_> = cols.split(',').collect();
    let select: Vec<_> = fields
        .iter()
        .map(|&f| if f == "snapshot" { "json(snapshot)" } else { f })
        .collect();
    let mut read = src.prepare(&format!("SELECT {} FROM {table}", select.join(",")))?;
    let placeholders = vec!["?"; fields.len()].join(",");
    let mut insert = dst.prepare(&format!(
        "INSERT INTO {table}({cols}) VALUES ({placeholders})"
    ))?;
    let mut count = 0;
    let mut rows = read.query([])?;
    while let Some(row) = rows.next()? {
        let values = (0..fields.len())
            .map(|i| row.get::<_, Value>(i))
            .collect::<rusqlite::Result<Vec<_>>>()?;
        count += insert.execute(params_from_iter(values))?;
    }
    Ok(count)
}

pub fn import_pocketbase(
    source: &Path,
    destination: &Path,
) -> io::Result<Vec<(&'static str, usize)>> {
    if destination.try_exists()? {
        return Err(io::Error::new(
            io::ErrorKind::AlreadyExists,
            "Destination already exists.",
        ));
    }
    let mut src = Connection::open_with_flags(source, OpenFlags::SQLITE_OPEN_READ_ONLY)
        .map_err(io::Error::other)?;
    let read = src.transaction().map_err(io::Error::other)?;
    let marker: bool = read
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM sqlite_schema WHERE type='table' AND name='_collections')",
            [],
            |r| r.get(0),
        )
        .map_err(io::Error::other)?;
    if !marker {
        return Err(io::Error::other("Expected a migrated PocketBase database."));
    }
    let directory = destination
        .parent()
        .filter(|p| !p.as_os_str().is_empty())
        .unwrap_or(Path::new("."));
    let tmp = tempfile::NamedTempFile::new_in(directory)?;
    db::initialize(tmp.path()).map_err(io::Error::other)?;
    let mut dest = db::open(tmp.path()).map_err(io::Error::other)?;
    let tx = dest.transaction().map_err(io::Error::other)?;
    let mut counts = Vec::new();
    for &(table, columns) in TABLES {
        counts.push((
            table,
            transfer(&read, &tx, table, columns)
                .map_err(|e| io::Error::other(format!("Cannot import {table}: {e}")))?,
        ));
    }
    let invalid: bool = tx
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM pragma_foreign_key_check)",
            [],
            |r| r.get(0),
        )
        .map_err(io::Error::other)?;
    if invalid {
        return Err(io::Error::other("Imported data has invalid references."));
    }
    tx.commit().map_err(io::Error::other)?;
    read.commit().map_err(io::Error::other)?;
    dest.pragma_update(None, "journal_mode", "DELETE")
        .map_err(io::Error::other)?;
    let check: String = dest
        .pragma_query_value(None, "integrity_check", |r| r.get(0))
        .map_err(io::Error::other)?;
    if check != "ok" {
        return Err(io::Error::other(
            "Imported database failed its integrity check.",
        ));
    }
    drop(dest);
    tmp.as_file().sync_all()?;
    tmp.persist_noclobber(destination).map_err(|e| e.error)?;
    Ok(counts)
}
