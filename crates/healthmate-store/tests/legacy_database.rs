use healthmate_store::{DatabaseFlavor, open_account};
use rusqlite::Connection;
use std::{path::Path, process::Command};

fn count(db: &Connection, sql: &str) -> i64 {
    db.query_row(sql, [], |row| row.get(0)).unwrap()
}

#[test]
#[ignore = "runs the original TypeScript migrations with the installed npm dependencies"]
fn an_installed_sqlite_file_matches_the_typescript_upgrade_on_open_and_reopen() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    let files = tempfile::tempdir().unwrap();
    let output = Command::new("node")
        .current_dir(&root)
        .args([
            "--import",
            "tsx",
            "crates/healthmate-store/tests/create-legacy-database.cjs",
        ])
        .arg(files.path())
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let original = files.path().join("typescript.db");
    let owner = "legacyaccount01";
    for _ in 0..2 {
        let db = open_account(files.path(), owner, DatabaseFlavor::Production).unwrap();
        db.execute(
            "ATTACH DATABASE ?1 AS reference",
            [original.to_str().unwrap()],
        )
        .unwrap();
        assert_eq!(
            count(&db, "PRAGMA main.user_version"),
            count(&db, "PRAGMA reference.user_version")
        );
        assert_eq!(
            count(&db, "SELECT count(*) FROM pragma_foreign_key_check"),
            0
        );
        assert_eq!(count(&db, "SELECT count(*) FROM planned_dish"), 2);
        assert_eq!(count(&db, "SELECT change_version FROM sync_workspace"), 1);
        assert_eq!(
            count(
                &db,
                "SELECT count(*) FROM workout_preference WHERE key='fitness_default_place' AND value='home'"
            ),
            1
        );
        for schema in ["main", "reference"] {
            db.execute_batch("SAVEPOINT constraints").unwrap();
            db.execute(
                &format!("UPDATE {schema}.user_profile SET birth_date='1998-05-12'"),
                [],
            )
            .unwrap();
            assert!(
                db.execute(
                    &format!("UPDATE {schema}.user_profile SET birth_date=NULL"),
                    []
                )
                .is_err()
            );
            assert!(
                db.execute(
                    &format!("UPDATE {schema}.workout_exercise SET next_weight_kg=501"),
                    []
                )
                .is_err()
            );
            db.execute_batch("ROLLBACK TO constraints; RELEASE constraints")
                .unwrap();
        }
        assert_eq!(
            count(
                &db,
                "SELECT count(*) FROM workout_set WHERE weight_kg=40 AND reps=6 AND status='logged' AND completed_at=created_at"
            ),
            1
        );
        let mut query = db.prepare("SELECT name FROM reference.sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").unwrap();
        let names = query.query_map([], |row| row.get::<_, String>(0)).unwrap();
        for name in names {
            let table = name.unwrap();
            assert!(table.bytes().all(|c| c.is_ascii_lowercase() || c == b'_'));
            for (left, right) in [("main", "reference"), ("reference", "main")] {
                let rows = format!(
                    "SELECT count(*) FROM (SELECT * FROM {left}.{table} EXCEPT SELECT * FROM {right}.{table})"
                );
                assert_eq!(count(&db, &rows), 0, "rows of {table} in {left}");
                for pragma in ["table_info", "foreign_key_list", "index_list"] {
                    let metadata = format!(
                        "SELECT count(*) FROM (SELECT * FROM pragma_{pragma}('{table}','{left}') EXCEPT SELECT * FROM pragma_{pragma}('{table}','{right}'))"
                    );
                    assert_eq!(count(&db, &metadata), 0, "{pragma} for {table} in {left}");
                }
            }
        }
    }
}
