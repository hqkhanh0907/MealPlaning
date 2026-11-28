use crate::error::{ApiError, Result};
use argon2::{
    Argon2,
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
};
use axum::http::StatusCode;
use chrono::{DateTime, SecondsFormat, Utc};
use rand::{Rng, RngCore, rngs::OsRng};
use rusqlite::{Connection, OptionalExtension, Transaction, TransactionBehavior, params};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use uuid::Uuid;

const ACCESS_SECONDS: i64 = 3600;
const SESSION_SECONDS: i64 = 90 * 86400;

pub(crate) fn digest(value: &str) -> String {
    hex::encode(Sha256::digest(value.as_bytes()))
}

fn secret(prefix: &str) -> String {
    let mut bytes = [0; 32];
    OsRng.fill_bytes(&mut bytes);
    format!("{prefix}{}", hex::encode(bytes))
}

fn id() -> String {
    let alphabet = b"abcdefghijklmnopqrstuvwxyz0123456789";
    (0..15)
        .map(|_| char::from(alphabet[OsRng.gen_range(0..alphabet.len())]))
        .collect()
}

pub(crate) fn hash_password(value: &str) -> Result<String> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(value.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|_| ApiError::internal())
}

fn matches(hash: &str, value: &str) -> bool {
    if hash.starts_with("$2a$") || hash.starts_with("$2b$") || hash.starts_with("$2y$") {
        return bcrypt::verify(value, hash).unwrap_or(false);
    }
    PasswordHash::new(hash).is_ok_and(|parsed| {
        Argon2::default()
            .verify_password(value.as_bytes(), &parsed)
            .is_ok()
    })
}

fn iso(seconds: i64) -> Result<String> {
    DateTime::from_timestamp(seconds, 0)
        .map(|date| date.to_rfc3339_opts(SecondsFormat::Millis, true))
        .ok_or_else(ApiError::internal)
}

fn access_required() -> ApiError {
    ApiError::coded(
        StatusCode::UNAUTHORIZED,
        "access_required",
        "Sign in again.",
    )
}

fn revoked() -> ApiError {
    ApiError::coded(
        StatusCode::UNAUTHORIZED,
        "session_revoked",
        "The session has been revoked.",
    )
}

fn disabled() -> ApiError {
    ApiError::coded(
        StatusCode::FORBIDDEN,
        "account_forbidden",
        "The account cannot use MealPlaning.",
    )
}

fn credentials() -> ApiError {
    ApiError::coded(
        StatusCode::BAD_REQUEST,
        "invalid_credentials",
        "The username or password is incorrect.",
    )
}

pub(crate) fn bearer(header: &str) -> &str {
    if let Some((prefix, token)) = header.split_once(char::is_whitespace)
        && prefix.eq_ignore_ascii_case("Bearer")
    {
        return token.trim_start();
    }
    header
}

fn valid_token(token: &str, prefix: &str) -> bool {
    token
        .strip_prefix(prefix)
        .is_some_and(|s| s.len() == 64 && s.bytes().all(|c| c.is_ascii_alphanumeric()))
}

fn string<'a>(body: &'a Value, key: &str) -> &'a str {
    body[key].as_str().unwrap_or("")
}

fn js_whitespace(c: char) -> bool {
    matches!(c,'\u{0009}'..='\u{000d}'|' '|'\u{00a0}'|'\u{1680}'|'\u{2000}'..='\u{200a}'|'\u{2028}'|'\u{2029}'|'\u{202f}'|'\u{205f}'|'\u{3000}'|'\u{feff}')
}

fn name(body: &Value) -> Result<&str> {
    let name = string(body, "name").trim_matches(js_whitespace);
    if name.is_empty() || name.chars().count() > 100 {
        let message = "Enter a name from 1 to 100 characters.";
        let mut error = ApiError::bad(message);
        error.data = json!({"name":{"code":"invalid_name","message":message}});
        return Err(error);
    }
    Ok(name)
}

fn device_label(body: &Value) -> String {
    string(body, "deviceLabel")
        .split(|c: char| c.is_ascii_control() || js_whitespace(c))
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join(" ")
        .chars()
        .take(60)
        .collect()
}

#[derive(Debug)]
pub(crate) struct Owner {
    pub id: String,
    username: String,
    name: String,
}

impl Owner {
    fn fields(&self) -> Value {
        json!({"ownerId":self.id,"username":self.username,"name":self.name})
    }

    fn record(&self) -> Value {
        json!({"id":self.id,"username":self.username,"name":self.name,"collectionName":"users"})
    }
}

