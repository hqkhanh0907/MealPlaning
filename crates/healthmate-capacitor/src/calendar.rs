use crate::{ReadError, read_account};
use healthmate_domain::dates::parse_local_date;
use rusqlite::params;
use serde_json::{Value, json};
use std::path::Path;

const PLANNED_FIELDS: [&str; 19] = [
    "id",
    "meal_slot_id",
    "dish_id",
    "servings",
    "sort_order",
    "is_completed",
    "completed_at",
    "calories",
    "protein",
    "carbs",
    "fat",
    "fiber",
    "created_at",
    "dish_name",
    "effective_calories",
    "effective_protein",
    "effective_carbs",
    "effective_fat",
    "effective_fiber",
];

fn project_planned_dishes(day: &mut Value) -> Result<(), ReadError> {
    for slot in day["meal_slots"].as_array_mut().ok_or(ReadError::Query)? {
        for dish in slot["planned_dishes"]
            .as_array_mut()
            .ok_or(ReadError::Query)?
        {
            dish.as_object_mut()
                .ok_or(ReadError::Query)?
                .retain(|field, _| PLANNED_FIELDS.contains(&field.as_str()));
        }
    }
    Ok(())
}

pub fn read_calendar(
    directory: &Path,
    owner: &str,
    database: &str,
    start: &str,
    end: &str,
) -> Result<Value, ReadError> {
    parse_local_date(start).ok_or(ReadError::InvalidDate)?;
    parse_local_date(end).ok_or(ReadError::InvalidDate)?;
    read_account(directory, owner, database, |db| {
        let mut statement = db
            .prepare("SELECT date FROM day_plan WHERE date BETWEEN ?1 AND ?2 ORDER BY date ASC")
            .map_err(|_| ReadError::Query)?;
        let dates = statement
            .query_map(params![start, end], |row| row.get::<_, String>(0))
            .map_err(|_| ReadError::Query)?;
        let mut days = Vec::new();
        for date in dates {
            let date = date.map_err(|_| ReadError::Query)?;
            let mut day = healthmate_store::meals::day(db, &date)
                .map_err(|_| ReadError::Query)?
                .ok_or(ReadError::Query)?;
            project_planned_dishes(&mut day)?;
            days.push(day);
        }
        Ok(json!({"start":start,"end":end,"days":days}))
    })
}

#[cfg(target_os = "android")]
mod android {
    use super::*;
    use jni::{
        JNIEnv,
        objects::{JClass, JString},
        sys::jstring,
    };
    use std::{
        panic::{AssertUnwindSafe, catch_unwind},
        ptr,
    };

    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_healthmate_ai_sync_MealPlanSyncPlugin_calendarDaysNative(
        mut env: JNIEnv<'_>,
        _: JClass<'_>,
        directory: JString<'_>,
        owner: JString<'_>,
        database: JString<'_>,
        start: JString<'_>,
        end: JString<'_>,
    ) -> jstring {
        let read = catch_unwind(AssertUnwindSafe(|| {
            let mut string =
                |s: &JString, err| env.get_string(s).map(String::from).map_err(|_| err);
            let directory = string(&directory, ReadError::InvalidSession)?;
            let owner = string(&owner, ReadError::InvalidSession)?;
            let database = string(&database, ReadError::InvalidSession)?;
            let start = string(&start, ReadError::InvalidDate)?;
            let end = string(&end, ReadError::InvalidDate)?;
            let data = read_calendar(Path::new(&directory), &owner, &database, &start, &end)?;
            env.new_string(data.to_string())
                .map(|v| v.into_raw())
                .map_err(|_| ReadError::Query)
        }));
        match read.unwrap_or(Err(ReadError::Query)) {
            Ok(s) => s,
            Err(reason) => {
                let (class, message) = match reason {
                    ReadError::InvalidDate => (
                        "java/lang/IllegalArgumentException",
                        "Invalid calendar date",
                    ),
                    ReadError::InvalidSession => (
                        "java/lang/SecurityException",
                        "Invalid account database binding",
                    ),
                    ReadError::NotReady => (
                        "java/io/FileNotFoundException",
                        "Account database not ready",
                    ),
                    ReadError::Query => ("java/io/IOException", "Could not read calendar"),
                };
                if !env.exception_check().unwrap_or(true) {
                    let _ = env.throw_new(class, message);
                }
                ptr::null_mut()
            }
        }
    }
}
