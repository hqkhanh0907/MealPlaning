use serde_json::Value;
use std::{
    path::{Path, PathBuf},
    process::Command,
};

#[test]
#[ignore = "requires the original TypeScript checkout with npm dependencies installed"]
fn reviewed_catalogue_plans_and_examples_match_original_typescript() {
    let root = std::env::var_os("HEALTHMATE_TYPESCRIPT_ROOT")
        .map(PathBuf::from)
        .unwrap_or_else(|| Path::new(env!("CARGO_MANIFEST_DIR")).join("../.."));
    let script = r#"
const {sourceCatalogEntries}=require("./src/app/core/models/exercise-catalog.generated.ts");
const {catalogReviewedFacts}=require("./src/app/core/models/exercise-catalog.ts");
const {exerciseGuideText}=require("./src/app/core/models/exercise-guide-texts.ts");
const {SEED_TRAINING_PLANS:plans}=require("./src/app/core/models/fitness-seed.ts");
const {recommendWorkout}=require("./src/app/core/models/workout-plan-recommendation.ts");
const facts=Object.fromEntries(sourceCatalogEntries.map(entry=>{
  const f=catalogReviewedFacts(entry), g=exerciseGuideText(entry.id);
  return [entry.id,{name:g?.nameVi??entry.name,pattern:f.movementPattern,required:f.required,perSide:f.perSide,timed:g?.measure==="seconds",pairedLoad:g?.loadTotalOfTwo===true}];
}));
const names=plans.map(p=>p.name).sort((a,b)=>a.localeCompare(b,"vi"));
const seeds=plans.map(p=>({id:p.id,name:p.name,frequency:p.frequency,nameOrder:names.indexOf(p.name),days:p.days}));
const examples=JSON.parse(require("fs").readFileSync(0,"utf8")).map(c=>({name:c.name,input:c.input,expected:recommendWorkout(c.input)}));
console.log(JSON.stringify([facts,seeds,examples]));"#;
    let cases = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/workout-recommendations.json");
    let run = Command::new(root.join("node_modules/.bin/tsx"))
        .current_dir(&root)
        .args(["-e", script])
        .stdin(std::fs::File::open(cases).unwrap())
        .output()
        .expect("install the baseline checkout's npm dependencies first");
    assert!(
        run.status.success(),
        "{}",
        String::from_utf8_lossy(&run.stderr)
    );
    let actual: Vec<Value> = serde_json::from_slice(&run.stdout).unwrap();
    for (expected, actual) in [
        include_str!("../data/exercise-facts.json"),
        include_str!("../data/training-plans.json"),
        include_str!("workout-recommendations.json"),
    ]
    .into_iter()
    .zip(actual)
    {
        assert_eq!(serde_json::from_str::<Value>(expected).unwrap(), actual);
    }
}