fn owner(db: &Connection, id: &str) -> Result<Owner> {
    let value = db
        .query_row(
            "SELECT username,name,mealplan_disabled FROM users WHERE id=?1",
            [id],
            |r| {
                Ok((
                    Owner {
                        id: id.to_owned(),
                        username: r.get(0)?,
                        name: r.get(1)?,
                    },
                    r.get::<_, bool>(2)?,
                ))
            },
        )
        .optional()?;
    match value {
        Some((owner, false)) => Ok(owner),
        _ => Err(disabled()),
    }
}

fn lookup_password(
    db: &Connection,
    identity: &str,
    password: &str,
    dummy: &str,
    operator: bool,
) -> Result<(String, String)> {
    let query = if operator {
        "SELECT id,password FROM mealplan_operators WHERE email=?1"
    } else {
        "SELECT id,password FROM users WHERE username=?1"
    };
    let found = db
        .query_row(query, [identity], |r| {
            Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?))
        })
        .optional()?;
    let candidate = found
        .as_ref()
        .map(|(_, hash)| hash.as_str())
        .unwrap_or(dummy);
    if !matches(candidate, password) {
        return Err(credentials());
    }
    found.ok_or_else(credentials)
}

pub(crate) fn signup(db: &Connection, token: &str, body: &Value) -> Result<Value> {
    if !token.is_empty() {
        return Err(ApiError::new(
            StatusCode::FORBIDDEN,
            "Anonymous signup required.",
        ));
    }
    if !body.as_object().is_some_and(|b| {
        b.keys().all(|s| {
            matches!(
                s.as_str(),
                "username" | "password" | "passwordConfirm" | "name"
            )
        })
    }) {
        return Err(ApiError::bad("Invalid signup fields."));
    }
    let name = name(body)?;
    let username = string(body, "username");
    if !(3..=32).contains(&username.len())
        || !username
            .bytes()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == b'_')
    {
        return Err(ApiError::bad("Invalid username."));
    }
    let pass = string(body, "password");
    if !(8..=71).contains(&pass.chars().count()) || pass != string(body, "passwordConfirm") {
        return Err(ApiError::bad("Invalid password or confirmation."));
    }
    let id = id();
    let hash = hash_password(pass)?;
    let changed = db.execute("INSERT INTO users(id,username,name,password) VALUES(?1,?2,?3,?4) ON CONFLICT(username) DO NOTHING",
        params![id,username,name,hash])?;
    if changed == 0 {
        return Err(ApiError::bad("Username is unavailable."));
    }
    Ok(owner(db, &id)?.record())
}

pub(crate) fn login(
    db: &mut Connection,
    body: &Value,
    dummy: &str,
    operator: bool,
) -> Result<Value> {
    let identity = string(body, "identity")
        .trim_matches(js_whitespace)
        .to_lowercase();
    let password = string(body, "password");
    if password.len() > 1024 || identity.len() > 256 {
        return Err(credentials());
    }
    let (id, hash) = lookup_password(db, &identity, password, dummy, operator)?;
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let expires = Utc::now().timestamp() + ACCESS_SECONDS;
    let (token, record) = if operator {
        let current: bool = tx.query_row(
            "SELECT EXISTS(SELECT 1 FROM mealplan_operators WHERE id=?1 AND password=?2)",
            params![id, hash],
            |r| r.get(0),
        )?;
        if !current {
            return Err(credentials());
        }
        let token = secret("mpo_");
        tx.execute(
            "DELETE FROM operator_access WHERE expires <= ?1",
            [expires - ACCESS_SECONDS],
        )?;
        tx.execute(
            "INSERT INTO operator_access(digest,operator_id,expires) VALUES(?1,?2,?3)",
            params![digest(&token), id, expires],
        )?;
        (
            token,
            json!({"id":id,"email":identity,"collectionName":"mealplan_operators"}),
        )
    } else {
        let record = owner(&tx, &id)?.record();
        let token = secret("mpl_");
        tx.execute(
            "DELETE FROM login_tokens WHERE expires <= ?1",
            [expires - ACCESS_SECONDS],
        )?;
        tx.execute(
            "INSERT INTO login_tokens(digest,owner,expires) VALUES(?1,?2,?3)",
            params![digest(&token), id, expires],
        )?;
        (token, record)
    };
    tx.commit()?;
    Ok(json!({"token":token,"record":record}))
}

