mod coaching;
mod merge;
mod normalize;

pub use coaching::{
    preserve_workout_coaching, restore_stored_workout, stored_workout_envelope,
    workout_wire_version,
};
pub use merge::merge_snapshots;
pub use normalize::normalize;

use serde_json::{Map, Value};
use std::{fmt, sync::OnceLock};

pub const SCHEMA_VERSION: i64 = 13;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProtocolError(String);

impl fmt::Display for ProtocolError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

impl std::error::Error for ProtocolError {}

type Result<T> = std::result::Result<T, ProtocolError>;

fn invalid(message: impl Into<String>) -> ProtocolError {
    ProtocolError(message.into())
}

struct Column {
    name: String,
    kind: String,
    required: bool,
}

struct Table {
    name: String,
    key: String,
    columns: Vec<Column>,
    references: Vec<(String, String, String)>,
}

fn schema() -> &'static [Table] {
    static SCHEMA: OnceLock<Vec<Table>> = OnceLock::new();
    SCHEMA.get_or_init(|| {
        let schema: Value =
            serde_json::from_str(include_str!("../../../server/pb_hooks/sync-schema.json"))
                .expect("valid bundled workspace schema");
        schema
            .as_object()
            .expect("schema tables")
            .iter()
            .map(|(name, spec)| {
                let required = spec["required"].as_array().expect("required columns");
                let columns = spec["cols"]
                    .as_object()
                    .expect("column definitions")
                    .iter()
                    .map(|(name, kind)| Column {
                        name: name.clone(),
                        kind: kind.as_str().expect("SQLite column type").to_owned(),
                        required: required.iter().any(|v| v.as_str() == Some(name)),
                    })
                    .collect();
                let references = spec["refs"]
                    .as_array()
                    .expect("schema references")
                    .iter()
                    .map(|r| {
                        (
                            r[0].as_str().expect("child column").to_owned(),
                            r[1].as_str().expect("parent table").to_owned(),
                            r[2].as_str().expect("parent column").to_owned(),
                        )
                    })
                    .collect();
                Table {
                    name: name.clone(),
                    key: spec["key"].as_str().expect("primary key").to_owned(),
                    columns,
                    references,
                }
            })
            .collect()
    })
}

fn rows<'a>(snapshot: &'a Value, table: &str) -> Result<&'a [Value]> {
    snapshot["tables"][table]
        .as_array()
        .map(Vec::as_slice)
        .ok_or_else(|| invalid(format!("Invalid rows: {table}")))
}

fn rows_mut<'a>(snapshot: &'a mut Value, table: &str) -> Result<&'a mut Vec<Value>> {
    snapshot
        .get_mut("tables")
        .and_then(|t| t.get_mut(table))
        .and_then(Value::as_array_mut)
        .ok_or_else(|| invalid(format!("Invalid rows: {table}")))
}

fn same_value(left: &Value, right: &Value) -> bool {
    if left.is_number() && right.is_number() {
        left.as_f64() == right.as_f64()
    } else {
        left == right
    }
}

fn truthy(value: &Value) -> bool {
    match value {
        Value::Null => false,
        Value::Bool(b) => *b,
        Value::String(s) => !s.is_empty(),
        Value::Number(n) => n.as_f64() != Some(0.),
        _ => true,
    }
}

fn numeric_key(key: &str) -> Option<u32> {
    let n: u32 = key.parse().ok()?;
    (n != u32::MAX && n.to_string() == key).then_some(n)
}

/// Uses the ECMAScript number format and key enumeration order used by stored operation receipts.
pub fn js_stringify(value: &Value) -> String {
    fn write(value: &Value, output: &mut String) {
        match value {
            Value::Null => output.push_str("null"),
            Value::Bool(b) => output.push_str(if *b { "true" } else { "false" }),
            Value::String(s) => output.push_str(&serde_json::to_string(s).expect("JSON string")),
            Value::Number(n) => {
                let number = n.as_f64().expect("finite JSON number");
                output.push_str(ryu_js::Buffer::new().format_finite(number));
            }
            Value::Array(array) => {
                output.push('[');
                for (i, item) in array.iter().enumerate() {
                    if i != 0 {
                        output.push(',');
                    }
                    write(item, output);
                }
                output.push(']');
            }
            Value::Object(obj) => {
                output.push('{');
                let mut indices: Vec<_> = obj
                    .keys()
                    .filter_map(|k| numeric_key(k).map(|n| (n, k)))
                    .collect();
                indices.sort_unstable_by_key(|(i, _)| *i);
                let keys = indices
                    .into_iter()
                    .map(|(_, k)| k)
                    .chain(obj.keys().filter(|k| numeric_key(k).is_none()));
                for (i, key) in keys.enumerate() {
                    if i != 0 {
                        output.push(',');
                    }
                    output.push_str(&serde_json::to_string(key).expect("JSON key"));
                    output.push(':');
                    write(&obj[key], output);
                }
                output.push('}');
            }
        }
    }
    let mut out = String::new();
    write(value, &mut out);
    out
}

fn canonical_number(n: f64) -> Value {
    if n.fract() == 0.0 && n.abs() <= 9_007_199_254_740_991.0 {
        Value::from(n as i64)
    } else {
        serde_json::Number::from_f64(n).map_or(Value::Null, Value::Number)
    }
}

fn object(value: &Value) -> Result<&Map<String, Value>> {
    value.as_object().ok_or_else(|| invalid("Invalid row."))
}
