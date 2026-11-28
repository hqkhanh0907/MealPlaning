use crate::{
    Server, auth, db,
    error::{ApiError, Result},
    operations, workspace,
};
use axum::{
    Json,
    body::{Body, to_bytes},
    extract::Request,
    http::{HeaderMap, HeaderValue, Method, StatusCode, header},
    response::{IntoResponse, Response},
};
use chrono::Utc;
use rusqlite::{Connection, TransactionBehavior};
use serde_json::{Value, json};
use std::{error::Error, time::Duration};

const SIGNUP: &str = "/api/collections/users/records";
const LOGIN: &str = "/api/collections/users/auth-with-password";
const OP_LOGIN: &str = "/api/collections/mealplan_operators/auth-with-password";
const STATUS: &str = "/api/mealplan-ops/status";
const SESSION: &str = "/api/mealplan/session";
const REFRESH: &str = "/api/mealplan/session/refresh";
const DEVICES: &str = "/api/mealplan/sessions";
const REVOKE: &str = "/api/mealplan/sessions/revoke";
const PROFILE: &str = "/api/mealplan/profile";
const LOGOUT: &str = "/api/mealplan/logout";
const WORKSPACE: &str = "/api/mealplan/workspace";
const MAX_BODY: usize = 4_500_000;

fn methods(path: &str, public: bool) -> Option<&'static str> {
    match path {
        "/health"
        | DEVICES
        | "/api/mealplan/workspace?schema=13"
        | "/api/mealplan/workspace?metadata=1" => Some("GET"),
        WORKSPACE => Some("GET, POST"),
        SIGNUP | LOGIN | SESSION | REFRESH | REVOKE | PROFILE | LOGOUT => Some("POST"),
        OP_LOGIN if !public => Some("POST"),
        "/mealplan-admin.html" if !public => Some("GET, POST"),
        STATUS | "/mealplan-admin.css" if !public => Some("GET"),
        _ => None,
    }
}

pub(crate) fn allow_operator_login(state: &Server) -> Result<()> {
    rate_limit(state, OP_LOGIN, false)
}

fn rate_limit(state: &Server, path: &str, public: bool) -> Result<()> {
    let max = if path == OP_LOGIN || public && matches!(path, SIGNUP | LOGIN | SESSION) {
        36
    } else if public && matches!(path, REFRESH | DEVICES | REVOKE) {
        120
    } else {
        return Ok(());
    };
    let now = Utc::now().timestamp() / 60;
    let mut windows = state
        .0
        .auth_windows
        .lock()
        .map_err(|_| ApiError::internal())?;
    let (minute, count) = windows.entry(path.to_owned()).or_insert((now, 0));
    if *minute != now {
        (*minute, *count) = (now, 0);
    }
    *count = count.saturating_add(1);
    if *count > max {
        return Err(ApiError::new(
            StatusCode::TOO_MANY_REQUESTS,
            "Try again in a minute.",
        ));
    }
    Ok(())
}

fn allowed_origin(headers: &HeaderMap, public: bool) -> bool {
    let Some(origin) = headers.get(header::ORIGIN) else {
        return true;
    };
    if origin == "https://localhost" {
        return true;
    }
    if public {
        return false;
    }
    let Some(host) = headers.get(header::HOST).and_then(|v| v.to_str().ok()) else {
        return false;
    };
    origin
        .to_str()
        .is_ok_and(|o| o == format!("http://{host}") || o == format!("https://{host}"))
}

pub(crate) async fn handle(state: Server, request: Request, public: bool) -> Response {
    let origin = request.headers().get(header::ORIGIN).cloned();
    let permitted = allowed_origin(request.headers(), public);
    let mut response = match inner(state, request, public, permitted).await {
        Ok(response) => response,
        Err(error) => error.into_response(),
    };
    let headers = response.headers_mut();
    headers.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    headers.insert(
        header::X_CONTENT_TYPE_OPTIONS,
        HeaderValue::from_static("nosniff"),
    );
    if let Some(origin) = origin.filter(|_| permitted) {
        headers.insert(header::ACCESS_CONTROL_ALLOW_ORIGIN, origin);
        headers.insert(header::VARY, HeaderValue::from_static("Origin"));
    }
    response
}

