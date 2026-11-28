use healthmate_capacitor::{ReadError, bootstrap::initialize_database};
use healthmate_store::SCHEMA_VERSION;
use rusqlite::Connection;
use std::{path::Path, process::Command};

#[test]
fn new_databases_match_the_original_android_schema_and_sync_triggers() {
    let dir = tempfile::tempdir().unwrap();
    let owner = "aaaaaaaaaaaaaaa";
    let name = format!("healthmate_{owner}");
    initialize_database(dir.path(), owner, &name).unwrap();
    let oracle = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../src/app/core/services/database/bootstrap.oracle.cjs");
    let passed = Command::new("node")
        .arg(oracle)
        .arg(dir.path().join(format!("{name}SQLite.db")))
        .status()
        .unwrap();
    assert!(passed.success());
}

#[test]
fn a_new_account_opens_its_own_database_and_reopens_without_resetting_user_rows() {
    let root = tempfile::tempdir().unwrap();
    let an = "aaaaaaaaaaaaaaa";
    let binh = "bbbbbbbbbbbbbbb";
    assert!(matches!(
        initialize_database(root.path(), an, &format!("healthmate_{binh}")),
        Err(ReadError::InvalidSession)
    ));
    assert!(matches!(
        initialize_database(root.path(), "../wrong", "healthmate_../wrong"),
        Err(ReadError::InvalidSession)
    ));
    assert_eq!(std::fs::read_dir(root.path()).unwrap().count(), 0);
    for (owner, key) in [(an, "an"), (binh, "binh")] {
        let name = format!("healthmate_{owner}");
        let file = root.path().join(format!("{name}SQLite.db"));
        assert_eq!(
            initialize_database(root.path(), owner, &name).unwrap(),
            SCHEMA_VERSION
        );
        {
            let db = Connection::open(&file).unwrap();
            let profile: i64 = db
                .query_row("SELECT count(*) FROM user_profile", [], |r| r.get(0))
                .unwrap();
            assert_eq!(profile, 0);
            db.execute(
                "INSERT INTO app_config(key,value) VALUES('created_here',?1)",
                [key],
            )
            .unwrap();
        }
        initialize_database(root.path(), owner, &name).unwrap();
        let db = Connection::open(file).unwrap();
        let stored: String = db
            .query_row(
                "SELECT value FROM app_config WHERE key='created_here'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(stored, key);
        assert_eq!(
            db.query_row("SELECT count(*) FROM pragma_foreign_key_check", [], |r| r
                .get::<_, i64>(
                0
            ))
            .unwrap(),
            0
        );
    }
}
