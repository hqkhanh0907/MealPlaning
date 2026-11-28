use healthmate_server::{Server, copy_database};
use reqwest::{Client, Method, StatusCode};
use rusqlite::Connection;
use serde_json::{Value, json};
use std::path::Path;
use tempfile::TempDir;
use tokio::{net::TcpListener, task::JoinHandle};
use uuid::Uuid;

const REGISTER: &str = "/api/collections/users/records";
const LOGIN: &str = "/api/collections/users/auth-with-password";
const TOKEN: &str = "/api/mealplan/session";
const WS: &str = "/api/mealplan/workspace";
const OPS_LOGIN: &str = "/api/collections/mealplan_operators/auth-with-password";
const OPS: &str = "/api/mealplan-ops/status";
const PASS: &str = "a synthetic passphrase";
const RELEASE: &str = "0123456789abcdef0123456789abcdef01234567";

struct App {
    tmp: TempDir,
    server: Server,
    client: Client,
    public: String,
    private: String,
    tasks: [JoinHandle<()>; 2],
}
impl Drop for App {
    fn drop(&mut self) {
        for t in &self.tasks {
            t.abort();
        }
    }
}
impl App {
    async fn new() -> Self {
        let tmp = TempDir::new().unwrap();
        let server = Server::open(tmp.path().join("data.db"), RELEASE).unwrap();
        let (public, pub_task) = listen(server.public_router()).await;
        let (private, priv_task) = listen(server.private_router()).await;
        Self {
            server,
            tmp,
            public,
            private,
            client: Client::new(),
            tasks: [pub_task, priv_task],
        }
    }
    async fn request(
        &self,
        private: bool,
        method: Method,
        route: &str,
        token: &str,
        body: Option<Value>,
        expected: StatusCode,
    ) -> Value {
        let address = if private { &self.private } else { &self.public };
        let mut req = self.client.request(method, format!("{address}{route}"));
        if !token.is_empty() {
            req = req.header("Authorization", token);
        }
        if let Some(body) = body {
            req = req.json(&body);
        }
        let response = req.send().await.unwrap();
        let status = response.status();
        let bytes = response.bytes().await.unwrap();
        let payload = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
        assert_eq!(status, expected, "{route}: {payload}");
        payload
    }
    async fn signup(&self, username: &str, name: &str) -> Value {
        self.request(
            false,
            Method::POST,
            REGISTER,
            "",
            Some(json!({"username":username,"password":PASS,"passwordConfirm":PASS,"name":name})),
            StatusCode::OK,
        )
        .await
    }
    async fn signin(&self, username: &str, device: &str) -> Value {
        self.request(
            false,
            Method::POST,
            TOKEN,
            "",
            Some(json!({"username":username,"password":PASS,"deviceLabel":device})),
            StatusCode::OK,
        )
        .await
    }
}
async fn listen(router: axum::Router) -> (String, JoinHandle<()>) {
    let socket = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = format!("http://{}", socket.local_addr().unwrap());
    (
        address,
        tokio::spawn(async move { axum::serve(socket, router).await.unwrap() }),
    )
}
fn item(value: &Value, key: &str) -> String {
    value[key].as_str().unwrap().to_owned()
}
fn empty() -> Value {
    let schema: Value =
        serde_json::from_str(include_str!("../../../server/pb_hooks/sync-schema.json")).unwrap();
    let tables: serde_json::Map<String, Value> = schema
        .as_object()
        .unwrap()
        .keys()
        .map(|k| (k.clone(), json!([])))
        .collect();
    json!({"schemaVersion":13,"tables":tables})
}

