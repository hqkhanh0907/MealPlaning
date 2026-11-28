use super::{ensure_seed_exercises, invalid, one, places::set_pref, rows};
use crate::Result;
use healthmate_domain::{
    dates::parse_local_date,
    fitness::normalize_training_prescription,
    recommendation::{PlannedExercise, TrainingDay},
};
use rusqlite::{Connection, OptionalExtension, TransactionBehavior, params};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashSet;
use uuid::Uuid;

const PLAN:&str="SELECT tp.id,tp.name,tp.type,tp.frequency,tp.is_active,tp.description,tp.source,tp.created_at,tp.updated_at,
    COUNT(DISTINCT CASE WHEN tpd.is_rest_day=0 THEN tpd.id END) AS training_days,COUNT(DISTINCT pe.id) AS planned_exercises
    FROM training_plan tp LEFT JOIN training_plan_day tpd ON tpd.training_plan_id=tp.id LEFT JOIN planned_exercise pe ON pe.training_plan_day_id=tpd.id";
const DAYS: &str =
    "SELECT id,training_plan_id,day_of_week,name,is_rest_day,sort_order FROM training_plan_day";
const ITEMS:&str="SELECT pe.id,pe.training_plan_day_id,pe.exercise_id,e.name AS exercise_name,e.name_vi AS exercise_name_vi,
    e.muscle_group,e.category,e.equipment,pe.sets,pe.reps_min,pe.reps_max,pe.rest_seconds,pe.notes,pe.sort_order
    FROM planned_exercise pe JOIN exercise e ON pe.exercise_id=e.id WHERE pe.training_plan_day_id=?1 ORDER BY pe.sort_order";

