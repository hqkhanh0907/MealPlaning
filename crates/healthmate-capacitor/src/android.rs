use crate::{ReadError, read_dashboard};
use jni::{
    JNIEnv,
    objects::{JClass, JString},
    sys::jstring,
};
use std::{
    panic::{AssertUnwindSafe, catch_unwind},
    path::Path,
    ptr,
};

#[unsafe(no_mangle)]
pub extern "system" fn Java_com_healthmate_ai_sync_MealPlanSyncPlugin_dashboardSummaryNative(
    mut env: JNIEnv<'_>,
    _: JClass<'_>,
    directory: JString<'_>,
    owner: JString<'_>,
    database: JString<'_>,
    date: JString<'_>,
) -> jstring {
    let out = catch_unwind(AssertUnwindSafe(|| {
        let directory: String = env
            .get_string(&directory)
            .map_err(|_| ReadError::InvalidSession)?
            .into();
        let owner: String = env
            .get_string(&owner)
            .map_err(|_| ReadError::InvalidSession)?
            .into();
        let database: String = env
            .get_string(&database)
            .map_err(|_| ReadError::InvalidSession)?
            .into();
        let date: String = env
            .get_string(&date)
            .map_err(|_| ReadError::InvalidDate)?
            .into();
        let data = read_dashboard(Path::new(&directory), &owner, &database, &date)?;
        env.new_string(data.to_string())
            .map(|v| v.into_raw())
            .map_err(|_| ReadError::Query)
    }));
    match out.unwrap_or(Err(ReadError::Query)) {
        Ok(s) => s,
        Err(reason) => {
            let kind = match reason {
                ReadError::InvalidDate => "java/lang/IllegalArgumentException",
                ReadError::InvalidSession => "java/lang/SecurityException",
                ReadError::NotReady => "java/io/FileNotFoundException",
                ReadError::Query => "java/io/IOException",
            };
            if !env.exception_check().unwrap_or(true) {
                let _ = env.throw_new(kind, reason.to_string());
            }
            ptr::null_mut()
        }
    }
}