#[tokio::test]
async fn private_operators_only_receive_aggregates() {
    let app = App::new().await;
    let account = app.signup("account_one", "An Fixture").await;
    let access = app.signin("account_one", "phone").await;
    let token = item(&access, "accessToken");
    app.server
        .provision_operator("operator@example.test", PASS)
        .unwrap();
    let credentials = json!({"identity":"operator@example.test","password":PASS});
    app.request(
        false,
        Method::POST,
        OPS_LOGIN,
        "",
        Some(credentials.clone()),
        StatusCode::NOT_FOUND,
    )
    .await;
    let signed = app
        .request(
            true,
            Method::POST,
            OPS_LOGIN,
            "",
            Some(credentials),
            StatusCode::OK,
        )
        .await;
    let operator = item(&signed, "token");
    assert_eq!(signed["record"]["collectionName"], "mealplan_operators");
    app.request(
        false,
        Method::GET,
        OPS,
        &operator,
        None,
        StatusCode::NOT_FOUND,
    )
    .await;
    app.request(
        true,
        Method::GET,
        OPS,
        &token,
        None,
        StatusCode::UNAUTHORIZED,
    )
    .await;
    app.request(
        true,
        Method::GET,
        WS,
        &operator,
        None,
        StatusCode::UNAUTHORIZED,
    )
    .await;
    app.request(
        true,
        Method::POST,
        REGISTER,
        &operator,
        Some(json!({})),
        StatusCode::FORBIDDEN,
    )
    .await;
    for path in [
        "/api/collections/users/records",
        "/api/collections/mealplan_workspaces/records",
        "/api/logs",
    ] {
        app.request(
            true,
            Method::GET,
            path,
            &operator,
            None,
            StatusCode::NOT_FOUND,
        )
        .await;
    }
    let written =
        json!({"baseRevision":0,"operationId":Uuid::new_v4().to_string(),"snapshot":empty()});
    app.request(
        false,
        Method::POST,
        WS,
        &token,
        Some(written),
        StatusCode::OK,
    )
    .await;
    app.request(false, Method::GET, WS, &token, None, StatusCode::OK)
        .await;
    app.request(
        false,
        Method::POST,
        WS,
        &token,
        Some(json!({"secret":"should-not-leak"})),
        StatusCode::BAD_REQUEST,
    )
    .await;
    let losing =
        json!({"baseRevision":0,"operationId":Uuid::new_v4().to_string(),"snapshot":empty()});
    app.request(
        false,
        Method::POST,
        WS,
        &token,
        Some(losing),
        StatusCode::CONFLICT,
    )
    .await;
    let report = app
        .request(true, Method::GET, OPS, &operator, None, StatusCode::OK)
        .await;
    assert_eq!(report["release"], RELEASE);
    assert_eq!(
        report["services"],
        json!({"api":"available","database":"available"})
    );
    assert!(
        report["sync"]["lastDownloadAt"].is_string() && report["sync"]["lastUploadAt"].is_string()
    );
    assert_eq!(
        report["syncFailures"]
            .as_array()
            .unwrap()
            .iter()
            .map(|i| i["count"].as_i64().unwrap())
            .collect::<Vec<_>>(),
        vec![1, 1, 0]
    );
    let report = report.to_string();
    for private in [
        item(&account, "id"),
        item(&account, "name"),
        "should-not-leak".into(),
        token,
        operator.clone(),
    ] {
        assert!(!report.contains(&private));
    }
    app.server
        .provision_operator("operator@example.test", "another synthetic password")
        .unwrap();
    app.request(
        true,
        Method::GET,
        OPS,
        &operator,
        None,
        StatusCode::UNAUTHORIZED,
    )
    .await;
}

