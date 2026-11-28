use super::{coaching::recorded, invalid, rows};
use crate::Result;
use healthmate_domain::{
    dates::{add_calendar_days, monday_of_week, parse_local_date},
    progress::{self, ProgressSet, ProgressSummary},
};
use rusqlite::{Connection, OptionalExtension, params};
use serde_json::Value;

pub fn weekly_volumes(db: &Connection, since: &str, through: &str) -> Result<Vec<Value>> {
    rows(db,"SELECT date(date,'-'||((strftime('%w',date)+6)%7)||' days') AS week_start,SUM(total_volume) AS volume
        FROM workout_session WHERE status='completed' AND date BETWEEN ?1 AND ?2 GROUP BY week_start ORDER BY week_start",params![since,through])
}

pub fn progress_summary(db: &Connection, today: &str) -> Result<ProgressSummary> {
    super::read_consistently(db, |db| progress_for_date(db, today))
}

fn progress_for_date(db: &Connection, today: &str) -> Result<ProgressSummary> {
    let date = parse_local_date(today).ok_or_else(|| invalid("Ngày báo cáo không hợp lệ."))?;
    let monday = monday_of_week(date).ok_or_else(|| invalid("Ngày đầu tuần không hợp lệ."))?;
    let start =
        add_calendar_days(monday, -77).ok_or_else(|| invalid("Ngày báo cáo không hợp lệ."))?;
    let end = add_calendar_days(monday, 6).ok_or_else(|| invalid("Ngày báo cáo không hợp lệ."))?;
    let data=rows(db,"SELECT s.date,e.id AS exercise_id,e.name AS exercise_name,e.name_vi AS exercise_name_vi,e.muscle_group,
        ws.status,ws.weight_kg,ws.reps,ws.duration_seconds,ws.effort,ws.legacy_unit_unknown FROM workout_session s
        JOIN workout_exercise we ON we.workout_session_id=s.id JOIN workout_set ws ON ws.workout_exercise_id=we.id JOIN exercise e ON e.id=we.exercise_id
        WHERE s.completed_at IS NOT NULL AND s.date BETWEEN ?1 AND ?2",params![start.to_string(),end.to_string()])?;
    let mut sets = Vec::new();
    for row in data {
        let Some(date) = row["date"].as_str().and_then(parse_local_date) else {
            continue;
        };
        sets.push(ProgressSet {
            date,
            completed: true,
            exercise_id: serde_json::from_value(row["exercise_id"].clone())?,
            exercise_name: serde_json::from_value(row["exercise_name"].clone())?,
            exercise_name_vi: serde_json::from_value(row["exercise_name_vi"].clone())?,
            muscle_group: serde_json::from_value(row["muscle_group"].clone())?,
            set: recorded(row)?,
        });
    }
    let from = add_calendar_days(date, -6).ok_or_else(|| invalid("Ngày báo cáo không hợp lệ."))?;
    let mut stmt =
        db.prepare("SELECT date,weight_kg FROM weight_log WHERE date BETWEEN ?1 AND ?2")?;
    let mut records = stmt.query(params![from.to_string(), today])?;
    let mut weights = Vec::new();
    while let Some(r) = records.next()? {
        let date: String = r.get(0)?;
        if let Some(date) = parse_local_date(&date) {
            weights.push((date, r.get::<_, f64>(1)?));
        }
    }
    let weight = db
        .query_row("SELECT weight_kg FROM user_profile LIMIT 1", [], |r| {
            r.get::<_, f64>(0)
        })
        .optional()?;
    progress::progress_summary(date, &sets, &weights, weight)
        .ok_or_else(|| invalid("Ngày báo cáo không hợp lệ."))
}
