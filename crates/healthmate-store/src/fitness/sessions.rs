use super::{invalid, one, rows};
use crate::Result;
use healthmate_domain::fitness::{self, Effort};
use rusqlite::{Connection, OptionalExtension, TransactionBehavior, params};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::collections::HashMap;
use uuid::Uuid;

const SESSIONS: &str = "SELECT id,date,training_plan_day_id,training_day_name,mode,total_volume,duration_minutes,started_at,completed_at,created_at,origin,place_id,source_session_id FROM workout_session";
pub(super) const MOVES:&str="SELECT we.id,we.workout_session_id,we.exercise_id,e.name AS exercise_name,e.name_vi AS exercise_name_vi,
    e.muscle_group,e.category,e.equipment,we.original_exercise_id,we.use_at_place,we.next_weight_kg,we.planned_notes,we.completion_note,
    we.planned_sets,we.planned_min,we.planned_max,we.planned_rest,we.sort_order,we.total_volume
    FROM workout_exercise we INNER JOIN exercise e ON e.id=we.exercise_id";
const SETS:&str="SELECT ws.id,ws.workout_exercise_id,ws.set_number,ws.weight_kg,ws.reps,ws.rest_seconds,ws.duration_seconds,
    ws.legacy_unit_unknown,ws.effort,ws.notes,ws.status,ws.completed_at,ws.created_at FROM workout_set ws";

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct SetInput {
    pub weight_kg: f64,
    pub reps: u32,
    pub duration_seconds: Option<u32>,
    pub rest_seconds: u32,
    pub effort: Option<Effort>,
    pub notes: Option<String>,
}
impl SetInput {
    pub fn repetitions(weight_kg: f64, reps: u32) -> Self {
        Self {
            weight_kg,
            reps,
            duration_seconds: None,
            rest_seconds: 0,
            effort: None,
            notes: None,
        }
    }
    fn validate(&self, movement: &str) -> Result<()> {
        let input = fitness::WorkoutSetInput {
            weight_kg: self.weight_kg,
            reps: self.reps.into(),
            duration_seconds: self.duration_seconds.map(f64::from),
            rest_seconds: self.rest_seconds.into(),
        };
        validate_set_measurements(movement, &input)
    }
    fn effort_text(&self) -> Option<&'static str> {
        self.effort.map(|v| match v {
            Effort::Easy => "easy",
            Effort::JustRight => "just_right",
            Effort::Hard => "hard",
            Effort::Maxed => "maxed",
        })
    }
}

pub fn validate_set_measurements(movement: &str, input: &fitness::WorkoutSetInput) -> Result<()> {
    if let Some(issue) = fitness::workout_set_issue(movement, input) {
        use fitness::SetIssue::*;
        return Err(invalid(match issue {
            Weight => "WorkoutRepository: weight must be between 0 and 500kg.",
            Duration => "Nhập thời gian tập từ 1 đến 86.400 giây.",
            Reps => "WorkoutRepository: reps must be an integer between 1 and 100.",
            Rest => "WorkoutRepository: rest_seconds must be between 0 and 600.",
        }));
    }
    Ok(())
}