#[tokio::test]
async fn one_time_exchange_and_device_revocation_are_owner_scoped() {
    let app = App::new().await;
    let an = app.signup("account_an", "  Nguyễn An  ").await;
    app.signup("account_binh", "Bình").await;
    let id = item(&an, "id");
    assert!(
        id.len() == 15
            && id
                .bytes()
                .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit())
    );
    let login = app
        .request(
            false,
            Method::POST,
            LOGIN,
            "",
            Some(json!({"identity":"account_an","password":PASS})),
            StatusCode::OK,
        )
        .await;
    let login = item(&login, "token");
    let p1 = app
        .client
        .post(format!("{}{TOKEN}", app.public))
        .bearer_auth(&login)
        .json(&json!({}))
        .send();
    let p2 = app
        .client
        .post(format!("{}{TOKEN}", app.public))
        .bearer_auth(&login)
        .json(&json!({}))
        .send();
    let (r1, r2) = tokio::join!(p1, p2);
    let (r1, r2) = (r1.unwrap(), r2.unwrap());
    assert!(matches!(
        (r1.status().as_u16(), r2.status().as_u16()),
        (200, 401) | (401, 200)
    ));
    let first: Value = if r1.status().is_success() { r1 } else { r2 }
        .json()
        .await
        .unwrap();
    let second = app.signin("account_an", "  Máy\n hai  ").await;
    let other = app.signin("account_binh", "Bình").await;
    let bearer = item(&first, "accessToken");
    let target = item(&second, "accessToken");
    let sid = item(&second, "sessionToken");
    let devices = app
        .request(
            false,
            Method::GET,
            "/api/mealplan/sessions",
            &bearer,
            None,
            StatusCode::OK,
        )
        .await;
    let list = devices["devices"].as_array().unwrap();
    assert_eq!(list.len(), 2);
    assert_eq!(list[0]["current"], true);
    assert_eq!(list[1]["label"], "Máy hai");
    assert!(Uuid::parse_str(&item(&list[1], "id")).is_ok());
    let revoke = "/api/mealplan/sessions/revoke";
    app.request(
        false,
        Method::POST,
        revoke,
        &item(&other, "accessToken"),
        Some(json!({"id":list[1]["id"]})),
        StatusCode::NOT_FOUND,
    )
    .await;
    app.request(
        false,
        Method::POST,
        revoke,
        &bearer,
        Some(json!({"id":list[0]["id"]})),
        StatusCode::CONFLICT,
    )
    .await;
    for _ in 0..2 {
        app.request(
            false,
            Method::POST,
            revoke,
            &bearer,
            Some(json!({"id":list[1]["id"]})),
            StatusCode::NO_CONTENT,
        )
        .await;
    }
    let denied = app
        .request(
            false,
            Method::GET,
            WS,
            &target,
            None,
            StatusCode::UNAUTHORIZED,
        )
        .await;
    assert_eq!(denied["data"]["code"], "session_revoked");
    app.request(
        false,
        Method::POST,
        "/api/mealplan/session/refresh",
        "",
        Some(json!({"sessionToken":sid})),
        StatusCode::UNAUTHORIZED,
    )
    .await;
    let name = app
        .request(
            false,
            Method::POST,
            "/api/mealplan/profile",
            &bearer,
            Some(json!({"name":"An","ownerId":other["ownerId"]})),
            StatusCode::OK,
        )
        .await;
    assert_eq!(
        name,
        json!({"name":"An","username":"account_an","ownerId":id})
    );
    let db = Connection::open(app.tmp.path().join("data.db")).unwrap();
    let secret: String = db
        .query_row("SELECT password FROM users WHERE id=?1", [id], |r| r.get(0))
        .unwrap();
    assert!(secret.starts_with("$argon2id$"));
    let stored: String = db
        .query_row("SELECT digest FROM mealplan_access LIMIT 1", [], |r| {
            r.get(0)
        })
        .unwrap();
    assert!(stored.len() == 64 && stored.bytes().all(|c| c.is_ascii_hexdigit()));
}

#[tokio::test]
async fn exact_public_paths_cors_rate_and_body_limits_apply() {
    let app = App::new().await;
    for path in [
        "/mealplan-admin.html",
        "/mealplan-admin.css",
        "/mealplan-admin.js",
        "/health?unexpected=1",
        "/api/mealplan/workspace?schema=13&metadata=1",
    ] {
        app.request(false, Method::GET, path, "", None, StatusCode::NOT_FOUND)
            .await;
    }
    let private = app
        .client
        .get(format!("{}/mealplan-admin.html", app.private))
        .send()
        .await
        .unwrap();
    assert_eq!(private.status(), 200);
    assert!(private.text().await.unwrap().contains("Đăng nhập vận hành"));
    let health = app
        .client
        .get(format!("{}/health", app.public))
        .header("Origin", "https://other.invalid")
        .send()
        .await
        .unwrap();
    assert_eq!(health.status(), 403);
    let preflight = app
        .client
        .request(Method::OPTIONS, format!("{}{WS}", app.public))
        .header("Origin", "https://localhost")
        .header("Access-Control-Request-Method", "POST")
        .send()
        .await
        .unwrap();
    assert_eq!(preflight.status(), 204);
    assert_eq!(
        preflight.headers()["access-control-allow-origin"],
        "https://localhost"
    );
    let large = app
        .client
        .post(format!("{}{WS}", app.public))
        .body(vec![b' '; 4_500_001])
        .send()
        .await
        .unwrap();
    assert_eq!(large.status(), 413);
    let mut accepted = 0;
    loop {
        let result = app
            .client
            .post(format!("{}{TOKEN}", app.public))
            .json(&json!({}))
            .send()
            .await
            .unwrap();
        if result.status() == StatusCode::TOO_MANY_REQUESTS {
            break;
        }
        assert_eq!(result.status(), StatusCode::UNAUTHORIZED);
        accepted += 1;
        assert!(accepted <= 72);
    }
    assert!(accepted >= 36);
}

