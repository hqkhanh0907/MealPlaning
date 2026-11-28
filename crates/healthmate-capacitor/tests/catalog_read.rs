use healthmate_capacitor::{ReadError, catalog_read::read_catalog};
use healthmate_store::{DatabaseFlavor, account_path, open_account};
use rusqlite::{Connection, params};
use serde_json::json;
use std::{
    io::Write,
    path::Path,
    process::{Command, Stdio},
};

const OWNER: &str = "aaaaaaaaaaaaaaa";
const OTHER: &str = "bbbbbbbbbbbbbbb";
const DB: &str = "healthmate_aaaaaaaaaaaaaaa";

fn ingredient(db: &Connection, id: &str, name: &str, source: &str) {
    db.execute("INSERT INTO ingredient(id,name,category,calories,protein,carbs,fat,fiber,source,created_at,updated_at) VALUES (?1,?2,'Khác',112.75,2.25,4,5.125,0,?3,'2026-01-01',NULL)",params![id,name,source]).unwrap();
}

#[test]
fn matches_the_live_typescript_repository_across_all_catalog_reads() {
    let dir = tempfile::tempdir().unwrap();
    let mut db = open_account(dir.path(), OWNER, DatabaseFlavor::Production).unwrap();
    let (ingredients, dishes) = healthmate_store::seed_catalog(&mut db).unwrap();
    assert!(ingredients > 0 && dishes > 0);
    for (id, name, source) in [
        ("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "Đậu  ĐỎ", "manual"),
        ("second", "dau do", "ai"),
        ("third", "Ức GÀ", "db"),
        ("fourth", "Ư\u{301}c   ga\u{300}", "manual"),
        ("wild", "A%_B", "db"),
        ("plain", "AXYB", "db"),
        ("upper", "aXYB", "db"),
        ("white", "Cá\u{feff} kho", "manual"),
        ("nel", "Cá\u{85}kho", "manual"),
        ("notlatin", "深色蔬菜", "manual"),
    ] {
        ingredient(&db, id, name, source);
    }
    for (id, made, updated) in [
        ("d1", "2026-01-02", Some("2026-01-09")),
        ("d2", "2026-01-09", None),
        ("d3", "2026-01-10", None),
    ] {
        db.execute("INSERT INTO dish(id,name,type,source,servings,created_at,updated_at) VALUES(?1,?1,'ingredient_based','custom',2,?2,?3)",params![id,made,updated]).unwrap();
    }
    for (idx, (dish, item)) in [
        ("d1", "third"),
        ("d2", "second"),
        ("d2", "third"),
        ("d3", "wild"),
    ]
    .into_iter()
    .enumerate()
    {
        db.execute("INSERT INTO dish_ingredient(id,dish_id,ingredient_id,gram_weight,sort_order) VALUES(?1,?2,?3,12.5,?4)",params![format!("link-{idx}"),dish,item,idx as i64]).unwrap();
    }
    let first = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    let mut inputs = vec![json!({"op":"list"})];
    for query in [
        "",
        "  ",
        "_",
        "%",
        "A%_B",
        "uc ga",
        " ĐẬU  đỏ ",
        "\u{feff}ca kho",
        "Cá\u{85}kho",
        "ỨC",
        "色",
        "missing",
    ] {
        inputs.push(json!({"op":"searchByName","query":query}));
        inputs.push(json!({"op":"findByExactName","name":query}));
    }
    for limit in [-1, 0, 1, 2, 9] {
        inputs.push(json!({"op":"findRecentlyUsed","limit":limit}));
    }
    for id in [first, "missing", "third", "wild"] {
        inputs.push(json!({"op":"getById","id":id}));
        inputs.push(json!({"op":"countDishReferences","id":id}));
    }
    inputs.extend([
        json!({"op":"findByIds","ids":["missing","wild",first,"wild"]}),
        json!({"op":"findByIds","ids":[]}),
    ]);
    let results: Vec<_> = inputs
        .iter()
        .map(|q| read_catalog(dir.path(), OWNER, DB, q).unwrap()["value"].clone())
        .collect();
    assert!(
        results[0]
            .as_array()
            .unwrap()
            .iter()
            .any(|row| row["source"] == "ai" && row["updated_at"].is_null())
    );
    let fixture = json!({"commands":inputs,"results":results});
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    let mut child = Command::new("node")
        .arg(root.join("src/app/core/account/catalog-read.oracle.cjs"))
        .arg(account_path(dir.path(), OWNER, DatabaseFlavor::Production).unwrap())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    child
        .stdin
        .take()
        .unwrap()
        .write_all(fixture.to_string().as_bytes())
        .unwrap();
    let done = child.wait_with_output().unwrap();
    assert!(
        done.status.success(),
        "{}",
        String::from_utf8_lossy(&done.stderr)
    );
}

#[test]
fn rejects_wrong_binding_and_reads_only_committed_rows() {
    let dir = tempfile::tempdir().unwrap();
    let mut db = open_account(dir.path(), OWNER, DatabaseFlavor::Production).unwrap();
    let second = open_account(dir.path(), OTHER, DatabaseFlavor::Production).unwrap();
    let lookup = json!({"op":"getById","id":"same"});
    ingredient(&db, "same", "Thịt gà", "db");
    ingredient(&second, "same", "Hành", "db");
    let tx = db.transaction().unwrap();
    tx.execute("UPDATE ingredient SET name='Cá' WHERE id='same'", [])
        .unwrap();
    assert_eq!(
        read_catalog(dir.path(), OWNER, DB, &lookup).unwrap()["value"]["name"],
        "Thịt gà"
    );
    assert_eq!(
        read_catalog(dir.path(), OTHER, "healthmate_bbbbbbbbbbbbbbb", &lookup).unwrap()["value"]["name"],
        "Hành"
    );
    assert_eq!(
        read_catalog(dir.path(), OTHER, DB, &lookup),
        Err(ReadError::InvalidSession)
    );
    tx.commit().unwrap();
    assert_eq!(
        read_catalog(dir.path(), OWNER, DB, &lookup).unwrap()["value"]["name"],
        "Cá"
    );
    assert!(read_catalog(dir.path(), OWNER, DB, &json!({"op":"sql","sql":"SELECT 1"})).is_err());
    assert!(
        read_catalog(
            dir.path(),
            OWNER,
            DB,
            &json!({"op":"findRecentlyUsed","limit":1.5})
        )
        .is_err()
    );
    assert!(read_catalog(dir.path(), OWNER, DB, &json!({"op":"findByIds","ids":[2]})).is_err());
    db.pragma_update(None, "user_version", 12).unwrap();
    assert_eq!(
        read_catalog(dir.path(), OWNER, DB, &lookup),
        Err(ReadError::NotReady)
    );
}
