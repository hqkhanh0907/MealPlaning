use healthmate_domain::dashboard_presentation::{DashboardInput, present};
use serde::Deserialize;
use serde_json::Value;
use std::process::Command;

#[derive(Deserialize)]
struct Example {
    name: String,
    input: DashboardInput,
    expected: Value,
}

const EXAMPLES: &str = include_str!("dashboard_presentation.jsonl");

fn javascript_numbers(value: &mut Value) {
    match value {
        Value::Number(n) => *value = Value::from(n.as_f64().unwrap()),
        Value::Array(items) => items.iter_mut().for_each(javascript_numbers),
        Value::Object(fields) => fields.values_mut().for_each(javascript_numbers),
        _ => {}
    }
}

#[test]
fn calculated_values_match_the_original_dashboard_store() {
    let mut total = 0;
    for line in EXAMPLES.lines() {
        let mut example: Example = serde_json::from_str(line).unwrap();
        let mut actual = serde_json::to_value(present(&example.input)).unwrap();
        javascript_numbers(&mut actual);
        javascript_numbers(&mut example.expected);
        assert_eq!(actual, example.expected, "{}", example.name);
        total += 1;
    }
    assert!(total >= 30);
}

#[test]
#[ignore = "regenerates using the original Angular dependencies"]
fn reference_outputs_still_match_the_angular_store() {
    let script = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/tests/dashboard_presentation_oracle.cjs"
    );
    let result = Command::new("node").arg(script).output().expect("Node.js");
    assert!(
        result.status.success(),
        "{}",
        String::from_utf8_lossy(&result.stderr)
    );
    let values = |s: &str| {
        s.lines()
            .map(|line| serde_json::from_str::<Value>(line).unwrap())
            .collect::<Vec<_>>()
    };
    assert_eq!(
        values(EXAMPLES),
        values(std::str::from_utf8(&result.stdout).unwrap())
    );
}

#[test]
fn persisted_integer_headlines_decode_in_the_existing_renderer() {
    let example: Example = serde_json::from_str(EXAMPLES.lines().nth(1).unwrap()).unwrap();
    let wire = serde_json::to_value(present(&example.input)).unwrap();
    assert_eq!(wire["loggedCalories"].as_i64(), Some(715));
    assert_eq!(wire["roundedCalories"].as_i64(), Some(2346));
}
