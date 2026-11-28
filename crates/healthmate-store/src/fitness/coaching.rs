use super::{
    invalid, list_places, one, rows,
    sessions::{begin_session, move_detail, required_session},
};
use crate::Result;
use healthmate_domain::{
    fitness::{self, MovementSource, RecordedSet, VenuePreview},
    recommendation::expand_equipment,
};
use rusqlite::{Connection, OptionalExtension, TransactionBehavior, params};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::collections::BTreeMap;
use uuid::Uuid;

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkoutVenuePreview {
    #[serde(flatten)]
    pub preview: VenuePreview,
    pub place_name: Option<String>,
}

fn movement(v: &Value) -> Result<MovementSource> {
    let id = v
        .as_str()
        .or_else(|| v["exerciseId"].as_str())
        .ok_or_else(|| invalid("Thiếu mã bài tập."))?;
    Ok(MovementSource {
        exercise_id: id.to_owned(),
        original_exercise_id: v["originalExerciseId"].as_str().map(str::to_owned),
    })
}
pub fn preview_movements(
    db: &Connection,
    sources: &[Value],
    place_id: Option<&str>,
) -> Result<WorkoutVenuePreview> {
    let place = if let Some(id) = place_id {
        list_places(db)?.into_iter().find(|p| p.id == id)
    } else {
        None
    };
    let equipment = place
        .as_ref()
        .and_then(|p| p.equipment.clone())
        .map(|mut v| {
            v.sort();
            v.dedup();
            v
        });
    let available = equipment.as_ref().map(|v| expand_equipment(v));
    let moves = sources.iter().map(movement).collect::<Result<Vec<_>>>()?;
    let mut rules = BTreeMap::new();
    if place_id.is_some() && !moves.is_empty() {
        let mut stmt=db.prepare("WITH rules AS (SELECT prior.original_exercise_id AS original,prior.exercise_id AS replacement,
            ROW_NUMBER() OVER (PARTITION BY prior.original_exercise_id ORDER BY s.started_at DESC,s.id DESC,prior.sort_order DESC,prior.id DESC) AS position
            FROM workout_exercise prior JOIN workout_session s ON s.id=prior.workout_session_id WHERE prior.use_at_place=1 AND s.place_id=?1
            AND s.status='completed' AND prior.original_exercise_id IS NOT NULL) SELECT original,replacement FROM rules WHERE position=1")?;
        let mut rs = stmt.query([place_id])?;
        while let Some(r) = rs.next()? {
            let (original, replacement): (String, String) = (r.get(0)?, r.get(1)?);
            if available.as_ref().is_none_or(|a| {
                fitness::exercise_facts(&replacement)
                    .and_then(|f| f.required.as_ref())
                    .is_some_and(|req| req.iter().all(|k| a.contains(k.as_str())))
            }) {
                rules.insert(original, replacement);
            }
        }
    }
    let snapshot = if sources.iter().any(|s| s.get("sets").is_some()) {
        let vals: Vec<_> = sources
            .iter()
            .map(|s| {
                ["sets", "repsMin", "repsMax", "restSeconds", "notes"].map(|k| {
                    let v = &s[k];
                    if let Some(n) = v.as_f64()
                        && v.is_f64()
                        && n.fract() == 0.0
                        && n.abs() < 9_007_199_254_740_992.0
                    {
                        return Value::from(n as i64);
                    }
                    v.clone()
                })
            })
            .collect();
        Some(serde_json::to_string(&vals)?)
    } else {
        None
    };
    Ok(WorkoutVenuePreview {
        place_name: place.map(|p| p.name),
        preview: VenuePreview {
            place_id: place_id.map(str::to_owned),
            equipment,
            prescription_snapshot: snapshot,
            movements: fitness::venue_movements(&moves, &rules),
        },
    })
}
fn set_venue(
    db: &Connection,
    session: &str,
    place: Option<&str>,
    expected: Option<&WorkoutVenuePreview>,
) -> Result<()> {
    let entries=rows(db,"SELECT id,exercise_id AS exerciseId,original_exercise_id AS originalExerciseId,planned_sets AS sets,planned_min AS repsMin,
        planned_max AS repsMax,planned_rest AS restSeconds,planned_notes AS notes FROM workout_exercise WHERE workout_session_id=?1 ORDER BY sort_order,id",[session])?;
    let plan = preview_movements(db, &entries, place)?;
    if expected.is_some_and(|e| !fitness::same_venue_preview(&e.preview, &plan.preview)) {
        return Err(invalid(
            "Nơi tập hoặc bài thay thế đã đổi. Hãy xem lại buổi tập.",
        ));
    }
    for (item, new) in entries.iter().zip(plan.preview.movements) {
        if item["exerciseId"].as_str() != Some(&new.exercise_id)
            || item["originalExerciseId"].as_str() != new.original_exercise_id.as_deref()
        {
            db.execute(
                "UPDATE workout_exercise SET exercise_id=?1,original_exercise_id=?2 WHERE id=?3",
                params![
                    new.exercise_id,
                    new.original_exercise_id,
                    item["id"].as_str()
                ],
            )?;
        }
    }
    Ok(())
}
pub fn start_guided_session(
    db: &mut Connection,
    day: &str,
    date: &str,
    now_iso: &str,
    place: Option<&str>,
) -> Result<Value> {
    begin_session(db, false, |tx, id| {
        let name: String = tx
            .query_row(
                "SELECT name FROM training_plan_day WHERE id=?1 AND is_rest_day=0",
                [day],
                |r| r.get(0),
            )
            .optional()?
            .ok_or_else(|| invalid("Chọn một ngày có bài tập trong giáo án."))?;
        tx.execute("INSERT INTO workout_session(id,date,training_plan_day_id,training_day_name,mode,origin,place_id,started_at)
            VALUES(?1,?2,?3,?4,'guided','plan_day',?5,?6)",params![id,date,day,name,place,now_iso])?;
        tx.execute("INSERT INTO workout_exercise(id,workout_session_id,exercise_id,sort_order,planned_sets,planned_min,planned_max,planned_rest,planned_notes)
            SELECT ?1||':'||id,?1,exercise_id,sort_order,sets,reps_min,reps_max,rest_seconds,notes FROM planned_exercise WHERE training_plan_day_id=?2",params![id,day])?;
        if place.is_some() {
            set_venue(tx, id, place, None)?;
        }
        Ok(())
    })
}
pub fn start_composed_session(
    db: &mut Connection,
    exercises: &[Value],
    date: &str,
    now_iso: &str,
    place: Option<&str>,
    expected: Option<&WorkoutVenuePreview>,
) -> Result<Value> {
    if exercises.is_empty() {
        return Err(invalid("Buổi gợi ý cần có ít nhất một bài."));
    }
    begin_session(db, expected.is_some(), |tx, id| {
        tx.execute(
            "INSERT INTO workout_session(id,date,training_day_name,mode,origin,place_id,started_at)
            VALUES(?1,?2,'Buổi gợi ý','free','composed',?3,?4)",
            params![id, date, place, now_iso],
        )?;
        for (i, e) in exercises.iter().enumerate() {
            let x = movement(e)?;
            tx.execute("INSERT INTO workout_exercise(id,workout_session_id,exercise_id,sort_order,planned_sets,planned_min,planned_max,planned_rest,planned_notes)
                VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9)",params![Uuid::new_v4().to_string(),id,x.exercise_id,i as i64,e["sets"].as_f64(),e["repsMin"].as_f64(),
                    e["repsMax"].as_f64(),e["restSeconds"].as_f64(),e["notes"].as_str()])?;
        }
        if place.is_some() || expected.is_some() {
            set_venue(tx, id, place, expected)?;
        }
        Ok(())
    })
}
pub fn replay_session(
    db: &mut Connection,
    source: &str,
    date: &str,
    now_iso: &str,
    place: Option<&str>,
    expected: Option<&WorkoutVenuePreview>,
) -> Result<Value> {
    begin_session(db, expected.is_some(), |tx, id| {
        let changed=tx.execute("INSERT INTO workout_session(id,date,training_day_name,mode,origin,place_id,source_session_id,started_at)
            SELECT ?1,?2,COALESCE(training_day_name,'Tập tự do'),'free',COALESCE(origin,'free'),?3,id,?4 FROM workout_session WHERE id=?5 AND mode='free' AND status='completed'",
            params![id,date,place,now_iso,source])?;
        if changed == 0 {
            return Err(invalid(
                "Chọn buổi tự do hoặc buổi gợi ý đã hoàn thành để tập lại.",
            ));
        }
        for (i, x) in rows(
            tx,
            "SELECT id FROM workout_exercise WHERE workout_session_id=?1 ORDER BY sort_order,id",
            [source],
        )?
        .iter()
        .enumerate()
        {
            tx.execute("INSERT INTO workout_exercise(id,workout_session_id,exercise_id,sort_order,planned_sets,planned_min,planned_max,planned_rest,planned_notes,original_exercise_id)
                SELECT ?1,?2,exercise_id,?3,planned_sets,planned_min,planned_max,planned_rest,planned_notes,original_exercise_id FROM workout_exercise WHERE id=?4",
                params![Uuid::new_v4().to_string(),id,i as i64,x["id"].as_str()])?;
        }
        if place.is_some() || expected.is_some() {
            set_venue(tx, id, place, expected)?;
        }
        Ok(())
    })
}
pub fn replace_movement(
    db: &mut Connection,
    id: &str,
    replacement: &str,
    at_place: bool,
) -> Result<Value> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let row=one(&tx,"SELECT we.workout_session_id,we.exercise_id,we.original_exercise_id,s.place_id FROM workout_exercise we JOIN workout_session s ON s.id=we.workout_session_id
        WHERE we.id=?1 AND s.status='active'",[id])?.filter(|v|v["exercise_id"]!=replacement && (!at_place||v["place_id"].as_str().is_some_and(|p|!p.is_empty())))
        .ok_or_else(||invalid("Kiểm tra bài và nơi tập trước khi đổi."))?;
    let session = row["workout_session_id"]
        .as_str()
        .ok_or_else(|| invalid("Thiếu buổi tập."))?;
    let duplicate:bool=tx.query_row("SELECT EXISTS(SELECT 1 FROM workout_exercise WHERE workout_session_id=?1 AND exercise_id=?2)",params![session,replacement],|r|r.get(0))?;
    if duplicate {
        return Err(invalid("Buổi này đã có bài thay thế."));
    }
    let count: i64 = tx.query_row(
        "SELECT COUNT(*) FROM workout_set WHERE workout_exercise_id=?1",
        [id],
        |r| r.get(0),
    )?;
    let original = row["original_exercise_id"]
        .as_str()
        .or_else(|| row["exercise_id"].as_str());
    let rule = at_place.then_some(1);
    if count > 0 {
        tx.execute("INSERT INTO workout_exercise(id,workout_session_id,exercise_id,sort_order,original_exercise_id,use_at_place,planned_sets,planned_min,planned_max,planned_rest)
        SELECT ?1,workout_session_id,?2,(SELECT MAX(sort_order)+1 FROM workout_exercise WHERE workout_session_id=?3),?4,?5,MAX(0,planned_sets-?6),planned_min,planned_max,planned_rest FROM workout_exercise WHERE id=?7",
        params![Uuid::new_v4().to_string(),replacement,session,original,rule,count,id])?;
    } else {
        tx.execute("UPDATE workout_exercise SET exercise_id=?1,original_exercise_id=?2,use_at_place=?3 WHERE id=?4",params![replacement,original,rule,id])?;
    }
    let result = required_session(&tx, session)?;
    tx.commit()?;
    Ok(result)
}
pub fn last_sets(db: &Connection, place: Option<&str>) -> Result<Vec<Value>> {
    rows(db,"WITH entries AS (SELECT we.exercise_id,s.place_id,s.date,ws.weight_kg,ws.reps,ws.duration_seconds,we.next_weight_kg,
        ROW_NUMBER() OVER (PARTITION BY we.exercise_id ORDER BY s.completed_at DESC,ws.set_number DESC,ws.id DESC) AS position FROM workout_set ws
        JOIN workout_exercise we ON we.id=ws.workout_exercise_id JOIN workout_session s ON s.id=we.workout_session_id JOIN exercise e ON e.id=we.exercise_id
        WHERE s.status='completed' AND ws.status='logged' AND ws.legacy_unit_unknown=0 AND
        (lower(coalesce(e.equipment,'')) NOT LIKE '%machine%' AND lower(coalesce(e.equipment,'')) NOT LIKE '%cable%' OR s.place_id=?1))
        SELECT exercise_id,place_id,date,weight_kg,reps,duration_seconds,next_weight_kg FROM entries WHERE position=1",[place])
}
pub fn record_completion_note(db: &Connection, id: &str, note: &str) -> Result<()> {
    let note = note.trim();
    if note.is_empty() || note.encode_utf16().count() > 300 {
        return Err(invalid("Ghi lý do trong 300 ký tự."));
    }
    db.execute("UPDATE workout_exercise SET completion_note=?1 WHERE id=?2 AND workout_session_id IN(SELECT id FROM workout_session WHERE status='completed')",params![note,id])?;
    Ok(())
}
pub(super) fn recorded(mut set: Value) -> Result<RecordedSet> {
    set["legacy_unit_unknown"] = Value::Bool(set["legacy_unit_unknown"] == 1);
    Ok(serde_json::from_value(set)?)
}
fn progression(ex: &Value) -> Result<Option<f64>> {
    let sets = ex["sets"]
        .as_array()
        .ok_or_else(|| invalid("Thiếu dữ liệu hiệp."))?
        .iter()
        .cloned()
        .map(recorded)
        .collect::<Result<Vec<_>>>()?;
    Ok(fitness::progression_load(
        ex["exercise_id"].as_str().unwrap_or(""),
        ex["planned_max"].as_u64().and_then(|v| v.try_into().ok()),
        ex["planned_sets"].as_u64().and_then(|v| v.try_into().ok()),
        &sets,
    ))
}
pub fn confirm_next_load(db: &mut Connection, id: &str, kg: Option<f64>) -> Result<()> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let ex = move_detail(&tx, id)?.ok_or_else(|| invalid("Không tìm thấy bài tập."))?;
    let completed: bool = tx.query_row(
        "SELECT EXISTS(SELECT 1 FROM workout_session WHERE id=?1 AND status='completed')",
        [ex["workout_session_id"].as_str()],
        |r| r.get(0),
    )?;
    if !fitness::valid_next_load(completed, progression(&ex)?, kg) {
        return Err(invalid("Kiểm tra mức tăng và các hiệp đã ghi."));
    }
    tx.execute(
        "UPDATE workout_exercise SET next_weight_kg=?1 WHERE id=?2",
        params![kg, id],
    )?;
    tx.commit()?;
    Ok(())
}
pub fn completion_summary(db: &Connection, id: &str) -> Result<Option<Value>> {
    super::read_consistently(db, |db| completed_detail(db, id))
}

fn completed_detail(db: &Connection, id: &str) -> Result<Option<Value>> {
    let Some(mut session) = super::get_session(db, id)? else {
        return Ok(None);
    };
    if let Some(place) = session["place_id"].as_str().map(str::to_owned)
        && let Some(exercises) = session["exercises"].as_array_mut()
    {
        for ex in exercises {
            if let Some(last) = progression(ex)? {
                let kg:Option<f64>=db.query_row("SELECT MIN(ws.weight_kg) FROM workout_set ws JOIN workout_exercise we ON we.id=ws.workout_exercise_id
                    JOIN workout_session s ON s.id=we.workout_session_id WHERE s.id<>?1 AND s.status='completed' AND s.place_id=?2 AND we.exercise_id=?3
                    AND ws.status='logged' AND ws.legacy_unit_unknown=0 AND ws.duration_seconds IS NULL AND ws.weight_kg>?4",
                    params![id,place,ex["exercise_id"].as_str(),last],|r|r.get(0))?;
                ex["known_heavier_kg"] = json!(kg);
            }
        }
    }
    Ok(Some(session))
}
