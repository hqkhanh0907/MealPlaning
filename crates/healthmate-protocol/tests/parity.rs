use healthmate_protocol::*;
use serde_json::{Value, json};
use std::process::Command;

#[test]
fn matches_existing_workspace_implementation() {
    let script = concat!(env!("CARGO_MANIFEST_DIR"), "/tests/legacy-oracle.cjs");
    let output = Command::new("node")
        .arg(script)
        .output()
        .expect("Node.js runs the reference implementation");
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let mut count = 0;
    for line in String::from_utf8(output.stdout).unwrap().lines() {
        let case: Value = serde_json::from_str(line).unwrap();
        let args = case["args"].as_array().unwrap();
        let got = match case["operation"].as_str().unwrap() {
            "normalize" => normalize(&args[0], args[1].as_bool().unwrap()),
            "wire" => workout_wire_version(&args[0], args[1].as_i64().unwrap()),
            "envelope" => stored_workout_envelope(&args[0]),
            "restore" => restore_stored_workout(&args[0]),
            "preserve" => {
                let mut result = args[0].clone();
                preserve_workout_coaching(&mut result, &args[1]).map(|()| result)
            }
            "merge" => merge_snapshots(
                (!args[0].is_null()).then_some(&args[0]),
                &args[1],
                &args[2],
                (!args[3].is_null()).then_some(&args[3]),
            ),
            "stringify" => Ok(Value::String(js_stringify(&args[0]))),
            unknown => panic!("unknown test operation: {unknown}"),
        };
        match got {
            Ok(value) => assert_eq!(
                Some(js_stringify(&value).as_str()),
                case["result"].as_str(),
                "{}",
                case["name"]
            ),
            Err(error) => assert_eq!(
                Some(error.to_string().as_str()),
                case["error"].as_str(),
                "{}",
                case["name"]
            ),
        }
        count += 1;
    }
    assert!(count >= 60);
}

#[test]
fn returns_errors_for_malformed_tables_without_unwinding() {
    for value in [
        Value::Null,
        json!(7),
        json!({"tables":false}),
        json!({"schemaVersion":13,"tables":{}}),
    ] {
        assert!(normalize(&value, false).is_err());
        assert!(restore_stored_workout(&value).is_err());
        assert!(stored_workout_envelope(&value).is_err());
    }
}

#[test]
fn javascript_numbers_and_canonical_keys_are_stable_for_receipts() {
    let value: Value =
        serde_json::from_str(r#"{"z":1.0,"2":1e-7,"0":-0.0,"s":"đ","x":1e20,"n":1e21}"#).unwrap();
    assert_eq!(
        js_stringify(&value),
        r#"{"0":0,"2":1e-7,"z":1,"s":"đ","x":100000000000000000000,"n":1e+21}"#
    );
}
