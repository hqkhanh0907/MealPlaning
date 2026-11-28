use crate::{
    auth::digest,
    error::{ApiError, Result},
};
use axum::http::StatusCode;
use healthmate_protocol::{
    SCHEMA_VERSION, js_stringify, merge_snapshots, normalize, preserve_workout_coaching,
    restore_stored_workout, stored_workout_envelope, workout_wire_version,
};
use rusqlite::{Connection, OptionalExtension, params};
use serde_json::{Map, Value, json};
use uuid::{Uuid, Variant};

const HISTORY: i64 = 32;

fn stored(db: &Connection, owner: &str, revision: i64, raw: &str) -> Result<Value> {
    let value: Value = serde_json::from_str(raw).map_err(|_| ApiError::internal())?;
    let mut snapshot = restore_stored_workout(&value).map_err(|_| ApiError::internal())?;
    if value["schemaVersion"] != SCHEMA_VERSION && !value["workoutCoaching13"].is_object() {
        let earlier = db
            .query_row(
                "SELECT snapshot FROM mealplan_workspace_history WHERE owner=?1 AND revision<?2
            AND json_type(snapshot,'$.workoutCoaching13')='object' ORDER BY revision DESC LIMIT 1",
                params![owner, revision],
                |r| r.get::<_, String>(0),
            )
            .optional()?;
        if let Some(earlier) = earlier {
            let data = serde_json::from_str(&earlier).map_err(|_| ApiError::internal())?;
            let previous = restore_stored_workout(&data).map_err(|_| ApiError::internal())?;
            preserve_workout_coaching(&mut snapshot, &previous)
                .map_err(|_| ApiError::internal())?;
        }
    }
    Ok(snapshot)
}

pub(crate) fn read(db: &Connection, owner: &str, metadata: bool, version: i64) -> Result<Value> {
    if metadata {
        let revision: Option<i64> = db
            .query_row(
                "SELECT revision FROM mealplan_workspaces WHERE owner=?1",
                [owner],
                |r| r.get(0),
            )
            .optional()?;
        return Ok(json!({"revision":revision.unwrap_or(0),"snapshot":null}));
    }
    let row = db
        .query_row(
            "SELECT revision,snapshot FROM mealplan_workspaces WHERE owner=?1",
            [owner],
            |r| Ok((r.get::<_, i64>(0)?, r.get::<_, String>(1)?)),
        )
        .optional()?;
    let Some((revision, raw)) = row else {
        return Ok(json!({"revision":0,"snapshot":null}));
    };
    let snapshot = workout_wire_version(&stored(db, owner, revision, &raw)?, version)
        .map_err(|_| ApiError::internal())?;
    Ok(json!({"revision":revision,"snapshot":snapshot}))
}

fn revision(value: &Value) -> Option<i64> {
    let n = value.as_f64()?;
    (n.fract() == 0.0 && (0.0..=9_007_199_254_740_991.0).contains(&n)).then_some(n as i64)
}

fn conflict() -> ApiError {
    ApiError::conflict("Data changed on another device.")
}

fn resolution(body: &Value, merge: bool) -> Result<Option<Value>> {
    let Some(input) = body.get("resolution") else {
        return Ok(None);
    };
    let invalid = || ApiError::bad("Invalid conflict resolution.");
    if !merge {
        return Err(invalid());
    }
    let revision = revision(&input["revision"]).ok_or_else(invalid)?;
    let raw = input["choices"].as_object().ok_or_else(invalid)?;
    if raw.is_empty() {
        return Err(ApiError::bad("Missing conflict choices."));
    }
    let mut entries: Vec<_> = raw.iter().collect();
    entries.sort_by(|a, b| a.0.encode_utf16().cmp(b.0.encode_utf16()));
    let mut choices = Map::new();
    for (k, v) in entries {
        if !matches!(v.as_str(), Some("local" | "server")) {
            return Err(ApiError::bad("Invalid conflict choice."));
        }
        choices.insert(k.clone(), v.clone());
    }
    Ok(Some(json!({"revision":revision,"choices":choices})))
}

fn reply(revision: i64, operation: &str, merged: bool) -> Value {
    let mut value = json!({"revision":revision,"operationId":operation});
    if merged {
        value["merged"] = true.into();
    }
    value
}