fn hydrate(db: &Connection, mut session: Value) -> Result<Value> {
    let id = session["id"]
        .as_str()
        .ok_or_else(|| invalid("Missing workout id."))?;
    let mut movements = rows(
        db,
        &format!("{MOVES} WHERE we.workout_session_id=?1 ORDER BY we.sort_order,we.id"),
        [id],
    )?;
    let sets = rows(
        db,
        &format!(
            "{SETS} INNER JOIN workout_exercise we ON we.id=ws.workout_exercise_id
        WHERE we.workout_session_id=?1 ORDER BY we.sort_order,ws.set_number"
        ),
        [id],
    )?;
    let mut groups: HashMap<String, Vec<Value>> = HashMap::new();
    for set in sets {
        let key = set["workout_exercise_id"]
            .as_str()
            .ok_or_else(|| invalid("Missing workout exercise id."))?;
        groups.entry(key.to_owned()).or_default().push(set);
    }
    for movement in &mut movements {
        let id = movement["id"]
            .as_str()
            .ok_or_else(|| invalid("Missing workout exercise id."))?;
        movement["sets"] = Value::Array(groups.remove(id).unwrap_or_default());
    }
    session["exercises"] = Value::Array(movements);
    Ok(session)
}
pub fn get_session(db: &Connection, id: &str) -> Result<Option<Value>> {
    super::read_consistently(db, |db| {
        one(db, &format!("{SESSIONS} WHERE id=?1"), [id])?
            .map(|r| hydrate(db, r))
            .transpose()
    })
}
pub(super) fn required_session(db: &Connection, id: &str) -> Result<Value> {
    get_session(db, id)?.ok_or_else(|| invalid("Không đọc được buổi tập."))
}
pub fn active_session(db: &Connection) -> Result<Option<Value>> {
    super::read_consistently(db, |db| {
        one(
            db,
            &format!("{SESSIONS} WHERE status='active' ORDER BY started_at DESC LIMIT 1"),
            [],
        )?
        .map(|r| hydrate(db, r))
        .transpose()
    })
}
pub fn recent_sessions(db: &Connection, limit: usize) -> Result<Vec<Value>> {
    super::read_consistently(db, |db| {
        let sql = format!(
            "{SESSIONS} WHERE completed_at IS NOT NULL ORDER BY date DESC,completed_at DESC LIMIT ?1"
        );
        rows(db, &sql, [limit.clamp(1, 20) as i64])?
            .into_iter()
            .map(|row| hydrate(db, row))
            .collect()
    })
}
pub(super) fn move_detail(db: &Connection, id: &str) -> Result<Option<Value>> {
    let Some(mut movement) = one(db, &format!("{MOVES} WHERE we.id=?1"), [id])? else {
        return Ok(None);
    };
    movement["sets"] = Value::Array(rows(
        db,
        &format!("{SETS} WHERE ws.workout_exercise_id=?1 ORDER BY ws.set_number"),
        [id],
    )?);
    Ok(Some(movement))
}
pub(super) fn begin_session(
    db: &mut Connection,
    require_new: bool,
    create: impl FnOnce(&Connection, &str) -> Result<()>,
) -> Result<Value> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let existing: Option<String> = tx
        .query_row(
            "SELECT id FROM workout_session WHERE status='active' ORDER BY started_at DESC LIMIT 1",
            [],
            |r| r.get(0),
        )
        .optional()?;
    let id = match existing {
        Some(_) if require_new => {
            return Err(invalid(
                "Bạn đang có buổi tập khác. Hãy tiếp tục buổi đang tập.",
            ));
        }
        Some(id) => id,
        None => {
            let id = Uuid::new_v4().to_string();
            create(&tx, &id)?;
            id
        }
    };
    let detail = required_session(&tx, &id)?;
    tx.commit()?;
    Ok(detail)
}
pub fn start_free_session(
    db: &mut Connection,
    date: &str,
    now_iso: &str,
    place_id: Option<&str>,
) -> Result<Value> {
    begin_session(db, false, |tx, id| {
        tx.execute("INSERT INTO workout_session(id,date,training_day_name,mode,origin,place_id,started_at) VALUES(?1,?2,'Tập tự do','free','free',?3,?4)",
            params![id,date,place_id,now_iso])?;
        Ok(())
    })
}
pub fn add_exercise(
    db: &mut Connection,
    session_id: &str,
    exercise_id: &str,
    sort_order: Option<i64>,
) -> Result<Value> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    active_only(&tx, session_id)?;
    let existing:Option<String>=tx.query_row("SELECT id FROM workout_exercise WHERE workout_session_id=?1 AND exercise_id=?2 LIMIT 1",
        params![session_id,exercise_id],|r|r.get(0)).optional()?;
    let id = match existing {
        Some(id) => id,
        None => {
            let id = Uuid::new_v4().to_string();
            tx.execute("INSERT INTO workout_exercise(id,workout_session_id,exercise_id,sort_order)
        SELECT ?1,?2,?3,COALESCE(?4,MAX(sort_order)+1,0) FROM workout_exercise WHERE workout_session_id=?2",params![id,session_id,exercise_id,sort_order])?;
            id
        }
    };
    let movement =
        move_detail(&tx, &id)?.ok_or_else(|| invalid("Không đọc được bài tập vừa thêm."))?;
    tx.commit()?;
    Ok(movement)
}
fn active_only(db: &Connection, id: &str) -> Result<()> {
    let active: bool = db.query_row(
        "SELECT EXISTS(SELECT 1 FROM workout_session WHERE id=?1 AND status='active')",
        [id],
        |r| r.get(0),
    )?;
    if active {
        Ok(())
    } else {
        Err(invalid("Buổi tập này đã kết thúc."))
    }
}
pub fn append_set(
    db: &mut Connection,
    exercise_id: &str,
    input: &SetInput,
    id: Option<&str>,
    now_iso: &str,
) -> Result<Value> {
    append(db, exercise_id, input, id, Some(now_iso))
}
pub fn skip_set(
    db: &mut Connection,
    exercise_id: &str,
    kg: f64,
    reps: f64,
    id: Option<&str>,
) -> Result<Value> {
    append(db, exercise_id, &skipped_set_input(kg, reps), id, None)
}

