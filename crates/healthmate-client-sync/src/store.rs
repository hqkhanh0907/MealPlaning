use crate::{Error, Result};
use healthmate_protocol::{SCHEMA_VERSION, js_stringify, normalize};
use indexmap::IndexSet;
use rusqlite::{
    Connection, OpenFlags, OptionalExtension, Transaction, TransactionBehavior, params,
    params_from_iter,
    types::{Value as SqlValue, ValueRef},
};
use serde_json::{Map, Value, json};
use std::{collections::HashMap, path::Path, sync::OnceLock, time::Duration};
use uuid::Uuid;

struct Table {
    name: String,
    key: String,
    cols: Vec<String>,
    select: String,
    insert: String,
}

fn schema() -> &'static [Table] {
    static TABLES: OnceLock<Vec<Table>> = OnceLock::new();
    TABLES.get_or_init(|| {
        let def: Value =
            serde_json::from_str(include_str!("../../../server/pb_hooks/sync-schema.json"))
                .expect("workspace schema");
        def.as_object()
            .expect("table definitions")
            .iter()
            .map(|(name, body)| {
                let key = body["key"].as_str().expect("identity column");
                let cols: Vec<_> = body["cols"]
                    .as_object()
                    .expect("column definitions")
                    .keys()
                    .cloned()
                    .collect();
                let csv = cols
                    .iter()
                    .map(|c| format!("\"{c}\""))
                    .collect::<Vec<_>>()
                    .join(",");
                let placeholders = vec!["?"; cols.len()].join(",");
                Table {
                    name: name.clone(),
                    key: key.into(),
                    select: format!("SELECT {csv} FROM \"{name}\" ORDER BY \"{key}\""),
                    insert: format!("INSERT INTO \"{name}\"({csv}) VALUES({placeholders})"),
                    cols,
                }
            })
            .collect()
    })
}

#[derive(Clone)]
pub(crate) struct Pending {
    pub raw: String,
    pub request: Value,
    pub version: i64,
}
impl Pending {
    pub fn id(&self) -> Result<&str> {
        self.request["operationId"]
            .as_str()
            .ok_or(Error::InvalidData)
    }
}
pub(crate) struct State {
    pub revision: i64,
    pub change: i64,
    pub clean: i64,
    pub pending: Option<Pending>,
}
impl State {
    pub fn dirty(&self) -> bool {
        self.change != self.clean || self.pending.is_some()
    }
}

fn read(db: &Connection) -> Result<State> {
    let row=db.query_row("SELECT revision,change_version,clean_version,pending,pending_version FROM sync_workspace WHERE id=1",[],
        |r|Ok((r.get::<_,i64>(0)?,r.get::<_,i64>(1)?,r.get::<_,i64>(2)?,r.get::<_,Option<String>>(3)?,r.get::<_,Option<i64>>(4)?))).optional()?.ok_or(Error::DatabaseNotReady)?;
    let pending = match row.3 {
        None => None,
        Some(raw) => Some(Pending {
            request: serde_json::from_str(&raw)?,
            raw,
            version: row.4.ok_or(Error::InvalidData)?,
        }),
    };
    Ok(State {
        revision: row.0,
        change: row.1,
        clean: row.2,
        pending,
    })
}

fn snapshot(db: &Connection) -> Result<Value> {
    let mut tables = Map::new();
    for t in schema() {
        let mut query = db.prepare(&t.select)?;
        let mut cursor = query.query([])?;
        let mut all = Vec::new();
        while let Some(row) = cursor.next()? {
            let mut output = Map::with_capacity(t.cols.len());
            for (i, column) in t.cols.iter().enumerate() {
                let value = match row.get_ref(i)? {
                    ValueRef::Null => Value::Null,
                    ValueRef::Integer(n) => n.into(),
                    ValueRef::Real(n) => serde_json::Number::from_f64(n)
                        .map(Value::Number)
                        .ok_or(Error::InvalidData)?,
                    ValueRef::Text(s) => std::str::from_utf8(s)
                        .map_err(|_| Error::InvalidData)?
                        .into(),
                    ValueRef::Blob(_) => return Err(Error::InvalidData),
                };
                output.insert(column.clone(), value);
            }
            all.push(Value::Object(output));
        }
        tables.insert(t.name.clone(), Value::Array(all));
    }
    Ok(json!({"schemaVersion":SCHEMA_VERSION,"tables":tables}))
}