#[derive(Deserialize)]
struct Preset {
    id: String,
    name: String,
    #[serde(rename = "type")]
    kind: String,
    frequency: u8,
    description: String,
    days: Vec<TrainingDay>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct FinderSchedule {
    pub weekdays: Vec<u8>,
    pub minutes: i64,
}
pub fn finder_schedule(db: &Connection) -> Result<Option<FinderSchedule>> {
    let value: Option<String> = db
        .query_row(
            "SELECT value FROM workout_preference WHERE key='fitness_finder_schedule'",
            [],
            |r| r.get(0),
        )
        .optional()?;
    let Some(mut schedule) = value.and_then(|s| serde_json::from_str::<FinderSchedule>(&s).ok())
    else {
        return Ok(None);
    };
    if schedule.weekdays.is_empty()
        || schedule.weekdays.iter().any(|d| *d > 6)
        || schedule.minutes <= 0
    {
        return Ok(None);
    }
    let mut seen = HashSet::new();
    schedule.weekdays.retain(|v| seen.insert(*v));
    Ok(Some(schedule))
}
pub fn save_finder_schedule(db: &Connection, schedule: &FinderSchedule) -> Result<()> {
    set_pref(
        db,
        "fitness_finder_schedule",
        &serde_json::to_string(schedule)?,
    )
}

pub fn ensure_preset_plans(db: &mut Connection) -> Result<Vec<Value>> {
    ensure_seed_exercises(db)?;
    let presets: Vec<Preset> = serde_json::from_str(include_str!("preset-plans.json"))?;
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    for p in presets {
        tx.execute("INSERT INTO training_plan(id,name,type,frequency,is_active,description,source,updated_at)
            VALUES(?1,?2,?3,?4,0,?5,'preset',datetime('now')) ON CONFLICT(id) DO UPDATE SET
            name=excluded.name,type=excluded.type,frequency=excluded.frequency,description=excluded.description,updated_at=datetime('now')
            WHERE training_plan.source='preset' AND (training_plan.name,training_plan.type,training_plan.frequency,training_plan.description)
            IS NOT (excluded.name,excluded.type,excluded.frequency,excluded.description)",params![p.id,p.name,p.kind,p.frequency,p.description])?;
        for (i, day) in p.days.into_iter().enumerate() {
            let id = format!("{}_day_{}", p.id, day.day_of_week);
            tx.execute("INSERT INTO training_plan_day(id,training_plan_id,day_of_week,name,is_rest_day,sort_order)
                VALUES(?1,?2,?3,?4,?5,?6) ON CONFLICT(training_plan_id,day_of_week) DO UPDATE SET name=excluded.name,is_rest_day=excluded.is_rest_day,sort_order=excluded.sort_order
                WHERE (training_plan_day.name,training_plan_day.is_rest_day,training_plan_day.sort_order) IS NOT (excluded.name,excluded.is_rest_day,excluded.sort_order)",
                params![id,p.id,day.day_of_week,day.name,day.is_rest_day,i as i64])?;
            for (j, x) in day.exercises.into_iter().enumerate() {
                let key = format!("{id}_{}", x.exercise_id);
                let a = x.prescription;
                tx.execute("INSERT INTO planned_exercise(id,training_plan_day_id,exercise_id,sets,reps_min,reps_max,rest_seconds,notes,sort_order)
                    VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9) ON CONFLICT(training_plan_day_id,exercise_id) DO UPDATE SET sets=excluded.sets,reps_min=excluded.reps_min,reps_max=excluded.reps_max,
                    rest_seconds=excluded.rest_seconds,notes=excluded.notes,sort_order=excluded.sort_order WHERE (planned_exercise.sets,planned_exercise.reps_min,planned_exercise.reps_max,
                    planned_exercise.rest_seconds,planned_exercise.notes,planned_exercise.sort_order) IS NOT (excluded.sets,excluded.reps_min,excluded.reps_max,excluded.rest_seconds,excluded.notes,excluded.sort_order)",
                    params![key,id,x.exercise_id,a.sets,a.reps_min,a.reps_max,a.rest_seconds,x.notes,j as i64])?;
            }
        }
    }
    let result = list_plans(&tx)?;
    tx.commit()?;
    Ok(result)
}
pub fn list_plans(db: &Connection) -> Result<Vec<Value>> {
    rows(
        db,
        &format!(
            "{PLAN} GROUP BY tp.id ORDER BY CASE tp.source WHEN 'preset' THEN 0 WHEN 'custom' THEN 1 ELSE 2 END,tp.frequency,tp.name"
        ),
        [],
    )
}
fn fill_day(db: &Connection, mut day: Value) -> Result<Value> {
    let id = day["id"]
        .as_str()
        .ok_or_else(|| invalid("Thiếu ngày tập."))?;
    day["exercises"] = Value::Array(rows(db, ITEMS, [id])?);
    Ok(day)
}
pub fn plan_days(db: &Connection, plan_id: &str) -> Result<Vec<Value>> {
    super::read_consistently(db, |db| {
        rows(
            db,
            &format!("{DAYS} WHERE training_plan_id=?1 ORDER BY sort_order"),
            [plan_id],
        )?
        .into_iter()
        .map(|day| fill_day(db, day))
        .collect()
    })
}
pub fn active_plan(db: &Connection) -> Result<Option<Value>> {
    super::read_consistently(db, active_plan_detail)
}

fn active_plan_detail(db: &Connection) -> Result<Option<Value>> {
    let Some(mut plan) = one(
        db,
        &format!("{PLAN} WHERE tp.is_active=1 GROUP BY tp.id LIMIT 1"),
        [],
    )?
    else {
        return Ok(None);
    };
    let id = plan["id"]
        .as_str()
        .ok_or_else(|| invalid("Thiếu giáo án."))?;
    plan["days"] = Value::Array(plan_days(db, id)?);
    Ok(Some(plan))
}
pub fn today_training_day(db: &Connection, date: &str) -> Result<Option<Value>> {
    super::read_consistently(db, |db| day_for_date(db, date))
}

fn day_for_date(db: &Connection, date: &str) -> Result<Option<Value>> {
    let date = if parse_local_date(date).is_some() {
        Some(date)
    } else {
        None
    };
    let day=one(db,&format!("{DAYS} WHERE training_plan_id=(SELECT id FROM training_plan WHERE is_active=1 LIMIT 1)
        AND day_of_week=CAST(strftime('%w',COALESCE(?1,date('now','localtime'))) AS INTEGER) LIMIT 1"),[date])?;
    day.map(|day| fill_day(db, day)).transpose()
}
#[derive(Debug, Clone, Copy)]
pub enum ExpectedActive<'a> {
    Unchecked,
    Exact(Option<&'a str>),
}
fn writable(db: &Connection, expected: ExpectedActive<'_>) -> Result<()> {
    let active: bool = db.query_row(
        "SELECT EXISTS(SELECT 1 FROM workout_session WHERE status='active')",
        [],
        |r| r.get(0),
    )?;
    if active {
        return Err(invalid("Không thể đổi giáo án khi đang tập."));
    }
    if let ExpectedActive::Exact(expected) = expected {
        let current: Option<String> = db
            .query_row(
                "SELECT id FROM training_plan WHERE is_active=1 LIMIT 1",
                [],
                |r| r.get(0),
            )
            .optional()?;
        if expected != current.as_deref() {
            return Err(invalid(
                "Giáo án đang dùng đã thay đổi. Hãy mở lại bản xem trước.",
            ));
        }
    }
    Ok(())
}
fn select(db: &Connection, id: &str) -> Result<()> {
    db.execute("UPDATE training_plan SET is_active=CASE WHEN id=?1 THEN 1 ELSE 0 END,
        updated_at=CASE WHEN id=?1 THEN datetime('now') ELSE updated_at END WHERE id=?1 OR is_active=1",[id])?;
    Ok(())
}
pub fn activate_plan(db: &mut Connection, id: &str, expected: ExpectedActive<'_>) -> Result<()> {
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    writable(&tx, expected)?;
    let exists: bool = tx.query_row(
        "SELECT EXISTS(SELECT 1 FROM training_plan WHERE id=?1)",
        [id],
        |r| r.get(0),
    )?;
    if !exists {
        return Err(invalid("Không tìm thấy giáo án."));
    }
    select(&tx, id)?;
    tx.commit()?;
    Ok(())
}
pub fn activate_plan_type(db: &mut Connection, kind: &str) -> Result<()> {
    let id:String=db.query_row("SELECT id FROM training_plan WHERE type=?1 AND source=CASE WHEN ?1='ai_custom' THEN 'ai' ELSE 'preset' END
        ORDER BY CASE WHEN id='plan_full_body_3x' THEN 0 ELSE 1 END,CASE WHEN source='ai' THEN is_active ELSE 0 END DESC, created_at DESC,id LIMIT 1",
        [kind],|r|r.get(0)).optional()?.ok_or_else(||invalid("Không tìm thấy giáo án."))?;
    activate_plan(db, &id, ExpectedActive::Unchecked)
}
fn add_prescription(db: &Connection, day: &str, x: &PlannedExercise, i: usize) -> Result<()> {
    let p = normalize_training_prescription(x.prescription);
    db.execute("INSERT INTO planned_exercise(id,training_plan_day_id,exercise_id,sets,reps_min,reps_max,rest_seconds,notes,sort_order)
        VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9)",params![Uuid::new_v4().to_string(),day,x.exercise_id,p.sets,p.reps_min,p.reps_max,p.rest_seconds,x.notes,i as i64])?;
    Ok(())
}
pub fn save_personal_plan(
    db: &mut Connection,
    source_id: &str,
    name: &str,
    days: &[TrainingDay],
    expected: ExpectedActive<'_>,
) -> Result<String> {
    let name = name.trim();
    if name.is_empty() || name.encode_utf16().count() > 80 {
        return Err(invalid("Nhập tên giáo án từ 1 đến 80 ký tự."));
    }
    let training: Vec<_> = days.iter().filter(|d| !d.is_rest_day).collect();
    if days.len() != 7
        || days
            .iter()
            .map(|d| d.day_of_week)
            .collect::<HashSet<_>>()
            .len()
            != 7
        || days.iter().any(|d| d.day_of_week > 6)
        || training.is_empty()
        || training.iter().any(|d| d.exercises.is_empty())
    {
        return Err(invalid(
            "Giáo án cần đủ bảy ngày và ít nhất một buổi có bài tập.",
        ));
    }
    if training.iter().any(|d| {
        d.exercises
            .iter()
            .map(|x| &x.exercise_id)
            .collect::<HashSet<_>>()
            .len()
            != d.exercises.len()
    }) {
        return Err(invalid("Mỗi bài chỉ xuất hiện một lần trong một buổi tập."));
    }
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    writable(&tx, expected)?;
    let source=tx.query_row("SELECT source,type FROM training_plan WHERE id=?1 AND CASE WHEN ?2 THEN source='preset' ELSE is_active=1 END",
        params![source_id,matches!(expected,ExpectedActive::Exact(_))],|r|Ok((r.get::<_,String>(0)?,r.get::<_,String>(1)?))).optional()?
        .ok_or_else(||invalid("Giáo án đã thay đổi. Mở lại giáo án đang dùng để chỉnh sửa."))?;
    let id = if source.0 == "custom" {
        source_id.to_owned()
    } else {
        Uuid::new_v4().to_string()
    };
    tx.execute("INSERT INTO training_plan(id,name,type,frequency,source,updated_at) VALUES(?1,?2,?3,?4,'custom',datetime('now'))
        ON CONFLICT(id) DO UPDATE SET name=excluded.name,frequency=excluded.frequency,updated_at=excluded.updated_at",params![id,name,source.1,training.len() as i64])?;
    for (i, day) in days.iter().enumerate() {
        let day_id = tx
            .query_row(
                "SELECT id FROM training_plan_day WHERE training_plan_id=?1 AND day_of_week=?2",
                params![id, day.day_of_week],
                |r| r.get::<_, String>(0),
            )
            .optional()?
            .unwrap_or_else(|| Uuid::new_v4().to_string());
        tx.execute("INSERT INTO training_plan_day(id,training_plan_id,day_of_week,name,is_rest_day,sort_order) VALUES(?1,?2,?3,?4,?5,?6)
            ON CONFLICT(training_plan_id,day_of_week) DO UPDATE SET name=excluded.name,is_rest_day=excluded.is_rest_day,sort_order=excluded.sort_order",
            params![day_id,id,day.day_of_week,day.name,day.is_rest_day,i as i64])?;
        tx.execute(
            "DELETE FROM planned_exercise WHERE training_plan_day_id=?1",
            [&day_id],
        )?;
        if !day.is_rest_day {
            for (j, x) in day.exercises.iter().enumerate() {
                add_prescription(&tx, &day_id, x, j)?;
            }
        }
    }
    select(&tx, &id)?;
    tx.commit()?;
    Ok(id)
}

pub fn create_ai_plan(
    db: &mut Connection,
    name: &str,
    description: &str,
    days: &[TrainingDay],
    expected: ExpectedActive<'_>,
) -> Result<Value> {
    ensure_seed_exercises(db)?;
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    writable(&tx, expected)?;
    let mut stmt = tx.prepare("SELECT id FROM exercise")?;
    let valid = stmt
        .query_map([], |r| r.get::<_, String>(0))?
        .collect::<rusqlite::Result<HashSet<_>>>()?;
    drop(stmt);
    let count = days
        .iter()
        .filter(|d| !d.is_rest_day && d.exercises.iter().any(|e| valid.contains(&e.exercise_id)))
        .count();
    if count < 2 {
        return Err(invalid(
            "Giáo án AI cần ít nhất hai ngày có bài tập hợp lệ.",
        ));
    }
    let id = Uuid::new_v4().to_string();
    tx.execute(
        "INSERT INTO training_plan(id,name,type,frequency,is_active,description,source,updated_at)
        VALUES(?1,?2,'ai_custom',?3,0,?4,'ai',datetime('now'))",
        params![id, name, count as i64, description],
    )?;
    for (i, d) in days.iter().enumerate() {
        let day = Uuid::new_v4().to_string();
        tx.execute("INSERT INTO training_plan_day(id,training_plan_id,day_of_week,name,is_rest_day,sort_order) VALUES(?1,?2,?3,?4,?5,?6)",
            params![day,id,d.day_of_week%7,d.name,d.is_rest_day,i as i64])?;
        if !d.is_rest_day {
            for (j, x) in d
                .exercises
                .iter()
                .enumerate()
                .filter(|(_, x)| valid.contains(&x.exercise_id))
            {
                add_prescription(&tx, &day, x, j)?;
            }
        }
    }
    select(&tx, &id)?;
    let summary = one(&tx, &format!("{PLAN} WHERE tp.id=?1 GROUP BY tp.id"), [id])?
        .ok_or_else(|| invalid("Không đọc được giáo án vừa tạo."))?;
    tx.commit()?;
    Ok(summary)
}
