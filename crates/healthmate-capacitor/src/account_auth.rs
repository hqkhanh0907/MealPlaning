use serde_json::{Value, json};

const REGISTER: &str = "/api/collections/users/records";
const LOGIN: &str = "/api/mealplan/session";
const PROFILE: &str = "/api/mealplan/profile";

pub struct HttpReply {
    pub status: u16,
    pub status_text: String,
    pub body: Vec<u8>,
}
#[derive(Debug)]
pub struct AuthError {
    pub status: u16,
    pub message: String,
    pub code: String,
    pub field: String,
}
impl AuthError {
    pub fn network() -> Self {
        Self {
            status: 0,
            message: "Chưa kết nối được.".into(),
            code: "network".into(),
            field: String::new(),
        }
    }
    fn invalid() -> Self {
        Self {
            status: 0,
            message: "Tài khoản không hợp lệ.".into(),
            code: "invalid_response".into(),
            field: String::new(),
        }
    }
    #[cfg(target_os = "android")]
    fn public(&self) -> Value {
        json!({"status":self.status,"message":self.message,"code":self.code,"field":self.field})
    }
}
pub struct Grant {
    owner: String,
    username: String,
    name: String,
    access_token: String,
    session_token: String,
    expires_at: String,
}
impl Grant {
    pub fn public_identity(&self) -> Value {
        json!({"id":self.owner,"username":self.username,"name":self.name})
    }
    pub fn into_vault(self) -> Value {
        json!({"ownerId":self.owner,"username":self.username,"fullName":self.name,
        "accessToken":self.access_token,"sessionToken":self.session_token,"accessExpiresAt":self.expires_at})
    }
}
fn trim(value: &str) -> &str {
    value.trim_matches(|c: char| c == '\u{feff}' || (c.is_whitespace() && c != '\u{85}'))
}
fn name(value: &str) -> Result<&str, AuthError> {
    let v = trim(value);
    let message = match v.chars().count() {
        0 => "Nhập họ và tên.",
        1..=100 => return Ok(v),
        _ => "Họ và tên tối đa 100 ký tự.",
    };
    Err(AuthError {
        status: 400,
        message: message.into(),
        code: "invalid_name".into(),
        field: "name".into(),
    })
}
fn truthy(v: &Value) -> bool {
    match v {
        Value::Null => false,
        Value::Bool(v) => *v,
        Value::Number(n) => n.as_f64() != Some(0.),
        Value::String(v) => !v.is_empty(),
        _ => true,
    }
}
fn request(reply: HttpReply) -> Result<Value, AuthError> {
    if reply.status == 0 {
        return Err(AuthError::network());
    }
    if reply.status == 204 {
        return Ok(Value::Null);
    }
    let txt = String::from_utf8_lossy(&reply.body);
    let doc = serde_json::from_str::<Value>(txt.strip_prefix('\u{feff}').unwrap_or(&txt));
    if (200..300).contains(&reply.status) {
        return doc.map_err(|_| AuthError::invalid());
    }
    let doc = doc.unwrap_or(Value::Null);
    let data = &doc["data"];
    let field = ["name", "username"]
        .into_iter()
        .find(|k| truthy(&data[*k]))
        .unwrap_or("");
    Err(AuthError {
        status: reply.status,
        message: doc["message"]
            .as_str()
            .unwrap_or(&reply.status_text)
            .to_owned(),
        code: data["code"].as_str().unwrap_or_default().to_owned(),
        field: field.to_owned(),
    })
}
fn required<'a>(doc: &'a Value, key: &str) -> Result<&'a str, AuthError> {
    doc[key]
        .as_str()
        .filter(|s| !s.is_empty())
        .ok_or_else(AuthError::invalid)
}
pub fn authenticate(
    user: &str,
    password: &str,
    display_name: Option<&str>,
    device_label: &str,
    mut post: impl FnMut(&str, &str) -> Result<HttpReply, AuthError>,
) -> Result<Grant, AuthError> {
    let username = trim(user).to_lowercase();
    if let Some(display_name) = display_name {
        let body = json!({"username":username,"password":password,"passwordConfirm":password,"name":name(display_name)?});
        request(post(REGISTER, &body.to_string())?)?;
    }
    let body = json!({"username":username,"password":password,"deviceLabel":device_label});
    let doc = request(post(LOGIN, &body.to_string())?)?;
    let owner = required(&doc, "ownerId")?;
    if owner.len() != 15
        || !owner
            .bytes()
            .all(|ch| ch.is_ascii_lowercase() || ch.is_ascii_digit())
        || doc["username"].as_str() != Some(&username)
    {
        return Err(AuthError::invalid());
    }
    Ok(Grant {
        owner: owner.into(),
        username,
        name: doc["name"].as_str().ok_or_else(AuthError::invalid)?.into(),
        access_token: required(&doc, "accessToken")?.into(),
        session_token: required(&doc, "sessionToken")?.into(),
        expires_at: required(&doc, "accessExpiresAt")?.into(),
    })
}
pub fn rename(
    owner: &str,
    display_name: &str,
    mut post: impl FnMut(&str, &str) -> Result<HttpReply, AuthError>,
) -> Result<Option<String>, AuthError> {
    let body = json!({"name":name(display_name)?});
    let doc = request(post(PROFILE, &body.to_string())?)?;
    if doc["ownerId"].as_str() != Some(owner) {
        return Ok(None);
    }
    Ok(Some(
        doc["name"].as_str().ok_or_else(AuthError::invalid)?.into(),
    ))
}