pub(crate) fn provision(db: &mut Connection, email: &str, password: &str) -> Result<()> {
    let email = email.trim().to_lowercase();
    if email.len() > 254
        || !email
            .split_once('@')
            .is_some_and(|(l, r)| !l.is_empty() && !r.is_empty() && !r.contains('@'))
        || email.chars().any(char::is_whitespace)
        || !(8..=71).contains(&password.chars().count())
    {
        return Err(ApiError::bad("Invalid operator credentials."));
    }
    let hash = hash_password(password)?;
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    tx.execute("INSERT INTO mealplan_operators(id,email,password) VALUES(?1,?2,?3) ON CONFLICT(email) DO UPDATE SET password=excluded.password",
        params![id(),email,hash])?;
    tx.execute("DELETE FROM operator_access WHERE operator_id=(SELECT id FROM mealplan_operators WHERE email=?1)",[email])?;
    tx.commit()?;
    Ok(())
}

pub(crate) fn operator_access(db: &Connection, token: &str) -> Result<()> {
    if !valid_token(token, "mpo_") {
        return Err(access_required());
    }
    let active: bool = db.query_row(
        "SELECT EXISTS(SELECT 1 FROM operator_access WHERE digest=?1 AND expires>?2)",
        params![digest(token), Utc::now().timestamp()],
        |r| r.get(0),
    )?;
    if active {
        Ok(())
    } else {
        Err(access_required())
    }
}

fn session_valid(revoked_at: i64, expires: i64, now: i64) -> Result<()> {
    if revoked_at != 0 {
        return Err(revoked());
    }
    if expires <= now {
        return Err(ApiError::coded(
            StatusCode::UNAUTHORIZED,
            "session_expired",
            "The session has expired.",
        ));
    }
    Ok(())
}

pub(crate) fn access(db: &Connection, token: &str) -> Result<(Owner, String)> {
    if !valid_token(token, "mpa_") {
        return Err(access_required());
    }
    let found=db.query_row("SELECT s.owner,s.digest,s.revoked_at,s.expires,a.expires FROM mealplan_access a JOIN mealplan_sessions s ON a.session=s.digest WHERE a.digest=?1",
        [digest(token)],|r|Ok((r.get::<_,String>(0)?,r.get::<_,String>(1)?,r.get::<_,i64>(2)?,r.get::<_,i64>(3)?,r.get::<_,i64>(4)?))).optional()?;
    let (id, session, revoked_at, expires, access_expires) = found.ok_or_else(access_required)?;
    let now = Utc::now().timestamp();
    session_valid(revoked_at, expires, now)?;
    if access_expires <= now {
        return Err(ApiError::coded(
            StatusCode::UNAUTHORIZED,
            "access_expired",
            "The access token has expired.",
        ));
    }
    Ok((owner(db, &id)?, session))
}

fn issue(tx: &Transaction<'_>, session: &str, user: &Owner, expires: i64) -> Result<Value> {
    let access_token = secret("mpa_");
    tx.execute(
        "INSERT INTO mealplan_access(digest,session,expires) VALUES(?1,?2,?3)",
        params![digest(&access_token), session, expires],
    )?;
    let mut fields = user.fields();
    fields["accessToken"] = Value::String(access_token);
    fields["accessExpiresAt"] = Value::String(iso(expires)?);
    Ok(fields)
}

pub(crate) fn exchange(
    db: &mut Connection,
    token: &str,
    body: &Value,
    dummy: &str,
) -> Result<Value> {
    let now = Utc::now().timestamp();
    let id = if body.get("username").is_some() || body.get("password").is_some() {
        let user = string(body, "username");
        let pass = string(body, "password");
        if user.encode_utf16().count() > 128 || pass.encode_utf16().count() > 256 {
            return Err(credentials());
        }
        Some(
            lookup_password(
                db,
                &user.trim_matches(js_whitespace).to_lowercase(),
                pass,
                dummy,
                false,
            )?
            .0,
        )
    } else {
        None
    };
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let id = match id {
        Some(id) => id,
        None => {
            if !valid_token(token, "mpl_") {
                return Err(access_required());
            }
            let key = digest(token);
            let user = tx
                .query_row(
                    "SELECT owner,consumed FROM login_tokens WHERE digest=?1 AND expires>?2",
                    params![key, now],
                    |r| Ok((r.get::<_, String>(0)?, r.get::<_, bool>(1)?)),
                )
                .optional()?
                .ok_or_else(access_required)?;
            if user.1 {
                return Err(revoked());
            }
            tx.execute("UPDATE login_tokens SET consumed=1 WHERE digest=?1", [key])?;
            user.0
        }
    };
    let user = owner(&tx, &id)?;
    let token = secret("mps_");
    let key = digest(&token);
    tx.execute(
        "DELETE FROM mealplan_sessions WHERE expires<=?1",
        [now - 7 * 86400],
    )?;
    tx.execute(
        "DELETE FROM mealplan_access WHERE expires<=?1",
        [now - 7 * 86400],
    )?;
    tx.execute(
        "INSERT INTO mealplan_sessions(digest,owner,expires) VALUES(?1,?2,?3)",
        params![key, id, now + SESSION_SECONDS],
    )?;
    tx.execute("INSERT INTO mealplan_session_metadata(session,public_id,created_at,device_label) VALUES(?1,?2,?3,?4)",
        params![key,Uuid::new_v4().to_string(),now,device_label(body)])?;
    let mut value = issue(&tx, &key, &user, now + ACCESS_SECONDS)?;
    value["sessionToken"] = Value::String(token);
    tx.commit()?;
    Ok(value)
}

