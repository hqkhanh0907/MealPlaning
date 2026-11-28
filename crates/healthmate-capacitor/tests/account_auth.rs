use healthmate_capacitor::account_auth::{AuthError, HttpReply, authenticate};
use serde_json::{Value, json};
use std::{
    io::{BufRead, BufReader, Read, Write},
    net::{TcpListener, TcpStream},
    thread,
};

fn server(
    replies: Vec<Option<(u16, Value)>>,
) -> (String, thread::JoinHandle<Vec<(String, Value)>>) {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let addr = listener.local_addr().unwrap().to_string();
    let task = thread::spawn(move || {
        let mut requests = vec![];
        for reply in replies {
            let (mut sock, _) = listener.accept().unwrap();
            let mut reader = BufReader::new(sock.try_clone().unwrap());
            let mut first = String::new();
            reader.read_line(&mut first).unwrap();
            let mut size = 0;
            loop {
                let mut line = String::new();
                reader.read_line(&mut line).unwrap();
                if line == "\r\n" {
                    break;
                }
                if let Some(v) = line.to_ascii_lowercase().strip_prefix("content-length:") {
                    size = v.trim().parse().unwrap();
                }
            }
            let mut body = vec![0; size];
            reader.read_exact(&mut body).unwrap();
            requests.push((
                first.split_whitespace().nth(1).unwrap().into(),
                serde_json::from_slice(&body).unwrap(),
            ));
            if let Some((status, payload)) = reply {
                let body = payload.to_string();
                write!(sock,"HTTP/1.1 {status} Status\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",body.len()).unwrap();
            }
        }
        requests
    });
    (addr, task)
}
fn send(addr: &str, path: &str, body: &str) -> Result<HttpReply, AuthError> {
    let mut sock = TcpStream::connect(addr).map_err(|_| AuthError::network())?;
    write!(
        sock,
        "POST {path} HTTP/1.1\r\nHost: localhost\r\nContent-Length: {}\r\n\r\n{body}",
        body.len()
    )
    .unwrap();
    let mut raw = vec![];
    sock.read_to_end(&mut raw).unwrap();
    let Some(cut) = raw.windows(4).position(|v| v == b"\r\n\r\n") else {
        return Err(AuthError::network());
    };
    let head = std::str::from_utf8(&raw[..cut]).unwrap();
    let status = head.split_whitespace().nth(1).unwrap().parse().unwrap();
    Ok(HttpReply {
        status,
        status_text: "Status".into(),
        body: raw[cut + 4..].into(),
    })
}
fn grant() -> Value {
    json!({"ownerId":"aaaaaaaaaaaaaaa","username":"an_42","name":"An Nguyễn","accessToken":"fixture-access","sessionToken":"fixture-session","accessExpiresAt":"2026-11-29T10:00:00Z"})
}

#[test]
fn same_inputs_match_the_web_account_flow_and_its_http_requests() {
    use std::{
        path::Path,
        process::{Command, Stdio},
    };
    let ok = json!([200, grant()]);
    let mut fixtures = Vec::new();
    let limit = "😀".repeat(100);
    let over_limit = format!("{limit}a");
    for (case, display_name, replies) in [
        ("sign in", None, vec![ok.clone()]),
        (
            "register",
            Some("  An Nguyễn  "),
            vec![json!([201, {}]), ok.clone()],
        ),
        ("empty name", Some("\u{feff} "), vec![]),
        ("long name", Some(over_limit.as_str()), vec![]),
        (
            "Unicode name boundary",
            Some(limit.as_str()),
            vec![json!([201, {}]), ok.clone()],
        ),
        (
            "name in use",
            Some("An"),
            vec![json!([400,{"message":"invalid","data":{"name":{},"username":{}}}])],
        ),
        (
            "registration succeeded but grant denied",
            Some("An"),
            vec![
                json!([201, {}]),
                json!([403,{"message":"denied","data":{"code":"forbidden"}}]),
            ],
        ),
        (
            "username error",
            None,
            vec![json!([400,{"data":{"name":false,"username":[]}}])],
        ),
        (
            "wrong password",
            None,
            vec![json!([401,{"message":"Unauthorized"}])],
        ),
    ] {
        let user = "\u{feff} AN_42 \t";
        let password = "  😀mật-khẩu  ";
        let mut calls = Vec::new();
        let reply = authenticate(
            user,
            password,
            display_name,
            "Trình duyệt",
            |path, body| {
                let response = &replies[calls.len()];
                calls.push(json!([path, serde_json::from_str::<Value>(body).unwrap()]));
                Ok(HttpReply {
                    status: response[0].as_u64().unwrap() as u16,
                    status_text: "Fixture".into(),
                    body: serde_json::to_vec(&response[1]).unwrap(),
                })
            },
        );
        let result = match reply {
            Ok(grant) => json!({"identity":grant.public_identity()}),
            Err(e) => json!({"error":[e.status,e.message,e.code,e.field]}),
        };
        fixtures.push(json!({"case":case,"user":user,"password":password,"name":display_name,"replies":replies,"rust":{"result":result,"calls":calls}}));
    }
    let oracle = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../src/app/core/account/account-auth.oracle.cjs");
    let mut child = Command::new("node")
        .arg(oracle)
        .stdin(Stdio::piped())
        .spawn()
        .unwrap();
    serde_json::to_writer(child.stdin.take().unwrap(), &fixtures).unwrap();
    assert!(child.wait().unwrap().success());
}
#[test]
fn registers_and_uses_the_server_grant_without_public_credentials() {
    let (addr, requests) = server(vec![
        Some((201, json!({"id":"ignored"}))),
        Some((200, grant())),
    ]);
    let value = authenticate(
        "\u{feff} AN_42 \n",
        "😀😀😀😀",
        Some("  An Nguyễn  "),
        "Pixel 8",
        |path, body| send(&addr, path, body),
    )
    .unwrap();
    assert_eq!(
        value.public_identity(),
        json!({"id":"aaaaaaaaaaaaaaa","username":"an_42","name":"An Nguyễn"})
    );
    let calls = requests.join().unwrap();
    assert_eq!(
        calls,
        vec![
            (
                "/api/collections/users/records".into(),
                json!({"username":"an_42","password":"😀😀😀😀","passwordConfirm":"😀😀😀😀","name":"An Nguyễn"})
            ),
            (
                "/api/mealplan/session".into(),
                json!({"username":"an_42","password":"😀😀😀😀","deviceLabel":"Pixel 8"})
            )
        ]
    );
}
#[test]
fn failed_registration_never_attempts_login_and_lost_login_does_not_repeat_registration() {
    let (addr, requests) = server(vec![Some((
        400,
        json!({"message":"duplicate","data":{"username":{"code":"validation_not_unique"}}}),
    ))]);
    let err = authenticate("an_42", "fixture", Some("An"), "Android", |p, b| {
        send(&addr, p, b)
    })
    .err()
    .unwrap();
    assert_eq!(
        (err.status, err.field.as_str(), err.code.as_str()),
        (400, "username", "")
    );
    assert_eq!(requests.join().unwrap().len(), 1);
    let (addr, requests) = server(vec![Some((200, json!({}))), None]);
    assert!(
        authenticate("an_42", "fixture", Some("An"), "Android", |p, b| send(
            &addr, p, b
        ))
        .is_err()
    );
    assert_eq!(requests.join().unwrap().len(), 2);
}

