use crate::error::Result;
use rusqlite::{Connection, OptionalExtension, params};
use serde_json::{Value, json};

pub(crate) fn record(db: &Connection, code: &str) {
    if db.execute("INSERT INTO mealplan_operations(code,count,last_seen_at) VALUES(?1,1,strftime('%Y-%m-%dT%H:%M:%fZ','now'))
        ON CONFLICT(code) DO UPDATE SET count=count+1,last_seen_at=excluded.last_seen_at",[code]).is_err() {
        eprintln!("Cannot record workspace statistics.");
    }
}

pub(crate) fn status(db: &Connection, release: &str) -> Result<Value> {
    let mut q = db.prepare("SELECT count,last_seen_at FROM mealplan_operations WHERE code=?1")?;
    let mut get = |code: &str| {
        q.query_row(params![code], |r| {
            Ok((r.get::<_, i64>(0)?, r.get::<_, String>(1)?))
        })
        .optional()
    };
    let upload = get("upload")?.map(|v| v.1);
    let download = get("download")?.map(|v| v.1);
    let mut errors = Vec::new();
    for code in ["conflict", "invalid_request", "unavailable"] {
        let v = get(code)?;
        errors.push(
            json!({"code":code,"count":v.as_ref().map_or(0,|v|v.0),"lastSeenAt":v.map(|v|v.1)}),
        );
    }
    let version = if release.is_empty() {
        "local".into()
    } else if release.len() == 40 && release.bytes().all(|c| c.is_ascii_hexdigit()) {
        release.to_ascii_lowercase()
    } else {
        "unknown".into()
    };
    Ok(
        json!({"services":{"api":"available","database":"available"},"release":version,"sync":{"lastUploadAt":upload,"lastDownloadAt":download},
        "syncFailures":errors}),
    )
}