pub(crate) fn refresh(db: &mut Connection, body: &Value) -> Result<Value> {
    let token = string(body, "sessionToken");
    if !valid_token(token, "mps_") {
        return Err(access_required());
    }
    let now = Utc::now().timestamp();
    let key = digest(token);
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let (id, revoked_at, expires) = tx
        .query_row(
            "SELECT owner,revoked_at,expires FROM mealplan_sessions WHERE digest=?1",
            [&key],
            |r| {
                Ok((
                    r.get::<_, String>(0)?,
                    r.get::<_, i64>(1)?,
                    r.get::<_, i64>(2)?,
                ))
            },
        )
        .optional()?
        .ok_or_else(revoked)?;
    session_valid(revoked_at, expires, now)?;
    let user = owner(&tx, &id)?;
    let value = issue(&tx, &key, &user, expires.min(now + ACCESS_SECONDS))?;
    tx.commit()?;
    Ok(value)
}

pub(crate) fn devices(db: &Connection, token: &str) -> Result<Value> {
    let (user, session) = access(db, token)?;
    let mut query=db.prepare("SELECT m.public_id,m.device_label,m.created_at,s.expires,s.digest=?2 AS current FROM mealplan_sessions s
        JOIN mealplan_session_metadata m ON m.session=s.digest WHERE s.owner=?1 AND s.revoked_at=0 AND s.expires>?3
        ORDER BY current DESC,m.created_at DESC,m.public_id")?;
    let mut rows = query.query(params![user.id, session, Utc::now().timestamp()])?;
    let mut result = Vec::new();
    while let Some(row) = rows.next()? {
        result.push(json!({"id":row.get::<_,String>(0)?,"label":row.get::<_,String>(1)?,"createdAt":iso(row.get(2)?)?,
            "expiresAt":iso(row.get(3)?)?,"current":row.get::<_,bool>(4)?}));
    }
    Ok(json!({"devices":result}))
}

pub(crate) fn revoke(db: &Connection, token: &str, body: &Value) -> Result<()> {
    let (user, caller) = access(db, token)?;
    let key=db.query_row("SELECT s.digest FROM mealplan_sessions s JOIN mealplan_session_metadata m ON m.session=s.digest WHERE s.owner=?1 AND m.public_id=?2",
        params![user.id,string(body,"id")],|r|r.get::<_,String>(0)).optional()?.ok_or_else(||
        ApiError::coded(StatusCode::NOT_FOUND,"session_not_found","The device session was not found."))?;
    if key == caller {
        return Err(ApiError::coded(
            StatusCode::CONFLICT,
            "current_session",
            "Use sign out to close this session.",
        ));
    }
    db.execute(
        "UPDATE mealplan_sessions SET revoked_at=?1 WHERE digest=?2 AND revoked_at=0",
        params![Utc::now().timestamp(), key],
    )?;
    Ok(())
}

pub(crate) fn profile(db: &Connection, token: &str, body: &Value) -> Result<Value> {
    let (mut user, _) = access(db, token)?;
    user.name = name(body)?.to_owned();
    db.execute(
        "UPDATE users SET name=?1 WHERE id=?2",
        params![user.name, user.id],
    )?;
    Ok(user.fields())
}

pub(crate) fn logout(db: &Connection, login: &str, body: &Value) -> Result<()> {
    let token = string(body, "sessionToken");
    let now = Utc::now().timestamp();
    if valid_token(token, "mps_") {
        db.execute(
            "UPDATE mealplan_sessions SET revoked_at=?1 WHERE digest=?2 AND revoked_at=0",
            params![now, digest(token)],
        )?;
    } else {
        if !valid_token(login, "mpl_") {
            return Err(access_required());
        }
        let key = digest(login);
        let id = db
            .query_row(
                "SELECT owner FROM login_tokens WHERE digest=?1 AND expires>?2",
                params![key, now],
                |r| r.get::<_, String>(0),
            )
            .optional()?
            .ok_or_else(access_required)?;
        owner(db, &id)?;
        db.execute("UPDATE login_tokens SET consumed=1 WHERE digest=?1", [key])?;
    }
    Ok(())
}