fn sql_value(v: &Value) -> Result<SqlValue> {
    Ok(match v {
        Value::Null => SqlValue::Null,
        Value::String(s) => SqlValue::Text(s.clone()),
        Value::Number(n) => match n.as_i64() {
            Some(i) => SqlValue::Integer(i),
            None => SqlValue::Real(n.as_f64().ok_or(Error::InvalidData)?),
        },
        _ => return Err(Error::InvalidData),
    })
}

fn replace(tx: &Transaction, remote: &Value) -> Result<()> {
    if remote["schemaVersion"].as_f64() != Some(SCHEMA_VERSION as f64) {
        return Err(Error::Incompatible);
    }
    let clean = normalize(remote, false)?;
    for t in schema().iter().rev() {
        tx.execute(&format!("DELETE FROM \"{}\"", t.name), [])?;
    }
    for t in schema() {
        let mut insert = tx.prepare(&t.insert)?;
        let rows = clean["tables"][&t.name]
            .as_array()
            .ok_or(Error::InvalidData)?;
        for row in rows {
            let values: Vec<_> = t
                .cols
                .iter()
                .map(|c| sql_value(&row[c]))
                .collect::<Result<_>>()?;
            insert.execute(params_from_iter(values))?;
        }
    }
    Ok(())
}

fn index<'a>(s: &'a Value, t: &Table) -> Result<HashMap<&'a str, &'a Value>> {
    s["tables"][&t.name]
        .as_array()
        .ok_or(Error::InvalidData)?
        .iter()
        .map(|r| {
            r[&t.key]
                .as_str()
                .map(|id| (id, r))
                .ok_or(Error::InvalidData)
        })
        .collect::<Result<_>>()
}

fn row_same(t: &Table, left: Option<&&Value>, right: Option<&&Value>) -> bool {
    let (Some(a), Some(b)) = (left, right) else {
        return left.is_none() && right.is_none();
    };
    t.cols.iter().all(|c| {
        if c == "total_volume" && matches!(t.name.as_str(), "workout_session" | "workout_exercise")
        {
            return true;
        }
        let x = &a[c];
        let y = &b[c];
        if x.is_number() && y.is_number() {
            x.as_f64() == y.as_f64()
        } else {
            x == y
        }
    })
}

fn rebase(base: &Value, local: &Value, remote: &Value) -> Result<Value> {
    let base = normalize(base, false)?;
    let local = normalize(local, false)?;
    let remote = normalize(remote, false)?;
    let mut tables = Map::new();
    for t in schema() {
        let b = index(&base, t)?;
        let l = index(&local, t)?;
        let r = index(&remote, t)?;
        let keys: IndexSet<_> = [&remote, &local, &base]
            .into_iter()
            .flat_map(|s| s["tables"][&t.name].as_array().into_iter().flatten())
            .filter_map(|row| row[&t.key].as_str())
            .collect();
        let mut rows = Vec::new();
        for id in keys {
            let (before, here, there) = (b.get(id), l.get(id), r.get(id));
            let chosen = if row_same(t, before, here) {
                there
            } else if row_same(t, before, there) || row_same(t, here, there) {
                here
            } else {
                return Err(Error::WorkspaceConflict);
            };
            if let Some(row) = chosen {
                rows.push((*row).clone());
            }
        }
        tables.insert(t.name.clone(), Value::Array(rows));
    }
    Ok(normalize(
        &json!({"schemaVersion":SCHEMA_VERSION,"tables":tables}),
        false,
    )?)
}

pub(crate) struct Store(Connection);
impl Store {
    pub fn open(path: &Path) -> Result<Self> {
        if !path.is_file() {
            return Err(Error::DatabaseNotReady);
        }
        let db = Connection::open_with_flags(path, OpenFlags::SQLITE_OPEN_READ_WRITE)?;
        db.busy_timeout(Duration::from_secs(5))?;
        db.pragma_update(None, "foreign_keys", true)?;
        let version: i64 = db.pragma_query_value(None, "user_version", |r| r.get(0))?;
        let ready:bool=db.query_row("SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='sync_workspace')",[],|r|r.get(0))?;
        if version != SCHEMA_VERSION || !ready {
            return Err(Error::DatabaseNotReady);
        }
        Ok(Self(db))
    }