pub fn skipped_set_input(kg: f64, reps: f64) -> SetInput {
    let kg = if (0.0..=500.0).contains(&kg) { kg } else { 0.0 };
    let reps = if reps.fract() == 0.0 && (0.0..=100.0).contains(&reps) {
        reps as u32
    } else {
        0
    };
    SetInput::repetitions(kg, reps)
}
fn append(
    db: &mut Connection,
    exercise_id: &str,
    input: &SetInput,
    id: Option<&str>,
    completed: Option<&str>,
) -> Result<Value> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let generated;
    let id = match id {
        Some(id) => id,
        None => {
            generated = Uuid::new_v4().to_string();
            &generated
        }
    };
    let (result, _) = append_set_on(
        &tx,
        exercise_id,
        id,
        completed,
        |_| Ok(input.clone()),
        || Ok(()),
    )?;
    tx.commit()?;
    Ok(result)
}

pub fn append_set_on(
    tx: &rusqlite::Transaction<'_>,
    exercise_id: &str,
    id: &str,
    completed: Option<&str>,
    build_input: impl FnOnce(&str) -> Result<SetInput>,
    before_write: impl FnOnce() -> Result<()>,
) -> Result<(Value, bool)> {
    let (session, movement) = tx
        .query_row(
            "SELECT workout_session_id,exercise_id FROM workout_exercise WHERE id=?1",
            [exercise_id],
            |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)),
        )
        .optional()?
        .ok_or_else(|| invalid("Không tìm thấy bài trong buổi tập."))?;
    let existing: Option<String> = tx
        .query_row(
            "SELECT workout_exercise_id FROM workout_set WHERE id=?1",
            [id],
            |r| r.get(0),
        )
        .optional()?;
    let changed = existing.is_none();
    match existing {
        Some(other) if other != exercise_id => return Err(invalid("Hiệp đã thuộc bài tập khác.")),
        Some(_) => (),
        None => {
            active_only(tx, &session)?;
            let input = build_input(&movement)?;
            if completed.is_some() {
                input.validate(&movement)?;
            }
            before_write()?;
            tx.execute("INSERT INTO workout_set(id,workout_exercise_id,set_number,weight_kg,reps,rest_seconds,effort,notes,status,completed_at,duration_seconds)
                SELECT ?1,?2,COALESCE(MAX(set_number),0)+1,?3,?4,?5,?6,?7,?8,?9,?10 FROM workout_set WHERE workout_exercise_id=?2",
                params![id,exercise_id,input.weight_kg,input.reps,completed.map(|_|input.rest_seconds),input.effort_text(),input.notes,
                    if completed.is_some(){"logged"}else{"skipped"},completed,input.duration_seconds])?;
            totals(tx, &session)?;
        }
    }
    let set = one(tx, &format!("{SETS} WHERE ws.id=?1"), [id])?
        .ok_or_else(|| invalid("Không tìm thấy hiệp vừa ghi."))?;
    let session = required_session(tx, &session)?;
    Ok((json!({"set":set,"session":session}), changed))
}
pub(super) fn totals(db: &Connection, session: &str) -> Result<()> {
    db.execute("UPDATE workout_exercise SET total_volume=(SELECT COALESCE(SUM(ws.weight_kg*ws.reps),0) FROM workout_set ws
        WHERE ws.workout_exercise_id=workout_exercise.id AND ws.status='logged' AND ws.duration_seconds IS NULL AND ws.legacy_unit_unknown=0)
        WHERE workout_session_id=?1",[session])?;
    db.execute("UPDATE workout_session SET total_volume=(SELECT COALESCE(SUM(total_volume),0) FROM workout_exercise WHERE workout_session_id=?1) WHERE id=?1",[session])?;
    Ok(())
}
pub fn complete_session(db: &mut Connection, id: &str, now_iso: &str) -> Result<()> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    complete_session_on(&tx, id, Some(now_iso), || Ok(()))?;
    tx.commit()?;
    Ok(())
}
pub fn complete_session_on(
    tx: &rusqlite::Transaction<'_>,
    id: &str,
    now_iso: Option<&str>,
    before_write: impl FnOnce() -> Result<()>,
) -> Result<()> {
    active_only(tx, id)?;
    let logged:bool=tx.query_row("SELECT EXISTS(SELECT 1 FROM workout_set ws JOIN workout_exercise we ON we.id=ws.workout_exercise_id
        WHERE we.workout_session_id=?1 AND ws.status='logged')",[id],|r|r.get(0))?;
    if !logged {
        return Err(invalid(
            "Cần ghi ít nhất một hiệp trước khi hoàn tất buổi tập.",
        ));
    }
    let now_iso = now_iso.ok_or_else(|| invalid("Invalid time value"))?;
    let duration:Option<i64>=tx.query_row("SELECT MAX(1,CAST((ROUND(unixepoch(?1,'subsec')*1000)-ROUND(
        CASE WHEN length(started_at)=10 OR upper(substr(started_at,-1))='Z' OR substr(started_at,11) GLOB '*[+-]*'
        THEN unixepoch(started_at,'subsec') ELSE unixepoch(started_at,'utc','subsec') END *1000)+30000)/60000 AS INTEGER))
        FROM workout_session WHERE id=?2",params![now_iso,id],|r|r.get(0))?;
    before_write()?;
    totals(tx, id)?;
    tx.execute("UPDATE workout_session SET completed_at=?1,duration_minutes=?2,status='completed' WHERE id=?3",params![now_iso,duration,id])?;
    Ok(())
}