#[tokio::test]
async fn online_backup_restores_workspace_receipts_and_session_without_overwrite() {
    let app = App::new().await;
    app.signup("backup_fixture", "Backup").await;
    let token = item(&app.signin("backup_fixture", "phone").await, "accessToken");
    let body =
        json!({"baseRevision":0,"operationId":Uuid::new_v4().to_string(),"snapshot":empty()});
    let receipt = app
        .request(
            false,
            Method::POST,
            WS,
            &token,
            Some(body.clone()),
            StatusCode::OK,
        )
        .await;
    let backup = app.tmp.path().join("backup.db");
    let restored = app.tmp.path().join("restored.db");
    copy_database(&app.tmp.path().join("data.db"), &backup).unwrap();
    assert!(copy_database(&app.tmp.path().join("data.db"), &backup).is_err());
    copy_database(&backup, &restored).unwrap();
    let (url, task) = listen(Server::open(restored, "").unwrap().public_router()).await;
    let response = app
        .client
        .post(format!("{url}{WS}"))
        .bearer_auth(&token)
        .json(&body)
        .send()
        .await
        .unwrap();
    assert_eq!(response.status(), 200);
    assert_eq!(response.json::<Value>().await.unwrap(), receipt);
    task.abort();
}

#[test]
fn refuses_an_unrelated_database() {
    let tmp = tempfile::tempdir().unwrap();
    let file = tmp.path().join("existing.db");
    let conn = Connection::open(&file).unwrap();
    conn.execute("CREATE TABLE other(v)", []).unwrap();
    drop(conn);
    assert!(Server::open(&file, "").is_err());
    assert!(copy_database(&file, Path::new("irrelevant")).is_err());
}

#[tokio::test]
async fn operator_page_signs_in_refreshes_and_revokes_without_storing_a_browser_cookie() {
    let app = App::new().await;
    app.server
        .provision_operator("ops@example.test", "synthetic-passphrase-42")
        .unwrap();
    let path = format!("{}/mealplan-admin.html", app.private);
    let post = |body: String| {
        app.client
            .post(&path)
            .header("content-type", "application/x-www-form-urlencoded")
            .body(body)
    };
    let bad = post("action=login&email=ops%40example.test&password=wrong".into())
        .send()
        .await
        .unwrap();
    assert!(bad.status().is_client_error());
    assert!(bad.text().await.unwrap().contains("Đăng nhập vận hành"));
    let session =
        post("action=login&email=ops%40example.test&password=synthetic-passphrase-42".into())
            .send()
            .await
            .unwrap();
    assert_eq!(session.status(), 200);
    assert_eq!(session.headers()["cache-control"], "no-store");
    assert!(session.headers().get("set-cookie").is_none());
    let body = session.text().await.unwrap();
    assert!(body.contains("Trạng thái hệ thống"));
    assert!(!body.contains("synthetic-passphrase-42"));
    let token = body
        .split_once("name=\"token\" value=\"")
        .unwrap()
        .1
        .split('"')
        .next()
        .unwrap();
    let refresh = format!("action=refresh&token={token}");
    let live = post(refresh.clone()).send().await.unwrap();
    assert_eq!(live.status(), 200);
    assert!(live.text().await.unwrap().contains("Xung đột dữ liệu"));
    let closed = post(format!("action=logout&token={token}"))
        .send()
        .await
        .unwrap();
    assert_eq!(closed.status(), 200);
    assert!(closed.text().await.unwrap().contains("Đã đăng xuất."));
    let expired = post(refresh).send().await.unwrap();
    assert!(expired.status().is_client_error());
    let public = app
        .client
        .post(format!("{}/mealplan-admin.html", app.public))
        .send()
        .await
        .unwrap();
    assert_eq!(public.status(), 404);
}

