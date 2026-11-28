use super::{Screen, date_time, flag, number, panels, string};
use healthmate_domain::{
    dates::{age_on_date, parse_local_date},
    profile::ActivityLevel,
};
use leptos::prelude::*;
use serde_json::{Value, json};

pub(super) fn goal(value: &str) -> &'static str {
    match value {
        "lose_weight" => "Giảm cân",
        "gain_muscle" => "Tăng cơ",
        "maintain" => "Duy trì",
        "performance" => "Tăng sức mạnh",
        _ => "undefined",
    }
}
pub(super) fn fitness(value: &str) -> &'static str {
    match value {
        "beginner" => "Mới tập",
        "intermediate" => "Trung cấp",
        "advanced" => "Nâng cao",
        _ => "undefined",
    }
}
pub(super) fn activity(value: f64) -> String {
    ActivityLevel::from_factor(value).map_or_else(
        || "Chưa xác định · tạm tính vận động vừa".into(),
        |l| l.labels().0.into(),
    )
}

fn header(title: &'static str) -> impl IntoView {
    view! {<ion-list-header><ion-label><h2>{title}</h2></ion-label></ion-list-header>}
}
fn chevron() -> impl IntoView {
    view! {<ion-icon slot="end" name="chevron-forward-outline" aria-hidden="true"></ion-icon>}
}
fn sync_status(d: &Value) -> &'static str {
    match d["status"].as_str() {
        Some("working") => "Đang đồng bộ",
        Some("saved") => "Đã đồng bộ",
        Some("offline") => "Chưa kết nối được. Dữ liệu đã lưu trên máy.",
        Some("expired") if d["reason"] == "session_revoked" => {
            "Phiên đã bị thu hồi. Đăng nhập lại để đồng bộ."
        }
        Some("expired") => "Phiên đã hết hạn. Đăng nhập lại để đồng bộ.",
        Some("forbidden") => "Tài khoản thiếu quyền đồng bộ. Dữ liệu vẫn lưu trên máy.",
        Some("conflict") => "Dữ liệu đã đổi ở nơi khác.",
        Some("error") => "Đồng bộ gặp lỗi. Dữ liệu vẫn lưu trên máy.",
        _ => "Chưa đồng bộ",
    }
}
fn route(s: Screen, path: &'static str, event: web_sys::MouseEvent) {
    if event.button() != 0
        || event.meta_key()
        || event.ctrl_key()
        || event.alt_key()
        || event.shift_key()
    {
        return;
    }
    event.prevent_default();
    s.send.run(json!({"type":"navigate","path":path}));
}
pub(super) fn account(s: Screen) -> impl IntoView {
    let current = move || s.get(|d| !d["account"].is_null());
    let working = move || s.get(|d| d["status"] == "working");
    let sync = Memo::new(move |_| {
        s.get(|d| {
            (
                string(d, "status"),
                d["conflict"].clone(),
                d["conflictRef"].as_u64().unwrap_or(0),
            )
        })
    });
    view! {<Show when=current><ion-list lines="none" class="settings-list">
     {header("Tài khoản")}
     <ion-item button detail="false" class="account-identity" href="/settings/name" on:click=move |e|route(s,"/settings/name",e)>
       <ion-label class="ion-text-wrap"><h3>{move||s.get(|d|d["account"]["name"].as_str().filter(|v|!v.is_empty()).unwrap_or("Bổ sung họ và tên").to_owned())}</h3>
       <p>"Tên đăng nhập: "{move||s.get(|d|string(&d["account"],"username"))}</p></ion-label>{chevron()}
     </ion-item>
     <ion-item><ion-label class="ion-text-wrap"><h3>"Đồng bộ"</h3><p aria-live="polite">{move||s.get(sync_status)}</p>
       {move||s.get(|d|d["lastSync"].as_str().filter(|v|!v.is_empty()).map(date_time)).map(|v|view!{<p>"Lần thành công gần nhất: "{v}</p>})}
     </ion-label></ion-item>
     {move||{let(status,conflict,version)=sync.get();match status.as_str(){
      "expired"|"forbidden"=>view!{<ion-item button href="/account" on:click=move |e|route(s,"/account",e)>"Đăng nhập lại"</ion-item>}.into_any(),
      "conflict" if !conflict.is_null()=>panels::conflict(s,conflict,version).into_any(),
      "conflict"=>view!{<ion-item><ion-label class="ion-text-wrap">"Chọn phiên bản giữ lại cho tài khoản này."</ion-label></ion-item>
          <ion-item button on:click=move |_|s.send.run(json!({"type":"resolve","server":true}))>"Dùng bản máy chủ"</ion-item>
          <ion-item button on:click=move |_|s.send.run(json!({"type":"resolve","server":false}))>"Giữ bản trên máy này"</ion-item>}.into_any(),
      _=>view!{<ion-item button detail="false" disabled=working prop:disabled=working on:click=move |_|s.action("sync")>
          <ion-icon slot="start" name="sync-outline" aria-hidden="true"></ion-icon>"Đồng bộ ngay"</ion-item>}.into_any(),
     }}}
     <ion-item button detail="false" class="sign-out-row" disabled=move||s.get(|d|flag(d,"signOutBusy")) prop:disabled=move||s.get(|d|flag(d,"signOutBusy"))
        on:click=move |_|s.action("signOut")><ion-icon slot="start" name="log-out-outline" aria-hidden="true"></ion-icon>"Đăng xuất"</ion-item>
     <Show when=move||s.get(|d|!string(d,"signOutError").is_empty())><ion-item><ion-label class="ion-text-wrap" role="alert">{move||s.get(|d|string(d,"signOutError"))}</ion-label></ion-item></Show>
    </ion-list></Show>}
}
fn summary(d: &Value, key: &str) -> String {
    let p = &d["profile"];
    if p.is_null() {
        return if key == "activity" {
            ", ".into()
        } else {
            String::new()
        };
    }
    match key {
        "body" => {
            let age = parse_local_date(d["today"].as_str().unwrap_or_default())
                .and_then(|day| age_on_date(p["birth_date"].as_str(), day));
            let label = age.map_or_else(|| "Bổ sung ngày sinh".into(), |v| format!("{v} tuổi"));
            let gender = match p["gender"].as_str() {
                Some("male") => "Nam",
                Some("female") => "Nữ",
                _ => "undefined",
            };
            format!(
                "{} cm, {} kg, {label}, {gender}",
                number(p["height_cm"].as_f64().unwrap_or_default()),
                number(p["weight_kg"].as_f64().unwrap_or_default())
            )
        }
        "goals" => goal(p["goal"].as_str().unwrap_or_default()).into(),
        _ => format!(
            "{}, {}",
            activity(p["activity_factor"].as_f64().unwrap_or_default()),
            fitness(p["fitness_level"].as_str().unwrap_or_default())
        ),
    }
}
fn target(d: &Value, key: &str) -> String {
    let val = d["profile"][key].as_f64();
    match val {
        Some(v) if v != 0.0 || matches!(key, "target_carbs" | "target_fat") => format!(
            "{} {}",
            number(v),
            if key == "target_calories" {
                "kcal"
            } else {
                "g"
            }
        ),
        _ => "Chưa đặt".into(),
    }
}
fn profile(s: Screen) -> impl IntoView {
    view! {<ion-list lines="none" class="settings-list">{header("Hồ sơ")}
    { [("body","Thông số cơ thể","/settings/body"),("goals","Mục tiêu","/settings/goals"),("activity","Vận động và trình độ tập","/settings/activity")].into_iter().map(|(k,label,path)|
        view!{<ion-item button detail="false" href=path on:click=move|e|route(s,path,e)><ion-label><h3>{label}</h3><p>{move||s.get(|d|summary(d,k))}</p></ion-label>{chevron()}</ion-item>}
    ).collect_view()}</ion-list>
    <ion-list lines="none" class="settings-list">{header("Mục tiêu hằng ngày")}
     { [("target_calories","Năng lượng"),("target_protein","Protein"),("target_carbs","Carbs"),("target_fat","Fat")].into_iter().map(|(key,label)|
       view!{<ion-item><ion-label>{label}</ion-label><ion-note slot="end">{move||s.get(|d|target(d,key))}</ion-note></ion-item>}
     ).collect_view()}<ion-item lines="none"><ion-label class="settings-hint">"Chỉnh sửa ở mục Mục tiêu"</ion-label></ion-item></ion-list>}
}
fn reminders(s: Screen) -> impl IntoView {
    let rows =
        Memo::new(move |_| s.get(|d| d["reminders"].as_array().cloned().unwrap_or_default()));
    view! {<ion-list lines="none" class="settings-list">{header("Nhắc nhở")}
    <Show when=move||s.get(|d|flag(d,"paused"))><ion-item><ion-label class="ion-text-wrap">
     "Android đang tắt quyền thông báo. Các giờ nhắc đã chọn đang tạm dừng."
     <ion-button class="resume-notifications" fill="outline" on:click=move |_|s.action("resume")>"Cho phép thông báo"</ion-button>
    </ion-label></ion-item></Show>
    <For each=move||rows.get() key=|r|string(r,"key") children=move|row|{
     let key=StoredValue::new(string(&row,"key"));
     let checked=move||s.get(|d|key.with_value(|key| d["flags"][key].as_bool().unwrap_or(false)));
     let class=(row["key"]=="workout").then_some("ion-text-wrap");
     view!{<ion-item><ion-toggle prop:checked=checked on:ionChange=move|event:web_sys::CustomEvent|{
       let Some(enabled)=js_sys::Reflect::get(&event.detail(),&"checked".into()).ok().and_then(|v|v.as_bool())else{return;};
       let old=checked();
       if enabled==old{return;}
       if let Some(el)=event.current_target(){let _=js_sys::Reflect::set(&el,&"checked".into(),&old.into());}
       s.send.run(json!({"type":"toggle","key":key.get_value(),"enabled":enabled}));
     }><ion-label class=class><h3>{string(&row,"title")}</h3><p>{string(&row,"label")}</p></ion-label></ion-toggle></ion-item>}
    }/></ion-list>}
}
fn groq(s: Screen) -> impl IntoView {
    let busy = move || s.get(|d| flag(d, "groqBusy"));
    let configured = move || s.get(|d| flag(d, "configured"));
    view! {<Show when=move||s.get(|d|flag(d,"groqSupported") && !d["account"].is_null())>
    <ion-list lines="none" class="settings-list">{header("AI")}
    <ion-item><ion-label class="ion-text-wrap"><h3>"Groq"</h3><p>{move||if configured(){"Đã lưu khóa trên thiết bị"}else{"Chưa nhập khóa"}}</p></ion-label>
    <ion-button slot="end" fill="outline" disabled=busy prop:disabled=busy on:click=move |_|s.action("keyConfigure")>{move||if configured(){"Đổi khóa"}else{"Nhập khóa"}}</ion-button></ion-item>
    <Show when=configured><ion-item button disabled=busy prop:disabled=busy on:click=move |_|s.action("keyRemove")><ion-label color="danger">"Gỡ khóa Groq"</ion-label></ion-item></Show>
    {move||s.get(|d|d["feedback"].as_object().cloned()).map(|v|{let err=v["error"].as_bool()==Some(true);view!{<ion-item><ion-label class="ion-text-wrap" color=err.then_some("danger")><p role=if err{"alert"}else{"status"}>{v["message"].as_str().unwrap_or_default().to_owned()}</p></ion-label></ion-item>}})}
    </ion-list></Show>}
}
pub(super) fn preferences(s: Screen) -> impl IntoView {
    view! { {profile(s)} {reminders(s)} {groq(s)}
    <ion-list lines="none" class="settings-list">{header("Giới thiệu")}<ion-item lines="none"><ion-label>"Phiên bản"</ion-label><ion-note slot="end">{move||s.get(|d|string(d,"version"))}</ion-note></ion-item></ion-list>}
}