async fn inner(state: Server, request: Request, public: bool, origin_ok: bool) -> Result<Response> {
    let raw = request.uri().path_and_query().map_or("/", |q| q.as_str());
    let allowed =
        methods(raw, public).ok_or_else(|| ApiError::new(StatusCode::NOT_FOUND, "Not found."))?;
    let method = request.method().clone();
    if method != Method::OPTIONS && !allowed.split(", ").any(|m| m == method.as_str()) {
        return Err(ApiError::new(StatusCode::NOT_FOUND, "Not found."));
    }
    if !origin_ok {
        return Err(ApiError::new(StatusCode::FORBIDDEN, "Origin not allowed."));
    }
    if method == Method::OPTIONS {
        if let Some(requested) = request.headers().get(header::ACCESS_CONTROL_REQUEST_METHOD)
            && !allowed.split(", ").any(|m| requested == m)
        {
            return Err(ApiError::new(StatusCode::NOT_FOUND, "Not found."));
        }
        return Ok((
            StatusCode::NO_CONTENT,
            [
                (header::ACCESS_CONTROL_ALLOW_METHODS, allowed),
                (
                    header::ACCESS_CONTROL_ALLOW_HEADERS,
                    "Authorization, Content-Type",
                ),
            ],
        )
            .into_response());
    }
    rate_limit(&state, raw, public)?;
    let path = request.uri().path().to_owned();
    if !public && path == "/mealplan-admin.html" {
        return crate::admin::handle(state, request).await;
    }
    if !public && method == Method::GET {
        let asset = match path.as_str() {
            "/mealplan-admin.css" => Some((
                "text/css; charset=utf-8",
                include_str!("../../../server/pb_public/mealplan-admin.css"),
            )),
            _ => None,
        };
        if let Some((mime, data)) = asset {
            return Ok(([(header::CONTENT_TYPE, mime)], data).into_response());
        }
    }
    let token = auth::bearer(
        request
            .headers()
            .get(header::AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
            .unwrap_or(""),
    )
    .to_owned();
    let metadata = raw.ends_with("?metadata=1");
    let version = if raw.ends_with("?schema=13") { 13 } else { 12 };
    let permit = state
        .0
        .jobs
        .clone()
        .acquire_owned()
        .await
        .map_err(|_| ApiError::internal())?;
    let bytes = tokio::time::timeout(
        Duration::from_secs(20),
        to_bytes(request.into_body(), MAX_BODY),
    )
    .await
    .map_err(|_| ApiError::new(StatusCode::REQUEST_TIMEOUT, "Request timed out."))?
    .map_err(|e| {
        if e.source()
            .is_some_and(|s| s.is::<http_body_util::LengthLimitError>())
        {
            ApiError::new(StatusCode::PAYLOAD_TOO_LARGE, "Request too large.")
        } else {
            ApiError::bad("Incomplete request.")
        }
    })?;
    let body = if method == Method::POST && !bytes.is_empty() {
        serde_json::from_slice(&bytes).map_err(|_| ApiError::bad("Invalid request body."))?
    } else {
        json!({})
    };
    let result=tokio::task::spawn_blocking(move || {
        let _permit=permit;
        let mut conn=db::open(&state.0.path)?;
        let data=match path.as_str(){
            "/health"=>{
                let _:i64=conn.query_row("SELECT 1",[],|r|r.get(0))?;
                Some(json!({"service":"mealplaning","release":if state.0.release.is_empty(){"local"}else{&state.0.release},
                    "requestId":&uuid::Uuid::new_v4().simple().to_string()[..24],"database":true}))
            },
            SIGNUP=>Some(auth::signup(&conn,&token,&body)?),
            LOGIN|OP_LOGIN=>Some(auth::login(&mut conn,&body,&state.0.dummy_hash,path==OP_LOGIN)?),
            SESSION=>Some(auth::exchange(&mut conn,&token,&body,&state.0.dummy_hash)?),
            REFRESH=>Some(auth::refresh(&mut conn,&body)?),
            STATUS=>{
                let tx=conn.transaction()?;
                auth::operator_access(&tx,&token)?;
                let result=operations::status(&tx,&state.0.release)?;
                tx.commit()?;
                Some(result)
            },
            WORKSPACE=>Some(workspace_request(&mut conn,&token,&method,&body,metadata,version)?),
            DEVICES|REVOKE|PROFILE|LOGOUT=>{
                let behavior=if path==DEVICES {TransactionBehavior::Deferred} else {TransactionBehavior::Immediate};
                let tx=conn.transaction_with_behavior(behavior)?;
                let result=match path.as_str(){
                    DEVICES=>Some(auth::devices(&tx,&token)?),
                    REVOKE=>{auth::revoke(&tx,&token,&body)?; None},
                    PROFILE=>Some(auth::profile(&tx,&token,&body)?),
                    _=>{auth::logout(&tx,&token,&body)?; None}
                };
                tx.commit()?;
                result
            },
            _=>return Err(ApiError::new(StatusCode::NOT_FOUND,"Not found."))
        };
        Ok(data)
    }).await.map_err(|_|ApiError::internal())??;
    Ok(match result {
        Some(data) => Json(data).into_response(),
        None => (StatusCode::NO_CONTENT, Body::empty()).into_response(),
    })
}

fn workspace_request(
    db: &mut Connection,
    token: &str,
    method: &Method,
    body: &Value,
    metadata: bool,
    version: i64,
) -> Result<Value> {
    let write = method == Method::POST;
    let tx = db.transaction_with_behavior(if write {
        TransactionBehavior::Immediate
    } else {
        TransactionBehavior::Deferred
    })?;
    let (user, _) = auth::access(&tx, token)?;
    let data = if write {
        workspace::write(&tx, &user.id, body)
    } else {
        workspace::read(&tx, &user.id, metadata, version)
    };
    let result = match data {
        Ok(data) => tx.commit().map(|_| data).map_err(ApiError::from),
        Err(e) => {
            drop(tx);
            Err(e)
        }
    };
    let code = match &result {
        Ok(_) if write => Some("upload"),
        Ok(_) if !metadata => Some("download"),
        Ok(_) => None,
        Err(e) => Some(match e.status {
            StatusCode::CONFLICT => "conflict",
            StatusCode::BAD_REQUEST => "invalid_request",
            _ => "unavailable",
        }),
    };
    if let Some(code) = code {
        operations::record(db, code);
    }
    result
}