    pub fn state(&self) -> Result<State> {
        read(&self.0)
    }

    pub fn prepare(&mut self) -> Result<Option<Pending>> {
        let tx = self
            .0
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let state = read(&tx)?;
        if state.pending.is_some() || !state.dirty() {
            return Ok(state.pending);
        }
        let request = json!({"operationId":Uuid::new_v4().to_string(),"baseRevision":state.revision,
            "snapshot":snapshot(&tx)?,"mergeIndependent":true});
        let raw = js_stringify(&request);
        tx.execute(
            "UPDATE sync_workspace SET pending=?1,pending_version=?2 WHERE id=1",
            params![raw, state.change],
        )?;
        tx.commit()?;
        Ok(Some(Pending {
            raw,
            request,
            version: state.change,
        }))
    }

    pub fn choose(&mut self, id: &str, revision: i64, choices: &Value) -> Result<()> {
        let tx = self
            .0
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let state = read(&tx)?;
        let Some(mut pending) = state.pending else {
            return Ok(());
        };
        if pending.id()? != id {
            return Ok(());
        }
        let req = pending.request.as_object_mut().ok_or(Error::InvalidData)?;
        req.insert("operationId".into(), Uuid::new_v4().to_string().into());
        req.shift_remove("resolution");
        if pending.version == state.change {
            req.insert(
                "resolution".into(),
                json!({"revision":revision,"choices":choices}),
            );
        } else {
            req.insert("snapshot".into(), snapshot(&tx)?);
        }
        tx.execute(
            "UPDATE sync_workspace SET pending=?1,pending_version=?2 WHERE id=1",
            params![js_stringify(&pending.request), state.change],
        )?;
        tx.commit()?;
        Ok(())
    }

    pub fn acknowledge(
        &mut self,
        pending: &Pending,
        revision: i64,
        remote: Option<&Value>,
    ) -> Result<()> {
        let tx = self
            .0
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let current = read(&tx)?;
        if current.pending.as_ref().map(Pending::id).transpose()? != Some(pending.id()?) {
            return Err(Error::DatabaseChanged);
        }
        if let Some(remote) = remote {
            if pending.version == current.change {
                replace(&tx, remote)?;
                mark_clean(&tx, revision)?;
                tx.commit()?;
                return Ok(());
            }
            let merged = rebase(&pending.request["snapshot"], &snapshot(&tx)?, remote)?;
            replace(&tx, &merged)?;
        }
        tx.execute("UPDATE sync_workspace SET revision=?1,clean_version=?2,pending=NULL,pending_version=NULL WHERE id=1",params![revision,pending.version])?;
        tx.commit()?;
        Ok(())
    }

    pub fn adopt(
        &mut self,
        remote: &Value,
        revision: i64,
        expected: &State,
        overwrite: bool,
    ) -> Result<()> {
        let tx = self
            .0
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let current = read(&tx)?;
        if current.change != expected.change
            || current.revision != expected.revision
            || (!overwrite && current.dirty())
        {
            return Err(Error::DatabaseChanged);
        }
        replace(&tx, remote)?;
        mark_clean(&tx, revision)?;
        tx.commit()?;
        Ok(())
    }

    pub fn keep_local(&mut self, revision: i64, expected: &State) -> Result<()> {
        let tx = self
            .0
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let current = read(&tx)?;
        if current.change != expected.change || current.revision != expected.revision {
            return Err(Error::DatabaseChanged);
        }
        tx.execute(
            "UPDATE sync_workspace SET revision=?1,pending=NULL,pending_version=NULL WHERE id=1",
            [revision],
        )?;
        tx.commit()?;
        Ok(())
    }
}

fn mark_clean(tx: &Transaction, revision: i64) -> Result<()> {
    tx.execute("UPDATE sync_workspace SET revision=?1,clean_version=change_version,pending=NULL,pending_version=NULL WHERE id=1",[revision])?;
    Ok(())
}