pub(crate) fn write(db: &Connection, owner: &str, body: &Value) -> Result<Value> {
    let invalid = || ApiError::bad("Invalid synchronization request.");
    let operation = body["operationId"].as_str().ok_or_else(invalid)?;
    let uuid = Uuid::parse_str(operation).map_err(|_| invalid())?;
    if uuid.get_variant() != Variant::RFC4122
        || uuid.get_version_num() != 4
        || !uuid.to_string().eq_ignore_ascii_case(operation)
    {
        return Err(invalid());
    }
    let base = revision(&body["baseRevision"]).ok_or_else(invalid)?;
    let incoming = &body["snapshot"];
    let mut snapshot = normalize(incoming, false).map_err(|e| ApiError::bad(e.to_string()))?;
    let wire_version = revision(&incoming["schemaVersion"]).ok_or_else(invalid)?;
    let merge = body["mergeIndependent"] == true;
    let choice = resolution(body, merge)?;
    let wire =
        workout_wire_version(&snapshot, wire_version).map_err(|e| ApiError::bad(e.to_string()))?;
    let mut args = vec![base.into(), wire];
    if merge {
        args.push(true.into());
    }
    if let Some(choice) = &choice {
        args.push(choice.clone());
    }
    let hash = digest(&js_stringify(&Value::Array(args)));
    let receipt=db.query_row("SELECT request_hash,revision,merged FROM mealplan_receipts WHERE owner=?1 AND operation=?2",
        params![owner,operation],|r|Ok((r.get::<_,String>(0)?,r.get::<_,i64>(1)?,r.get::<_,bool>(2)?))).optional()?;
    if let Some((saved, rev, merged)) = receipt {
        if hash != saved {
            let same_old = if merge {
                false
            } else {
                let old = normalize(incoming, true)
                    .and_then(|s| workout_wire_version(&s, wire_version))
                    .map_err(|e| ApiError::bad(e.to_string()))?;
                digest(&js_stringify(&json!([base, old]))) == saved
            };
            if !same_old {
                return Err(ApiError::conflict("Operation content changed."));
            }
        }
        return Ok(reply(rev, operation, merged));
    }
    let current = db
        .query_row(
            "SELECT revision,snapshot FROM mealplan_workspaces WHERE owner=?1",
            [owner],
            |r| Ok((r.get::<_, i64>(0)?, r.get::<_, String>(1)?)),
        )
        .optional()?;
    let current_rev = current.as_ref().map_or(0, |c| c.0);
    let merged = current_rev != base;
    if choice.is_some() && !merged {
        return Err(conflict());
    }
    if merged {
        if !merge || base > current_rev {
            return Err(conflict());
        }
        let old = if base == 0 {
            None
        } else {
            let raw=db.query_row("SELECT snapshot FROM mealplan_workspace_history WHERE owner=?1 AND revision=?2",
                params![owner,base],|r|r.get::<_,String>(0)).optional()?.ok_or_else(conflict)?;
            Some(stored(db, owner, base, &raw)?)
        };
        if wire_version != SCHEMA_VERSION
            && let Some(old) = &old
        {
            preserve_workout_coaching(&mut snapshot, old).map_err(|_| conflict())?;
        }
        let choices = choice
            .as_ref()
            .filter(|v| v["revision"] == current_rev)
            .map(|v| &v["choices"]);
        let raw = &current.as_ref().ok_or_else(conflict)?.1;
        let result = merge_snapshots(
            old.as_ref(),
            &snapshot,
            &stored(db, owner, current_rev, raw)?,
            choices,
        )
        .map_err(|_| conflict())?;
        if let Some(items) = result.get("items") {
            return Err(ApiError {
                status: StatusCode::CONFLICT,
                message: "Data changed on another device.".into(),
                data: json!({"code":"workout_conflict","conflict":{"revision":current_rev,"items":items}}),
            });
        }
        snapshot = result
            .get("snapshot")
            .cloned()
            .ok_or_else(ApiError::internal)?;
    } else if wire_version != SCHEMA_VERSION
        && let Some((rev, raw)) = &current
    {
        preserve_workout_coaching(&mut snapshot, &stored(db, owner, *rev, raw)?)
            .map_err(|_| ApiError::internal())?;
    }
    let envelope = js_stringify(
        &stored_workout_envelope(&snapshot).map_err(|e| ApiError::bad(e.to_string()))?,
    );
    if envelope.len() > 4_000_000 {
        return Err(ApiError::bad("Workspace exceeds the storage limit."));
    }
    if let Some((rev, raw)) = current {
        db.execute(
            "INSERT INTO mealplan_workspace_history(owner,revision,snapshot) VALUES(?1,?2,?3)",
            params![owner, rev, raw],
        )?;
        db.execute(
            "DELETE FROM mealplan_workspace_history WHERE owner=?1 AND revision<=?2",
            params![owner, rev - HISTORY],
        )?;
    }
    let next = current_rev + 1;
    db.execute(
        "INSERT INTO mealplan_workspaces(owner,revision,snapshot) VALUES(?1,?2,?3)
        ON CONFLICT(owner) DO UPDATE SET revision=excluded.revision,snapshot=excluded.snapshot",
        params![owner, next, envelope],
    )?;
    db.execute("INSERT INTO mealplan_receipts(owner,operation,request_hash,revision,merged) VALUES(?1,?2,?3,?4,?5)",
        params![owner,operation,hash,next,merged])?;
    Ok(reply(next, operation, merged))
}