pub fn cancel_session(db: &mut Connection, id: &str, now_iso: &str) -> Result<()> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let status: Option<String> = tx
        .query_row(
            "SELECT status FROM workout_session WHERE id=?1",
            [id],
            |r| r.get(0),
        )
        .optional()?;
    match status.as_deref() {
        Some("completed") => return Err(invalid("Buổi tập này đã hoàn tất.")),
        Some("active") => {
            tx.execute(
                "UPDATE workout_session SET status='cancelled',cancelled_at=?1 WHERE id=?2",
                params![now_iso, id],
            )?;
        }
        _ => (),
    }
    tx.commit()?;
    Ok(())
}
pub fn undo_cancel(db: &mut Connection, id: &str) -> Result<()> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let cancelled: bool = tx.query_row(
        "SELECT EXISTS(SELECT 1 FROM workout_session WHERE id=?1 AND status='cancelled')",
        [id],
        |r| r.get(0),
    )?;
    if cancelled {
        let other: bool = tx.query_row(
            "SELECT EXISTS(SELECT 1 FROM workout_session WHERE status='active' AND id<>?1)",
            [id],
            |r| r.get(0),
        )?;
        if other {
            return Err(invalid("Bạn đang có buổi tập khác."));
        }
        tx.execute(
            "UPDATE workout_session SET status='active',cancelled_at=NULL WHERE id=?1",
            [id],
        )?;
    }
    tx.commit()?;
    Ok(())
}

