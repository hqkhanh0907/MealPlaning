use super::{Screen, date_time, flag, number, string};
use leptos::prelude::*;
use serde_json::{Value, json};
use std::collections::BTreeMap;

pub(super) fn devices(s: Screen) -> impl IntoView {
    let panel = move || s.get(|d| d["panel"].clone());
    view! {<section aria-label="Phiên đăng nhập"><h2>"Phiên đăng nhập"</h2>
    {move||{
        let p=panel();
        if p.is_null() {
            return view!{<ion-button fill="outline" on:click=move |_|s.action("load")>"Xem thiết bị đăng nhập"</ion-button>}.into_any();
        }
        let busy=flag(&p,"busy");
        let rows=p["devices"].as_array().cloned().unwrap_or_default();
        view!{
          {busy.then(||view!{<p class="device-note" role="status">"Đang cập nhật danh sách thiết bị…"</p>})}
          {p["error"].as_str().map(|err|view!{<p class="device-note" role="alert">{err.to_owned()}</p>})}
          {if flag(&p,"requiresLogin"){view!{<ion-button fill="outline" href="/account" on:click=move |ev|{ev.prevent_default();s.action("login");}>"Đăng nhập lại"</ion-button>}.into_any()}else{
            view!{<ul class="device-list">{rows.into_iter().map(|d|{
                let id=string(&d,"id"); let tail=id.chars().rev().take(6).collect::<Vec<_>>().into_iter().rev().collect::<String>();
                let name=d["label"].as_str().filter(|v|!v.is_empty()).unwrap_or("Thiết bị chưa có tên").to_owned();
                let label=format!("Thu hồi phiên {name} {tail}");let time=date_time(&string(&d,"createdAt"));
                view!{<li class="device-row"><div><h3>{name}</h3><p class="device-note">{format!("{time} · {tail}")}</p></div>
                  {if flag(&d,"current"){view!{<span class="device-current">"Thiết bị này"</span>}.into_any()}else{
                    view!{<ion-button fill="clear" color="danger" aria-label=label disabled=busy prop:disabled=busy on:click=move |_|s.send.run(json!({"type":"choose","id":id}))>"Thu hồi"</ion-button>}.into_any()}}
                </li>}
            }).collect_view()}</ul>
            <ion-button fill="outline" disabled=busy prop:disabled=busy on:click=move |_|s.action("load")>"Tải lại"</ion-button>}.into_any()
          }}
        }.into_any()
    }}</section>}
}
fn label(item: &Value) -> String {
    let day = string(item, "sessionDate");
    if item["kind"] == "workout_session_delete" {
        return format!("Buổi tập {day}");
    }
    let exercise = item["exerciseName"]
        .as_str()
        .filter(|v| !v.is_empty())
        .map(|v| format!(" · {v}"))
        .unwrap_or_default();
    let field = match item["field"].as_str() {
        Some("weight_kg") => "Mức tạ",
        Some("reps") => "Số lần",
        _ => "Thời gian",
    };
    format!("{day}{exercise} · Hiệp {} · {field}", item["setNumber"])
}
fn value(item: &Value, side: &str) -> String {
    let v = item[side].as_f64().map(number);
    if item["kind"] == "workout_session_delete" {
        return v.map_or_else(
            || "Xóa buổi tập".into(),
            |v| format!("Giữ buổi tập · {v} kg"),
        );
    }
    let unit = match item["field"].as_str() {
        Some("weight_kg") => "kg",
        Some("reps") => "lần",
        _ => "giây",
    };
    v.map_or_else(|| "Chưa có giá trị".into(), |v| format!("{v} {unit}"))
}
pub(super) fn conflict(s: Screen, info: Value, generation: u64) -> impl IntoView {
    let choices = RwSignal::new(BTreeMap::<String, &'static str>::new());
    let items = info["items"].as_array().cloned().unwrap_or_default();
    let count = items.len();
    view! {<app-workout-conflict><section class="workout-conflict" aria-labelledby="workout-conflict-title">
       <h3 id="workout-conflict-title">"Chọn thay đổi cần giữ"</h3>
       {items.into_iter().map(|item|{
         let title=label(&item);
         view!{<div class="workout-conflict__choice" role="group" aria-label=title.clone()><p>{title.clone()}</p><div class="workout-conflict__options">
          {["local","server"].into_iter().map(|side|{
            let key=StoredValue::new(string(&item,"key"));let selected=move||choices.with(|c|key.with_value(|k|c.get(k)==Some(&side)));
            let name=if side=="local"{"Máy này"}else{"Máy khác"};let side_value=value(&item,side);
            view!{<ion-button fill=move||if selected(){"solid"}else{"outline"} aria-pressed=move||selected().to_string()
              on:click=move |_|{choices.update(|c|{c.insert(key.get_value(),side);});}>{format!("{name} · {side_value}")}</ion-button>}
          }).collect_view()}</div></div>}
       }).collect_view()}
       <ion-button expand="block" disabled=move||count==0||choices.with(|c|c.len()!=count) prop:disabled=move||count==0||choices.with(|c|c.len()!=count)
          on:click=move |_|{if count>0 && choices.with_untracked(|c|c.len()==count){s.send.run(json!({"type":"resolveWorkout","version":generation,"choices":choices.get_untracked()}));}}>"Áp dụng lựa chọn"</ion-button>
    </section></app-workout-conflict>}
}
