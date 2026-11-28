const protocol = require("../../../server/tests/pocketbase/pb_hooks/snapshot.js");
const schema = require("../../../schema/workspace.json");

function fresh() {
  return {schemaVersion: 13, tables: Object.fromEntries(Object.keys(schema).map(t => [t, []]))};
}

function row(table, id, properties = {}) {
  const {key, cols, required} = schema[table];
  const value = Object.fromEntries(Object.entries(cols).map(([field, type]) =>
    [field, required.includes(field) ? type === "TEXT" ? "text" : 1 : null]));
  return {...value, [key]: id, ...properties};
}

function workout() {
  const s = fresh();
  s.tables.exercise.push(row("exercise", "press", {name: "Press", name_vi: "Đẩy ngực"}));
  s.tables.workout_session.push(row("workout_session", "session", {date: "2026-11-27", mode: "free", origin: "composed", place_id: "gym"}));
  s.tables.workout_exercise.push(row("workout_exercise", "entry", {workout_session_id: "session", exercise_id: "press", use_at_place: 1, next_weight_kg: 42.5}));
  s.tables.workout_set.push(row("workout_set", "set", {
    workout_exercise_id: "entry", status: "logged", weight_kg: 40, reps: 6,
    legacy_unit_unknown: 0, set_number: 1, updated_at: "2026-11-27",
  }));
  s.tables.workout_preference.push(row("workout_preference", "fitness_exercise_place:gym", {value: '{"name":"Gym"}'}));
  return protocol.normalize(s);
}

const evaluate = {
  normalize: ([s, legacy]) => protocol.normalize(s, legacy),
  wire: ([s, version]) => protocol.workoutWireVersion(s, version),
  envelope: ([s]) => protocol.storedWorkoutEnvelope(s),
  restore: ([s]) => protocol.restoreStoredWorkout(s),
  preserve: ([s, base]) => { protocol.preserveWorkoutCoaching(s, base); return s; },
  merge: ([base, own, other, choices]) => protocol.mergeSnapshots(base, own, other, choices),
  stringify: ([s]) => JSON.stringify(s),
};

function check(name, operation, ...parameters) {
  const args = structuredClone(parameters);
  let result, error;
  try {result = JSON.stringify(evaluate[operation](structuredClone(args)));}
  catch (cause) {error = cause.message;}
  process.stdout.write(JSON.stringify({name, operation, args, result, error})+"\n");
}

function edited(start, fn) {
  const copy = structuredClone(start);
  fn(copy.tables);
  return copy;
}