fn clear_next_weight(db: &Connection, exercise: &str) -> Result<()> {
    db.execute("UPDATE workout_exercise SET next_weight_kg=NULL WHERE id=?1 AND next_weight_kg IS NOT NULL",[exercise])?;
    Ok(())
}
pub fn delete_set(db: &mut Connection, id: &str) -> Result<()> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let row=tx.query_row("SELECT ws.workout_exercise_id,we.workout_session_id FROM workout_set ws JOIN workout_exercise we ON we.id=ws.workout_exercise_id WHERE ws.id=?1",
        [id],|r|Ok((r.get::<_,String>(0)?,r.get::<_,String>(1)?))).optional()?;
    if let Some((exercise, session)) = row {
        clear_next_weight(&tx, &exercise)?;
        tx.execute("DELETE FROM workout_set WHERE id=?1", [id])?;
        let mut query=tx.prepare("SELECT id FROM workout_set WHERE workout_exercise_id=?1 ORDER BY set_number,created_at")?;
        let ids = query
            .query_map([exercise], |r| r.get::<_, String>(0))?
            .collect::<rusqlite::Result<Vec<_>>>()?;
        drop(query);
        for (i, id) in ids.into_iter().enumerate() {
            tx.execute(
                "UPDATE workout_set SET set_number=?1 WHERE id=?2",
                params![i as i64 + 1, id],
            )?;
        }
        totals(&tx, &session)?;
    }
    tx.commit()?;
    Ok(())
}
pub fn update_set(db: &mut Connection, id: &str, input: &SetInput, now_iso: &str) -> Result<()> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let row=tx.query_row("SELECT we.id,we.workout_session_id,we.exercise_id FROM workout_set ws JOIN workout_exercise we ON we.id=ws.workout_exercise_id WHERE ws.id=?1",
        [id],|r|Ok((r.get::<_,String>(0)?,r.get::<_,String>(1)?,r.get::<_,String>(2)?))).optional()?.ok_or_else(||invalid("Không tìm thấy hiệp."))?;
    input.validate(&row.2)?;
    tx.execute("UPDATE workout_set SET weight_kg=?1,reps=?2,rest_seconds=?3,effort=?4,notes=?5,updated_at=?6,duration_seconds=?7,legacy_unit_unknown=0 WHERE id=?8",
        params![input.weight_kg,input.reps,input.rest_seconds,input.effort_text(),input.notes,now_iso,input.duration_seconds,id])?;
    clear_next_weight(&tx, &row.0)?;
    totals(&tx, &row.1)?;
    tx.commit()?;
    Ok(())
}
pub fn revise_completed_set(
    db: &mut Connection,
    session: &str,
    id: &str,
    kg: f64,
    reps: u32,
    duration: Option<u32>,
    now_iso: &str,
) -> Result<Value> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let (result, _) = revise_completed_set_on(
        &tx,
        session,
        id,
        now_iso,
        |_| {
            let mut input = SetInput::repetitions(kg, reps);
            input.duration_seconds = duration;
            Ok(input)
        },
        || Ok(()),
    )?;
    tx.commit()?;
    Ok(result)
}
pub fn revise_completed_set_on(
    tx: &rusqlite::Transaction<'_>,
    session: &str,
    id: &str,
    now_iso: &str,
    build_input: impl FnOnce(&str) -> Result<SetInput>,
    before_write: impl FnOnce() -> Result<()>,
) -> Result<(Value, bool)> {
    let row=tx.query_row("SELECT we.id,we.exercise_id,ws.weight_kg,ws.reps,ws.duration_seconds FROM workout_set ws JOIN workout_exercise we ON we.id=ws.workout_exercise_id
        JOIN workout_session s ON s.id=we.workout_session_id WHERE ws.id=?1 AND s.id=?2 AND s.status='completed' AND ws.status='logged' AND ws.legacy_unit_unknown=0",
        params![id,session],|r|Ok((r.get::<_,String>(0)?,r.get::<_,String>(1)?,r.get::<_,f64>(2)?,r.get::<_,u32>(3)?,r.get::<_,Option<u32>>(4)?))).optional()?;
    let (exercise, movement, old_kg, old_reps, old_duration) = row
        .filter(|r| fitness::is_timed_exercise(&r.1) == r.4.is_some())
        .ok_or_else(|| invalid("Không thể chỉnh hiệp này trong buổi đã hoàn tất."))?;
    let input = build_input(&movement)?;
    let (kg, reps, duration) = (input.weight_kg, input.reps, input.duration_seconds);
    input.validate(&movement)?;
    let changed = old_kg != kg || old_reps != reps || old_duration != duration;
    if changed {
        before_write()?;
        tx.execute("UPDATE workout_set SET weight_kg=?1,reps=?2,duration_seconds=?3,updated_at=?4 WHERE id=?5",params![kg,reps,duration,now_iso,id])?;
        clear_next_weight(tx, &exercise)?;
        totals(tx, session)?;
    }
    Ok((required_session(tx, session)?, changed))
}
pub fn remove_exercise(db: &mut Connection, id: &str) -> Result<()> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let session: Option<String> = tx
        .query_row(
            "SELECT workout_session_id FROM workout_exercise WHERE id=?1",
            [id],
            |r| r.get(0),
        )
        .optional()?;
    if let Some(session) = session {
        tx.execute("DELETE FROM workout_set WHERE workout_exercise_id=?1", [id])?;
        tx.execute("DELETE FROM workout_exercise WHERE id=?1", [id])?;
        totals(&tx, &session)?;
    }
    tx.commit()?;
    Ok(())
}
pub fn delete_completed_session(db: &mut Connection, id: &str) -> Result<()> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let status: Option<String> = tx
        .query_row(
            "SELECT status FROM workout_session WHERE id=?1",
            [id],
            |r| r.get(0),
        )
        .optional()?;
    if let Some(status) = status {
        if status != "completed" {
            return Err(invalid("Chỉ xóa được buổi tập đã hoàn tất."));
        }
        tx.execute("DELETE FROM workout_set WHERE workout_exercise_id IN (SELECT id FROM workout_exercise WHERE workout_session_id=?1)",[id])?;
        tx.execute(
            "DELETE FROM workout_exercise WHERE workout_session_id=?1",
            [id],
        )?;
        tx.execute("DELETE FROM workout_session WHERE id=?1", [id])?;
    }
    tx.commit()?;
    Ok(())
}