#[cfg(target_os = "android")]
mod android {
    use super::*;
    use jni::{
        JNIEnv,
        objects::{JByteArray, JClass, JObject, JObjectArray, JString, JValue},
        sys::jstring,
    };
    use std::{
        panic::{AssertUnwindSafe, catch_unwind},
        ptr,
    };
    fn http(
        env: &mut JNIEnv<'_>,
        transport: &JObject<'_>,
        path: &str,
        body: &str,
    ) -> jni::errors::Result<HttpReply> {
        let path = env.new_string(path)?;
        let body = env.new_string(body)?;
        let raw = env
            .call_method(
                transport,
                "apply",
                "(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;",
                &[JValue::Object(&path), JValue::Object(&body)],
            )?
            .l()?;
        let arr = JObjectArray::from(raw);
        let code = env.get_object_array_element(&arr, 0)?;
        let status = env.call_method(code, "intValue", "()I", &[])?.i()? as u16;
        let label = JString::from(env.get_object_array_element(&arr, 1)?);
        let bytes = JByteArray::from(env.get_object_array_element(&arr, 2)?);
        Ok(HttpReply {
            status,
            status_text: env.get_string(&label)?.into(),
            body: env.convert_byte_array(bytes)?,
        })
    }
    #[unsafe(no_mangle)]
    pub extern "system" fn Java_com_healthmate_ai_sync_MealPlanAccountPlugin_accountNative(
        mut env: JNIEnv<'_>,
        _: JClass<'_>,
        mode: JString<'_>,
        user: JString<'_>,
        password: JString<'_>,
        display: JString<'_>,
        device: JString<'_>,
        transport: JObject<'_>,
    ) -> jstring {
        let result = catch_unwind(AssertUnwindSafe(|| -> jni::errors::Result<String> {
            let mode: String = env.get_string(&mode)?.into();
            if mode == "probe" {
                return Ok("1".into());
            }
            let user: String = env.get_string(&user)?.into();
            let display = if display.is_null() {
                None
            } else {
                Some(String::from(env.get_string(&display)?))
            };
            let credentials = if mode == "authenticate" {
                Some((
                    String::from(env.get_string(&password)?),
                    String::from(env.get_string(&device)?),
                ))
            } else {
                None
            };
            let post = |path: &str, body: &str| {
                http(&mut env, &transport, path, body).map_err(|_| AuthError::network())
            };
            let response = if let Some((password, device)) = credentials {
                authenticate(&user, &password, display.as_deref(), &device, post)
                    .map(|grant| json!({"grant":grant.into_vault()}))
            } else if mode == "rename" {
                rename(&user, display.as_deref().unwrap_or_default(), post)
                    .map(|full_name| json!({"fullName":full_name}))
            } else {
                Err(AuthError::invalid())
            };
            Ok(response
                .unwrap_or_else(|e| json!({"error":e.public()}))
                .to_string())
        }));
        if env.exception_check().unwrap_or(true) {
            return ptr::null_mut();
        }
        match result {
            Ok(Ok(data)) => env
                .new_string(data)
                .map(JString::into_raw)
                .unwrap_or(ptr::null_mut()),
            _ => {
                let _ = env.throw_new("java/io/IOException", "Native account request unavailable");
                ptr::null_mut()
            }
        }
    }
}