#[tokio::test]
#[ignore = "requires PocketBase 0.40.6 for the migration fixture"]
async fn imports_real_pocketbase_credentials_workspace_and_device_session() {
    use std::{
        path::Path,
        process::{Child, Command, Stdio},
    };
    struct Legacy(Child);
    impl Drop for Legacy {
        fn drop(&mut self) {
            let _ = self.0.kill();
            let _ = self.0.wait();
        }
    }
    let fixture = tempfile::tempdir().unwrap();
    let old = fixture.path().join("pb_data");
    let legacy_bin =
        std::env::var("POCKETBASE_BIN").expect("set POCKETBASE_BIN to PocketBase 0.40.6");
    let cwd = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../server");
    let dir = format!("--dir={}", old.display());
    let reserve = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
    let addr = reserve.local_addr().unwrap();
    drop(reserve);
    let legacy = Legacy(
        Command::new(&legacy_bin)
            .current_dir(&cwd)
            .args([
                "serve",
                &format!("--http={addr}"),
                &dir,
                "--hooksWatch=false",
                "--hooksDir=pb_hooks",
                "--migrationsDir=pb_migrations",
            ])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .unwrap(),
    );
    let client = Client::new();
    let base = format!("http://{addr}");
    let mut healthy = false;
    for _ in 0..100 {
        if let Ok(resp) = client.get(format!("{base}/health")).send().await
            && resp.status() == 200
        {
            healthy = true;
            break;
        }
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    }
    assert!(healthy, "PocketBase did not load HealthMate hooks");
    let signup = client
        .post(format!("{base}{REGISTER}"))
        .json(&json!({"username":"an_import","name":"An","password":PASS,"passwordConfirm":PASS}))
        .send()
        .await
        .unwrap()
        .error_for_status()
        .unwrap()
        .json::<Value>()
        .await
        .unwrap();
    let credentials = json!({"username":"an_import","password":PASS});
    let old_session = client
        .post(format!("{base}/api/mealplan/session"))
        .json(&credentials)
        .send()
        .await
        .unwrap()
        .error_for_status()
        .unwrap()
        .json::<Value>()
        .await
        .unwrap();
    let payload =
        json!({"operationId":Uuid::new_v4().to_string(),"baseRevision":0,"snapshot":empty()});
    let original = client
        .post(format!("{base}{WS}"))
        .header(
            "Authorization",
            old_session["accessToken"].as_str().unwrap(),
        )
        .json(&payload)
        .send()
        .await
        .unwrap()
        .error_for_status()
        .unwrap()
        .json::<Value>()
        .await
        .unwrap();
    assert_eq!(original["revision"], 1);
    drop(legacy);
    let source = old.join("data.db");
    let copy = fixture.path().join("healthmate.sqlite3");
    let counts = healthmate_server::import_pocketbase(&source, &copy).unwrap();
    assert!(counts.contains(&("mealplan_receipts", 1)));
    assert!(healthmate_server::import_pocketbase(&source, &copy).is_err());
    let server = Server::open(copy, RELEASE).unwrap();
    let (public, task) = listen(server.public_router()).await;
    let new_session = client
        .post(format!("{public}/api/mealplan/session"))
        .json(&credentials)
        .send()
        .await
        .unwrap()
        .error_for_status()
        .unwrap()
        .json::<Value>()
        .await
        .unwrap();
    assert_eq!(new_session["ownerId"], signup["id"]);
    let refreshed = client
        .post(format!("{public}/api/mealplan/session/refresh"))
        .json(&json!({"sessionToken":old_session["sessionToken"]}))
        .send()
        .await
        .unwrap()
        .error_for_status()
        .unwrap()
        .json::<Value>()
        .await
        .unwrap();
    assert_eq!(refreshed["ownerId"], signup["id"]);
    let token = refreshed["accessToken"].as_str().unwrap();
    let replay = client
        .post(format!("{public}{WS}"))
        .header("Authorization", token)
        .json(&payload)
        .send()
        .await
        .unwrap()
        .error_for_status()
        .unwrap()
        .json::<Value>()
        .await
        .unwrap();
    assert_eq!(replay, original);
    let stored = client
        .get(format!("{public}{WS}?schema=13"))
        .header("Authorization", token)
        .send()
        .await
        .unwrap()
        .error_for_status()
        .unwrap()
        .json::<Value>()
        .await
        .unwrap();
    assert_eq!(stored["revision"], 1);
    assert_eq!(stored["snapshot"], payload["snapshot"]);
    task.abort();
}
