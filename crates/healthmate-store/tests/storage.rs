use healthmate_store::{
    DatabaseFlavor, Error, SCHEMA_VERSION, initialize, open_account, seed_catalog,
};
use rusqlite::Connection;

fn value<T: rusqlite::types::FromSql>(db: &Connection, sql: &str) -> T {
    db.query_row(sql, [], |row| row.get(0)).unwrap()
}

#[test]
fn catalog_matches_original_artifacts_and_preserves_edits() {
    let mut db = Connection::open_in_memory().unwrap();
    initialize(&mut db).unwrap();
    assert_eq!(seed_catalog(&mut db).unwrap(), (47, 20));
    assert_eq!(seed_catalog(&mut db).unwrap(), (0, 0));
    for (id, hash) in [
        (
            "7c4e8b1a-0002-4000-8000-000000000001",
            "400c8ef381641e416351c6b518c0e5993246bde9ba7e994f94904ff0801ec3a0",
        ),
        (
            "c0114c01-0001-4000-8000-000000000001",
            "483406c1de80c4c53be7b4e5e77b59709d4ba970db66900152cf4d3192cf5186",
        ),
        (
            "7c4e8b1a-0003-4000-8000-000000000001",
            "aabb8643e872e6f17ffa80f79de04bf42774a1462e1594a5b524ab53a0964313",
        ),
    ] {
        let actual: String = db
            .query_row(
                "SELECT fingerprint_hash FROM seed_artifact WHERE artifact_id=?1",
                [id],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(actual, hash);
    }
    let id = "7c4e8b1a-0002-4000-8000-000000000001";
    db.execute("UPDATE ingredient SET name='My sauce' WHERE id=?1", [id])
        .unwrap();
    db.execute(
        "UPDATE seed_artifact SET seed_version='1.2.0' WHERE artifact_id=?1",
        [id],
    )
    .unwrap();
    assert_eq!(seed_catalog(&mut db).unwrap(), (0, 0));
    let name: String = db
        .query_row("SELECT name FROM ingredient WHERE id=?1", [id], |r| {
            r.get(0)
        })
        .unwrap();
    assert_eq!(name, "My sauce");
}

#[test]
fn concurrent_account_handles_share_writes_and_other_owners_remain_isolated() {
    let dir = tempfile::tempdir().unwrap();
    let mut first =
        open_account(dir.path(), "aaaaaaaaaaaaaaa", DatabaseFlavor::Production).unwrap();
    seed_catalog(&mut first).unwrap();
    let second = open_account(dir.path(), "aaaaaaaaaaaaaaa", DatabaseFlavor::Production).unwrap();
    let other = open_account(dir.path(), "bbbbbbbbbbbbbbb", DatabaseFlavor::Production).unwrap();
    let before: i64 = value(&second, "SELECT change_version FROM sync_workspace");
    first
        .execute(
            "UPDATE ingredient SET name='Updated' WHERE id='7c4e8b1a-0002-4000-8000-000000000001'",
            [],
        )
        .unwrap();
    assert_eq!(
        value::<i64>(&second, "SELECT change_version FROM sync_workspace"),
        before + 1
    );
    assert_eq!(value::<i64>(&other, "SELECT count(*) FROM ingredient"), 0);
    assert_eq!(value::<i64>(&second, "PRAGMA user_version"), SCHEMA_VERSION);
    assert_eq!(value::<i64>(&second, "PRAGMA foreign_keys"), 1);
    assert_eq!(value::<String>(&second, "PRAGMA journal_mode"), "wal");
    assert!(
        dir.path()
            .join("healthmate_aaaaaaaaaaaaaaaSQLite.db")
            .is_file()
    );
    assert!(matches!(
        open_account(dir.path(), "../../outside", DatabaseFlavor::Production),
        Err(Error::InvalidOwner)
    ));
}

#[test]
fn a_v12_database_is_upgraded_without_removing_its_rows() {
    let mut db = Connection::open_in_memory().unwrap();
    for sql in [
        include_str!("../migrations/01.sql"),
        include_str!("../migrations/02.sql"),
        include_str!("../migrations/03.sql"),
        include_str!("../migrations/04.sql"),
        include_str!("../migrations/05.sql"),
        include_str!("../migrations/06.sql"),
        include_str!("../migrations/07.sql"),
        include_str!("../migrations/08.sql"),
        include_str!("../migrations/09.sql"),
        include_str!("../migrations/10.sql"),
        include_str!("../migrations/12.sql"),
    ] {
        db.execute_batch(sql).unwrap();
    }
    db.execute_batch(
        "PRAGMA user_version=12; INSERT INTO app_config(key,value) VALUES ('installed','yes')",
    )
    .unwrap();
    initialize(&mut db).unwrap();
    assert_eq!(
        value::<String>(&db, "SELECT value FROM app_config WHERE key='installed'"),
        "yes"
    );
    assert_eq!(
        value::<i64>(
            &db,
            "SELECT count(*) FROM pragma_table_info('workout_session') WHERE name='origin'"
        ),
        1
    );
    initialize(&mut db).unwrap();
}

#[test]
fn a_newer_database_is_not_downgraded() {
    let mut db = Connection::open_in_memory().unwrap();
    db.pragma_update(None, "user_version", 99).unwrap();
    assert!(matches!(
        initialize(&mut db),
        Err(Error::UnsupportedSchema(99))
    ));
    assert_eq!(value::<i64>(&db, "SELECT COUNT(*) FROM sqlite_master"), 0);
    assert_eq!(value::<i64>(&db, "PRAGMA user_version"), 99);
}
