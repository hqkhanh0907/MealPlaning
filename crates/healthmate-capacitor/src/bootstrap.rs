use crate::{ReadError, account_flavor};
use healthmate_store::{Error, SCHEMA_VERSION, open_account};
use std::path::Path;

pub fn initialize_database(
    directory: &Path,
    owner: &str,
    database: &str,
) -> Result<i64, ReadError> {
    let flavor = account_flavor(owner, database)?;
    let db = open_account(directory, owner, flavor).map_err(|error| match error {
        Error::InvalidOwner => ReadError::InvalidSession,
        _ => ReadError::Query,
    })?;
    let version = db
        .pragma_query_value(None, "user_version", |row| row.get(0))
        .map_err(|_| ReadError::Query)?;
    if version != SCHEMA_VERSION {
        return Err(ReadError::NotReady);
    }
    Ok(version)
}

#[cfg(target_os = "android")]
mod android {
    use super::*;
    use jni::{
        JNIEnv,
        objects::{JClass, JString},
        sys::jlong,
    };
    use std::panic::{AssertUnwindSafe, catch_unwind};

    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_healthmate_ai_sync_MealPlanSyncPlugin_initializeDatabaseNative(
        mut env: JNIEnv<'_>,
        _: JClass<'_>,
        directory: JString<'_>,
        owner: JString<'_>,
        database: JString<'_>,
    ) -> jlong {
        let result = catch_unwind(AssertUnwindSafe(|| {
            let mut text = |s: &JString| {
                env.get_string(s)
                    .map(String::from)
                    .map_err(|_| ReadError::InvalidSession)
            };
            initialize_database(
                Path::new(&text(&directory)?),
                &text(&owner)?,
                &text(&database)?,
            )
        }));
        match result.unwrap_or(Err(ReadError::Query)) {
            Ok(version) => version,
            Err(error) => {
                if !env.exception_check().unwrap_or(true) {
                    let _ = env.throw_new("java/io/IOException", error.to_string());
                }
                -1
            }
        }
    }
}
