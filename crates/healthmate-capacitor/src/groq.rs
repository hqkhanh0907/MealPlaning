use jni::{
    JNIEnv,
    errors::Result,
    objects::{JByteArray, JClass, JObject, JString, JValue},
    sys::jstring,
};
use serde_json::Value;
use std::ptr;

const RESPONSE_LIMIT: usize = 2 * 1024 * 1024;

fn android_content<'local>(
    env: &mut JNIEnv<'local>,
    bytes: &JByteArray<'local>,
) -> Result<JObject<'local>> {
    let charset = env.new_string("UTF-8")?;
    let text = env.new_object(
        "java/lang/String",
        "([BLjava/lang/String;)V",
        &[JValue::Object(bytes), JValue::Object(&charset)],
    )?;
    let envelope = env.new_object(
        "org/json/JSONObject",
        "(Ljava/lang/String;)V",
        &[JValue::Object(&text)],
    )?;
    let choices = env.new_string("choices")?;
    let choices = env
        .call_method(
            envelope,
            "getJSONArray",
            "(Ljava/lang/String;)Lorg/json/JSONArray;",
            &[JValue::Object(&choices)],
        )?
        .l()?;
    let first = env
        .call_method(
            choices,
            "getJSONObject",
            "(I)Lorg/json/JSONObject;",
            &[JValue::Int(0)],
        )?
        .l()?;
    let message = env.new_string("message")?;
    let message = env
        .call_method(
            first,
            "getJSONObject",
            "(Ljava/lang/String;)Lorg/json/JSONObject;",
            &[JValue::Object(&message)],
        )?
        .l()?;
    let key = env.new_string("content")?;
    let content = env
        .call_method(
            message,
            "get",
            "(Ljava/lang/String;)Ljava/lang/Object;",
            &[JValue::Object(&key)],
        )?
        .l()?;
    if !env.is_instance_of(&content, "java/lang/String")? {
        return Ok(JObject::null());
    }
    let trimmed = env
        .call_method(&content, "trim", "()Ljava/lang/String;", &[])?
        .l()?;
    if env.call_method(trimmed, "isEmpty", "()Z", &[])?.z()? {
        return Ok(JObject::null());
    }
    Ok(content)
}

fn content<'local>(
    env: &mut JNIEnv<'local>,
    bytes: &JByteArray<'local>,
) -> Result<JObject<'local>> {
    let length = env.get_array_length(bytes)? as usize;
    if length == 0 || length > RESPONSE_LIMIT {
        return Ok(JObject::null());
    }
    let raw = env.convert_byte_array(bytes)?;
    let parsed: Value = match serde_json::from_slice(&raw) {
        Ok(v) => v,
        // Android accepts lenient JSON and isolated UTF-16 surrogates that serde_json cannot represent.
        Err(_) => return android_content(env, bytes),
    };
    let Some(text) = parsed
        .get("choices")
        .and_then(Value::as_array)
        .and_then(|choices| choices.first())
        .and_then(|choice| choice.get("message"))
        .and_then(|message| message.get("content"))
        .and_then(Value::as_str)
    else {
        return Ok(JObject::null());
    };
    if !text.chars().any(|ch| ch > ' ') {
        return Ok(JObject::null());
    }
    Ok(env.new_string(text)?.into())
}

#[unsafe(no_mangle)]
pub extern "system" fn Java_com_healthmate_ai_sync_GroqTransport_decodeContentNative<'local>(
    mut env: JNIEnv<'local>,
    _: JClass<'local>,
    bytes: JByteArray<'local>,
) -> jstring {
    match content(&mut env, &bytes) {
        Ok(text) => JString::from(text).into_raw(),
        Err(_) => {
            if let Ok(exception) = env.exception_occurred()
                && !exception.is_null()
                && env.exception_clear().is_ok()
                && !env
                    .is_instance_of(&exception, "org/json/JSONException")
                    .unwrap_or(false)
            {
                let _ = env.throw(exception);
            }
            ptr::null_mut()
        }
    }
}