const present = workout();
const legacy = protocol.workoutWireVersion(present, 12);
const envelope = protocol.storedWorkoutEnvelope(present);
check("empty", "normalize", fresh(), false);
check("normalized", "normalize", present, false);
check("schema12", "normalize", legacy, false);
check("wire12", "wire", present, 12);
check("wire13", "wire", present, 13);
check("bad wire", "wire", present, 0);
check("stored extension", "envelope", present);
check("restored extension", "restore", envelope);
check("stored without extension", "restore", legacy);
check("schema13 storage", "restore", present);
check("empty stored preference", "restore", {...envelope, workoutCoaching13: {...envelope.workoutCoaching13, workout_preference: null}});
check("extension fields revalidated", "restore", {...envelope, workoutCoaching13: {...envelope.workoutCoaching13, workout_exercise: [{id:"entry",use_at_place:4}]}});
check("legacy may not smuggle new column", "normalize", edited(legacy,t=>t.workout_session[0].origin=null), false);
check("legacy may not add preference table", "normalize", edited(legacy,t=>t.workout_preference=[]), false);
check("version unsupported", "normalize", {schemaVersion:14,tables:{}}, false);
check("missing tables", "normalize", {schemaVersion:13,tables:false}, false);
check("missing table", "normalize", edited(present,t=>delete t.dish), false);
check("huge table", "normalize", edited(present,t=>t.weight_log=Array(16001).fill(null)), false);
check("missing field", "normalize", edited(present,t=>delete t.exercise[0].instructions), false);
check("replaced field", "normalize", edited(present,t=>{delete t.exercise[0].instructions;t.exercise[0].extra=null;}), false);
check("optional null fields", "normalize", edited(present,t=>t.workout_exercise[0].use_at_place=null), false);
check("missing required", "normalize", edited(present,t=>t.workout_set[0].status=null), false);
check("invalid numeric type", "normalize", edited(present,t=>t.workout_set[0].weight_kg="40"), false);
check("unsafe integer", "normalize", edited(present,t=>t.workout_set[0].reps=9007199254740992), false);
check("fractional integer", "normalize", edited(present,t=>t.workout_set[0].reps=0.125), false);
check("duplicate identifier", "normalize", edited(present,t=>t.workout_set.push({...t.workout_set[0]})), false);
check("long identity UTF16", "normalize", edited(present,t=>t.exercise[0].id="🦀".repeat(65)),false);
check("long text UTF16", "normalize", edited(present,t=>t.exercise[0].name="🦀".repeat(16385)),false);
check("missing FK", "normalize", edited(present,t=>t.workout_set[0].workout_exercise_id="absent"), false);
check("one profile", "normalize", edited(present,t=>t.user_profile.push(row("user_profile","one"),row("user_profile","two"))),false);
check("preference key", "normalize", edited(present,t=>t.workout_preference[0].key="unrecognized"),false);
check("preference line separator", "normalize", edited(present,t=>t.workout_preference[0].key="fitness_exercise_place:g\u2028m"),false);
check("UTF16 sort + numeric format", "normalize", edited(present,t=>{
    t.weight_log.push(...["\uE000", "🦀","10","2","🦆"].map((id,i)=>row("weight_log",id,{weight_kg:[1e-7,1e-6,1e20,1e21,-0][i]})));
}),false);
check("calendar duplicate", "normalize", edited(present,t=>t.day_plan.push(row("day_plan","a"),row("day_plan","b"))), false);
const meal = edited(present,t=>{
    t.day_plan.push(row("day_plan","day"));
    t.meal_slot.push(row("meal_slot","slot",{day_plan_id:"day"}));
    t.dish.push(row("dish","dish"));
    t.planned_dish.push(row("planned_dish","meal",{meal_slot_id:"slot",dish_id:"dish", is_completed:1,completed_at:"yes",calories:42.31,protein:3,carbs:0,fat:0.1,fiber:1}));
});
check("meal frozen", "normalize",meal,false);
check("meal range", "normalize",edited(meal,t=>t.planned_dish[0].servings=0.05),false);
check("missing completed values", "normalize",edited(meal,t=>t.planned_dish[0].protein=null),false);
check("duplicate slots", "normalize",edited(meal,t=>t.meal_slot.push({...t.meal_slot[0],id:"other"})),false);
for (const [label,mod] of [
  ["negative load", r=>r.weight_kg=-1],
  ["negative reps", r=>r.reps=-1],
  ["unknown status", r=>r.status="done"],
  ["skipped",r=>r.status="skipped"],
  ["timed",r=>r.duration_seconds=30],
  ["legacy units",r=>r.legacy_unit_unknown=1],
]) {
  const s=edited(present,t=>mod(t.workout_set[0]));
  check(label,"normalize",s,false);check(label+" old totals","normalize",s,true);
}
check("invalid coaching load", "normalize",edited(present,t=>t.workout_exercise[0].next_weight_kg=501),false);
check("invalid origin", "normalize",edited(present,t=>t.workout_session[0].origin="other"),false);
const oldClient=protocol.normalize(legacy);
check("older client coaching", "preserve",oldClient,present);
check("older client changed reps clears target","preserve",edited(oldClient,t=>t.workout_set[0].reps=7),present);
check("older client deleted sets clears target","preserve",edited(oldClient,t=>t.workout_set=[]),present);
check("older client adds set clears target","preserve",edited(oldClient,t=>t.workout_set.push({...t.workout_set[0],id:"second"})),present);
check("only note changed retains target","preserve",edited(oldClient,t=>t.workout_set[0].notes="note"),present);
const substitute=edited(present,t=>{t.exercise.push(row("exercise","other"));t.workout_exercise[0].original_exercise_id="other";});
check("missing substitute drops place flag", "preserve",oldClient,substitute);
check("replacement exercise skips prior coaching", "preserve",edited(oldClient,t=>{t.exercise.push(row("exercise","other")); t.workout_exercise[0].exercise_id="other";}),present);
check("no previous state", "preserve",oldClient,null);
const local=edited(present,t=>Object.assign(t.workout_set[0],{reps:7,weight_kg:41,updated_at:"2026-11-29"}));
const remote=edited(present,t=>Object.assign(t.workout_set[0],{reps:9,weight_kg:42,updated_at:"2026-11-28"}));
const weightKey=JSON.stringify(["workout_set","set","weight_kg"]);
const repsKey=JSON.stringify(["workout_set","set","reps"]);
check("overlapping measurements","merge",present,local,remote,null);
check("partially resolved","merge",present,local,remote,{[weightKey]:"local"});
check("both choices","merge",present,local,remote,{[weightKey]:"server",[repsKey]:"local"});
check("extraneous choice","merge",present,local,remote,{[weightKey]:"server",[repsKey]:"local",alien:"local"});
check("independent changed columns","merge",present,edited(present,t=>t.workout_set[0].weight_kg=43),edited(present,t=>t.workout_set[0].reps=10),null);
check("ignored timestamp","merge",present,edited(present,t=>t.workout_set[0].updated_at="other"),present,null);
check("new same data","merge",null,present,present,null);
check("incompatible status","merge",present,edited(present,t=>t.workout_set[0].status="skipped"),remote,null);
check("incompatible duration","merge",present,edited(present,t=>t.workout_set[0].duration_seconds=1),remote,null);
check("incompatible row","merge",present,edited(present,t=>t.exercise[0].name="n1"),edited(present,t=>t.exercise[0].name="n2"),null);
check("set deletion against changed","merge",present,edited(present,t=>t.workout_set=[]),remote,null);
const deleted=edited(present,t=>{t.workout_session=[];t.workout_exercise=[];t.workout_set=[];});
const sessionKey=JSON.stringify(["workout_session","session"]);
check("whole workout deletion conflict","merge",present,deleted,protocol.normalize(remote),null);
check("keep deleted workout","merge",present,deleted,protocol.normalize(remote),{[sessionKey]:"local"});
check("keep server workout","merge",present,deleted,protocol.normalize(remote),{[sessionKey]:"server"});
check("uncontested delete","merge",present,deleted,present,null);
check("timestamp UTF16 ordering", "merge",present,edited(present,t=>Object.assign(t.workout_set[0],{weight_kg:41,updated_at:"🦀"})),edited(present,t=>Object.assign(t.workout_set[0],{reps:10,updated_at:"\uE000"})),null);
check("JSON number/string/key canonicalization","stringify",{"4294967295":"not index","4294967294":0,"0":"z",b:[1e-6,1e-7,1e20,1e21,0.12345678901234567],a:"\u2028/\n\u0001"});
