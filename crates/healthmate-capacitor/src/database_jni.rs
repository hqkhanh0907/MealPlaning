use jni::{
    JNIEnv,
    objects::{JClass, JObject, JString},
    sys::jstring,
};
use serde_json::Value;
use std::{
    fmt::Display,
    panic::{AssertUnwindSafe, catch_unwind},
    path::Path,
    ptr,
};

struct Arguments<'a> {
    directory: JString<'a>,
    owner: JString<'a>,
    database: JString<'a>,
    command: JString<'a>,
    guard: JObject<'a>,
}

fn invoke<E: Display>(
    mut env: JNIEnv<'_>,
    args: Arguments<'_>,
    scope: &str,
    execute: impl FnOnce(
        &Path,
        &str,
        &str,
        &Value,
        &mut dyn FnMut() -> healthmate_store::Result<()>,
    ) -> Result<Value, E>,
) -> jstring {
    let outcome = catch_unwind(AssertUnwindSafe(|| -> Result<String, String> {
        let mut text = |s: &JString| {
            env.get_string(s)
                .map(String::from)
                .map_err(|_| "Invalid account database binding".to_string())
        };
        let directory = text(&args.directory)?;
        let owner = text(&args.owner)?;
        let database = text(&args.database)?;
        let raw = text(&args.command)?;
        let command: Value =
            serde_json::from_str(&raw).map_err(|_| format!("Invalid {scope} request"))?;
        if command == serde_json::json!({"op":"probe"}) {
            return Ok("1".to_string());
        }
        let mut before_write = || {
            env.call_method(&args.guard, "run", "()V", &[])
                .map(|_| ())
                .map_err(|_| {
                    healthmate_store::Error::InvalidInput(format!(
                        "Could not prepare {scope} write"
                    ))
                })
        };
        execute(
            Path::new(&directory),
            &owner,
            &database,
            &command,
            &mut before_write,
        )
        .map(|reply| reply.to_string())
        .map_err(|error| error.to_string())
    }));
    match outcome.unwrap_or_else(|_| Err(format!("Native {scope} data unavailable"))) {
        Ok(reply) => env
            .new_string(reply)
            .map(JString::into_raw)
            .unwrap_or(ptr::null_mut()),
        Err(message) => {
            if !env.exception_check().unwrap_or(true) {
                let _ = env.throw_new("java/io/IOException", message);
            }
            ptr::null_mut()
        }
    }
}

#[unsafe(no_mangle)]
pub extern "system" fn Java_com_healthmate_ai_sync_MealPlanProfilePlugin_profileNative<'a>(
    env: JNIEnv<'a>,
    _: JClass<'a>,
    directory: JString<'a>,
    owner: JString<'a>,
    database: JString<'a>,
    command: JString<'a>,
    guard: JObject<'a>,
) -> jstring {
    invoke(
        env,
        Arguments {
            directory,
            owner,
            database,
            command,
            guard,
        },
        "profile",
        |dir, owner, db, command, guard| {
            crate::profile_data::execute(dir, owner, db, command, guard)
        },
    )
}
#[unsafe(no_mangle)]
pub extern "system" fn Java_com_healthmate_ai_sync_MealPlanWorkoutPlugin_workoutNative<'a>(
    env: JNIEnv<'a>,
    _: JClass<'a>,
    directory: JString<'a>,
    owner: JString<'a>,
    database: JString<'a>,
    command: JString<'a>,
    guard: JObject<'a>,
) -> jstring {
    invoke(
        env,
        Arguments {
            directory,
            owner,
            database,
            command,
            guard,
        },
        "workout",
        |dir, owner, db, command, guard| {
            crate::workout_data::execute(dir, owner, db, command, guard)
        },
    )
}
