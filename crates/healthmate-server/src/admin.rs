use crate::{
    Server, auth, db,
    error::{ApiError, Result},
    operations,
};
use axum::{
    body::to_bytes,
    extract::Request,
    http::{Method, StatusCode, header},
    response::{Html, IntoResponse, Response},
};
use rusqlite::params;
use serde::Deserialize;
use serde_json::{Value, json};
use std::time::Duration;

#[derive(Deserialize)]
struct Form {
    action: String,
    email: Option<String>,
    password: Option<String>,
    token: Option<String>,
}

fn escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

fn page(status: StatusCode, content: String) -> Response {
    let html = format!(
        r#"<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer"><meta name="robots" content="noindex,nofollow">
<title>Vận hành MealPlaning</title><link rel="stylesheet" href="/mealplan-admin.css"></head>
<body><header class="site-header"><div class="frame site-header-inner"><span class="wordmark">MealPlaning</span><span class="site-section">Vận hành</span></div></header>
<main class="frame">{content}</main></body></html>"#
    );
    (status, [(header::CONTENT_SECURITY_POLICY,"default-src 'none'; style-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'")], Html(html)).into_response()
}

fn login(status: StatusCode, message: &str) -> Response {
    page(
        status,
        format!(
            r#"<section class="sign-in"><div><h1>Đăng nhập vận hành</h1><p>Dùng tài khoản vận hành để xem trạng thái dịch vụ.</p></div>
<form class="sign-in-form" method="post" action="/mealplan-admin.html">
<input type="hidden" name="action" value="login">
<div class="input-wrapper"><label class="input-label" for="email">Email</label><input class="input-native" id="email" name="email" type="email" autocomplete="username" required></div>
<div class="input-wrapper"><label class="input-label" for="password">Mật khẩu</label><input class="input-native" id="password" name="password" type="password" autocomplete="current-password" required></div>
<p class="feedback" role="status">{}</p><button type="submit">Đăng nhập</button></form></section>"#,
            escape(message)
        ),
    )
}

fn timestamp(value: &Value) -> String {
    value
        .as_str()
        .and_then(|v| chrono::DateTime::parse_from_rfc3339(v).ok())
        .map(|v| v.to_utc().format("%d/%m/%Y %H:%M:%S UTC").to_string())
        .unwrap_or_else(|| "Chưa có".into())
}

fn dashboard(data: &Value, token: &str) -> Response {
    let state = |key: &str| {
        if data["services"][key] == "available" {
            "Hoạt động"
        } else {
            "Chưa xác minh"
        }
    };
    let errors = [
        ("conflict", "Xung đột dữ liệu"),
        ("invalid_request", "Yêu cầu không hợp lệ"),
        ("unavailable", "Không xử lý được"),
    ]
    .into_iter()
    .map(|(code, label)| {
        let record = data["syncFailures"]
            .as_array()
            .and_then(|list| list.iter().find(|v| v["code"] == code));
        let count = record.and_then(|v| v["count"].as_i64()).unwrap_or(0);
        let last = record
            .filter(|v| !v["lastSeenAt"].is_null())
            .map(|v| timestamp(&v["lastSeenAt"]))
            .unwrap_or_else(|| "Chưa ghi nhận".into());
        format!("<li><strong>{label}</strong><span>{count} lần</span><small>{last}</small></li>")
    })
    .collect::<String>();
    page(
        StatusCode::OK,
        format!(
            r#"<section><div class="status-heading"><div><h1>Trạng thái hệ thống</h1></div>
<form method="post" action="/mealplan-admin.html"><input type="hidden" name="token" value="{}">
<button class="secondary" name="action" value="refresh">Làm mới</button> <button class="secondary" name="action" value="logout">Đăng xuất</button></form></div>
<div class="metrics"><section class="panel"><h2>Dịch vụ</h2><dl class="metrics-list">
<div><dt>API</dt><dd>{}</dd></div><div><dt>Cơ sở dữ liệu</dt><dd>{}</dd></div><div><dt>SHA triển khai</dt><dd><code>{}</code></dd></div></dl></section>
<section class="panel"><h2>Đồng bộ</h2><dl class="metrics-list"><div><dt>Lần gửi thành công gần nhất</dt><dd>{}</dd></div>
<div><dt>Lần nhận thành công gần nhất</dt><dd>{}</dd></div></dl></section></div><section class="panel failures"><h2>Lỗi đồng bộ</h2><ul class="events">{errors}</ul></section></section>"#,
            escape(token),
            state("api"),
            state("database"),
            escape(data["release"].as_str().unwrap_or("—")),
            timestamp(&data["sync"]["lastUploadAt"]),
            timestamp(&data["sync"]["lastDownloadAt"])
        ),
    )
}

pub(crate) async fn handle(server: Server, request: Request) -> Result<Response> {
    if request.method() == Method::GET {
        return Ok(login(StatusCode::OK, ""));
    }
    if !request
        .headers()
        .get(header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .is_some_and(|s| s.split(';').next() == Some("application/x-www-form-urlencoded"))
    {
        return Err(ApiError::bad("Expected a form."));
    }
    let bytes = tokio::time::timeout(Duration::from_secs(10), to_bytes(request.into_body(), 8192))
        .await
        .map_err(|_| ApiError::bad("Request timed out."))?
        .map_err(|_| ApiError::bad("Invalid form."))?;
    let form: Form =
        serde_urlencoded::from_bytes(&bytes).map_err(|_| ApiError::bad("Invalid form."))?;
    if form.action == "login" {
        crate::routes::allow_operator_login(&server)?;
    }
    let permit = server
        .0
        .jobs
        .clone()
        .acquire_owned()
        .await
        .map_err(|_| ApiError::internal())?;
    tokio::task::spawn_blocking(move || {
        let _permit = permit;
        let mut conn = db::open(&server.0.path)?;
        let token = match form.action.as_str() {
            "login" => {
                let credentials = json!({"identity":form.email,"password":form.password});
                match auth::login(&mut conn, &credentials, &server.0.dummy_hash, true) {
                    Ok(r) => r["token"]
                        .as_str()
                        .ok_or_else(ApiError::internal)?
                        .to_owned(),
                    Err(e) if e.status.is_client_error() => {
                        return Ok(login(e.status, "Email hoặc mật khẩu vận hành không đúng."));
                    }
                    Err(e) => return Err(e),
                }
            }
            "refresh" | "logout" => form.token.unwrap_or_default(),
            _ => return Err(ApiError::bad("Unknown form action.")),
        };
        let tx = conn.transaction()?;
        if let Err(e) = auth::operator_access(&tx, &token) {
            if e.status.is_client_error() {
                return Ok(login(
                    e.status,
                    "Phiên đã hết hạn. Đăng nhập lại để tiếp tục.",
                ));
            }
            return Err(e);
        }
        if form.action == "logout" {
            tx.execute(
                "DELETE FROM operator_access WHERE digest=?1",
                params![auth::digest(&token)],
            )?;
            tx.commit()?;
            return Ok(login(StatusCode::OK, "Đã đăng xuất."));
        }
        let data = operations::status(&tx, &server.0.release)?;
        tx.commit()?;
        Ok(dashboard(&data, &token))
    })
    .await
    .map_err(|_| ApiError::internal())?
}