#[test]
fn server_error_fields_match_the_angular_account_api() {
    for (body, field, code, message) in [
        (
            json!({"message":"Username is unavailable.","data":{}}),
            "",
            "",
            "Username is unavailable.",
        ),
        (
            json!({"message":"Invalid","data":{"name":{},"username":{},"code":"invalid_name"}}),
            "name",
            "invalid_name",
            "Invalid",
        ),
        (
            json!({"data":{"name":false,"username":[]}}),
            "username",
            "",
            "Status",
        ),
    ] {
        let err = authenticate("an_42", "fixture", Some("An"), "Android", |_, _| {
            Ok(HttpReply {
                status: 400,
                status_text: "Status".into(),
                body: serde_json::to_vec(&body).unwrap(),
            })
        })
        .err()
        .unwrap();
        assert_eq!(
            (
                err.status,
                err.field.as_str(),
                err.code.as_str(),
                err.message.as_str()
            ),
            (400, field, code, message)
        );
    }
}

#[test]
fn rename_uses_only_the_owner_from_a_matching_server_reply() {
    use healthmate_capacitor::account_auth::rename;
    let mut calls = 0;
    let name = rename("aaaaaaaaaaaaaaa", "  An Nguyễn  ", |path, body| {
        calls += 1;
        assert_eq!(path, "/api/mealplan/profile");
        assert_eq!(
            serde_json::from_str::<Value>(body).unwrap(),
            json!({"name":"An Nguyễn"})
        );
        Ok(HttpReply {
            status: 200,
            status_text: String::new(),
            body: serde_json::to_vec(&json!({"ownerId":"aaaaaaaaaaaaaaa","name":"An Nguyễn"}))
                .unwrap(),
        })
    })
    .unwrap();
    assert_eq!(calls, 1);
    assert_eq!(name.as_deref(), Some("An Nguyễn"));
    assert!(
        rename("aaaaaaaaaaaaaaa", "An", |_, _| Ok(HttpReply {
            status: 200,
            status_text: String::new(),
            body: r#"{"ownerId":"bbbbbbbbbbbbbbb","name":"Bình"}"#.as_bytes().to_vec()
        }))
        .unwrap()
        .is_none()
    );
    assert!(
        rename("aaaaaaaaaaaaaaa", "\u{feff} ", |_, _| panic!(
            "must validate before HTTP"
        ))
        .is_err()
    );
}
#[test]
fn preserves_http_permissions_and_rejects_incomplete_or_mismatched_grants() {
    let denied = authenticate("an_42", "fixture", None, "Android", |_, _| {
        Ok(HttpReply {
            status: 403,
            status_text: "Forbidden".into(),
            body: br#"{"message":"denied","data":{"code":"account_forbidden"}}"#.to_vec(),
        })
    })
    .err()
    .unwrap();
    assert_eq!(
        (denied.status, denied.code.as_str()),
        (403, "account_forbidden")
    );
    for (key, value) in [
        ("ownerId", json!("wrong")),
        ("username", json!("different")),
        ("accessToken", json!("")),
        ("sessionToken", json!(null)),
        ("accessExpiresAt", json!("")),
    ] {
        let mut bad = grant();
        bad[key] = value;
        assert!(
            authenticate("an_42", "fixture", None, "Android", |_, _| Ok(HttpReply {
                status: 200,
                status_text: String::new(),
                body: serde_json::to_vec(&bad).unwrap()
            }))
            .is_err()
        );
    }
    assert!(
        authenticate("an_42", "fixture", Some("   "), "Android", |_, _| panic!(
            "no network before valid name"
        ))
        .is_err()
    );
}
