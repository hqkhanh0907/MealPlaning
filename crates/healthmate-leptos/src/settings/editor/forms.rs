use super::{Editor, Kind, number, preview};
use crate::settings::home;
use healthmate_domain::{
    dates::{age_on_date, parse_local_date},
    profile::ActivityLevel,
};
use leptos::prelude::*;
use web_sys::CustomEvent;

pub(super) fn name(e: Editor) -> impl IntoView {
    let invalid = move || e.read(|f| !f.error.is_empty());
    view! {<form class="name-form" novalidate on:submit=move|ev|{ev.prevent_default();e.submit();}>
      <div class="input-wrapper" class:invalid=invalid><label class="input-label" for="settings-full-name">"Họ và tên"</label>
      <input id="settings-full-name" class="input-native" autocomplete="name" autocapitalize="words" required prop:value=e.read(|f|f.name.clone())
       disabled=move||e.read(|f|f.locked) aria-invalid=move||invalid().then_some("true") aria-describedby=move||invalid().then_some("name-edit-error")
       on:input=move|ev|e.model.update(|f|f.name=event_target_value(&ev))
       on:keydown=move|ev|if ev.key()=="Enter"{ev.prevent_default();e.submit();}/></div>
      <Show when=invalid><p id="name-edit-error" class="field-error" role="alert">{move||e.read(|f|f.error.clone())}</p></Show>
    </form>}
}
struct Field {
    key: &'static str,
    label: &'static str,
    min: &'static str,
    max: &'static str,
    error: &'static str,
}
const HEIGHT: Field = Field {
    key: "height",
    label: "Chiều cao (cm)",
    min: "100",
    max: "250",
    error: "Chiều cao cần từ 100 đến 250 cm.",
};
const WEIGHT: Field = Field {
    key: "weight",
    label: "Cân nặng (kg)",
    min: "30",
    max: "300",
    error: "Cân nặng cần từ 30 đến 300 kg.",
};
const CAL: Field = Field {
    key: "calo",
    label: "Năng lượng (kcal/ngày)",
    min: "800",
    max: "6000",
    error: "Nhập từ 800 đến 6000 kcal hoặc để trống để chỉ ghi bữa ăn.",
};
const PROTEIN: Field = Field {
    key: "protein",
    label: "Protein (g/ngày)",
    min: "20",
    max: "400",
    error: "Protein cần từ 20 đến 400 g",
};
const CARBS: Field = Field {
    key: "carbs",
    label: "Carbs (g/ngày)",
    min: "0",
    max: "1000",
    error: "Carbs cần từ 0 đến 1000 g",
};
const FAT: Field = Field {
    key: "fat",
    label: "Fat (g/ngày)",
    min: "0",
    max: "1000",
    error: "Fat cần từ 0 đến 1000 g",
};
fn numeric(e: Editor, field: Field, body: bool) -> impl IntoView {
    let key = field.key;
    let prefix = if body { "body" } else { "goals" };
    let id = format!("{prefix}-field-{key}");
    let error = StoredValue::new(format!("err-{prefix}-{key}"));
    let invalid = move || e.read(|f| f.invalid(key));
    let current = Memo::new(move |_| e.read(|f| f.value(key)));
    view! {<app-form-field><div class="form-field"><div class="input-wrapper" class:invalid=invalid>
       <label class="input-label" class:invalid=invalid for=id.clone()>{field.label}</label>
       <input id=id.clone() class="input-native" type="number" inputmode=if body{"decimal"}else{"numeric"}
           min=field.min max=field.max step=if body{"any"}else{"1"} placeholder=(!body).then_some("Chưa đặt mục tiêu")
           prop:value=move||current.get().map(number).unwrap_or_default()
           aria-invalid=move||invalid().then_some("true") aria-describedby=move||invalid().then(||error.get_value())
           on:input=move |ev|{let v=event_target_value(&ev).parse::<f64>().ok().filter(|n|n.is_finite());e.model.update(|f|f.set_value(key,v));}/>
      </div><Show when=invalid><div class="field-error" role="alert" id=error.get_value()>{field.error}</div></Show>
    </div></app-form-field>}
}
fn birthday(e: Editor) -> impl IntoView {
    let error = move || e.read(|f| f.body_error("birth"));
    let invalid = move || error().is_some();
    let formatted =
        move || e.read(|f| parse_local_date(&f.birth).map(|v| v.format("%d/%m/%-Y").to_string()));
    let age = move || e.read(|f| age_on_date(Some(&f.birth), parse_local_date(&f.today)?));
    view! {<app-birth-date-field class="inline-age"><app-form-field><div class="form-field"><div class="input-wrapper" class:invalid=invalid>
     <label class="input-label" for="body-field-birth-date" class:invalid=invalid>"Ngày sinh"</label>
     <input id="body-field-birth-date" type="date" lang="vi-VN" required class="input-native" class:has-display=move||formatted().is_some()
         max=move||e.read(|f|f.today.clone()) prop:value=e.read(|f|f.birth.clone()) aria-invalid=move||invalid().then_some("true")
         aria-describedby=move||if invalid(){Some("err-body-birth-date")}else{age().map(|_|"body-field-age-hint")}
         on:input=move|ev|e.model.update(|f|f.birth=event_target_value(&ev))/>
     {move||formatted().map(|v|view!{<span class="date-display" aria-hidden="true">{v}</span>})}
     <ion-icon class="date-chevron" name="chevron-down-outline" aria-hidden="true"></ion-icon>
    </div>{move||error().map(|v|view!{<div id="err-body-birth-date" class="field-error" role="alert">{v}</div>})}
    </div></app-form-field>{move||(!invalid()).then(age).flatten().map(|v|view!{<p id="body-field-age-hint">{v}" tuổi"</p>})}</app-birth-date-field>}
}
pub(super) fn body(e: Editor) -> impl IntoView {
    view! {<div class="form-content"><section aria-labelledby="body-measurements"><h2 id="body-measurements">"Số đo và thông tin cá nhân"</h2>
    <app-body-fields><div class="measurements">{numeric(e,HEIGHT,true)}{numeric(e,WEIGHT,true)}</div>{birthday(e)}
     <fieldset class="gender" aria-label="Giới tính"><legend>"Giới tính"</legend><div class="gender-options">
     { [("male","Nam"),("female","Nữ")].into_iter().map(|(v,l)|view!{<label><input type="radio" role="radio" name="body-field-gender" value=v
         prop:checked=move||e.read(|f|f.gender==v) on:change=move |_|e.model.update(|f|f.gender=v.into())/>" "{l}</label>}).collect_view()}
     </div></fieldset></app-body-fields></section>{preview::body(e)}</div>}
}
pub(super) fn goals(e: Editor) -> impl IntoView {
    let has_birth = move || {
        e.read(|f| {
            f.profile["birth_date"]
                .as_str()
                .is_some_and(|v| !v.is_empty())
        })
    };
    view! {<div class="form-content"><div class="goal-list" role="radiogroup" aria-label="Mục tiêu">
    {["lose_weight","maintain","gain_muscle","performance"].into_iter().map(|g|{
     let selected=move||e.read(|f|f.goal==g);
     view!{<button type="button" class="goal-button goal-button--compact" class:selected=selected role="radio" aria-checked=move||selected().to_string()
      on:click=move |_|e.model.update(|f|{if f.goal!=g{f.goal=g.into();f.update_auto(false);}})>
       <span class="goal-button__label">{home::goal(g)}</span>
       <Show when=selected><ion-icon class="goal-button__check" name="checkmark-circle" aria-hidden="true"></ion-icon></Show></button>}
    }).collect_view()}</div>
    <h3 class="section-caption">"Chỉ số dinh dưỡng"</h3>{numeric(e,CAL,false)}
    {move||e.read(|f|match f.calories{None=>Some("Bạn có thể lên lịch và ghi bữa ăn khi chưa đặt mục tiêu năng lượng."),
       Some(v) if (800.0..=1200.0).contains(&v)=>Some("Mức năng lượng này cần hướng dẫn và theo dõi chuyên môn."),_=>None}).map(|v|view!{<p class="form-hint">{v}</p>})}
    {numeric(e,PROTEIN,false)}{numeric(e,CARBS,false)}{numeric(e,FAT,false)}
    <Show when=has_birth fallback=||view!{<p>"Thêm ngày sinh trong mục Cơ thể để nhận đề xuất."</p>}>
      <ion-button fill="clear" size="small" class="reset-button reset-button--text" on:click=move |_|e.model.update(|f|f.update_auto(true))>"Đặt lại về đề xuất"</ion-button>
    </Show>
    <details class="goal-estimates"><summary>"Cách ứng dụng ước tính mục tiêu"</summary>
      <p>"Năng lượng nghỉ dùng phương trình Mifflin–St Jeor. Ứng dụng nhân kết quả với hệ số hoạt động rồi điều chỉnh theo mục tiêu."</p>
      <p>"Protein dùng mức tham khảo 1,6–2,2 g/kg cân nặng mỗi ngày. Nghiên cứu cơ sở chủ yếu xét người lớn khỏe mạnh tập kháng lực."</p>
      <p>"Bạn có thể để trống mục tiêu đạm. Ứng dụng chỉ đề xuất cho người lớn khi kết quả nằm trong khoảng 20–400 g/ngày."</p>
      <p>"Bạn có thể nhập mục tiêu riêng theo nhu cầu hoặc hướng dẫn chuyên môn."</p>
    </details></div>}
}
fn radio_value(event: CustomEvent) -> Option<wasm_bindgen::JsValue> {
    js_sys::Reflect::get(&event.detail(), &"value".into()).ok()
}
pub(super) fn activity(e: Editor) -> impl IntoView {
    let options = [
        (ActivityLevel::Sedentary, "Ngồi nhiều, ít hoặc không tập"),
        (ActivityLevel::Light, "Tập nhẹ 1–3 buổi/tuần"),
        (ActivityLevel::Moderate, "Tập vừa 3–5 buổi/tuần"),
        (ActivityLevel::Heavy, "Tập nặng 6–7 buổi/tuần"),
    ];
    view! {<div class="form-content"><h2 class="section-caption" id="activity-level">"Mức vận động"</h2>
    <ion-radio-group aria-labelledby="activity-level" prop:value=move||e.read(|f|f.factor)
       on:ionChange=move|event:CustomEvent|if let Some(v)=radio_value(event).and_then(|v|v.as_f64()){e.model.update(|f|f.factor=v);}>
      <ion-list lines="none" class="activity-list">{options.into_iter().map(|(level,desc)|view!{
        <ion-item class="activity-item"><ion-radio slot="start" prop:value=level.factor() label-placement="end" justify="start">
          <ion-label class="activity-label"><strong>{level.labels().0}</strong><p>{desc}</p></ion-label></ion-radio></ion-item>
      }).collect_view()}</ion-list></ion-radio-group>
    <h2 class="section-caption" id="training-level">"Trình độ tập luyện"</h2>
    <ion-radio-group aria-labelledby="training-level" prop:value=move||e.read(|f|f.fitness.clone())
      on:ionChange=move|event:CustomEvent|if let Some(v)=radio_value(event).and_then(|v|v.as_string()){e.model.update(|f|f.fitness=v);}>
      <ion-list lines="none" class="activity-list">{["beginner","intermediate","advanced"].into_iter().map(|level|view!{
         <ion-item class="activity-item"><ion-radio slot="start" value=level label-placement="end" justify="start">{home::fitness(level)}</ion-radio></ion-item>
      }).collect_view()}</ion-list></ion-radio-group>{preview::activity(e)}</div>}
}
pub(super) fn footer(e: Editor, kind: Kind) -> impl IntoView {
    let locked = move || e.read(|f| f.locked);
    let disabled = move || locked() || e.read(|f| f.invalid_form());
    if kind == Kind::Name {
        return view!{<ion-button expand="block" disabled=locked prop:disabled=locked on:click=move |_|e.submit()>{move||if locked(){"Đang lưu…"}else{"Lưu"}}</ion-button>}.into_any();
    }
    view!{<div class="sticky-save-bar">{move||e.read(|f|(!f.error.is_empty()).then(||f.error.clone())).map(|err|view!{<p class="field-error" role="alert">{err}</p>})}
   <ion-button expand="block" class="save-button" color=move||e.read(|f|if f.invalid_form(){"medium"}else{"primary"}) disabled=disabled prop:disabled=disabled
    on:click=move |_|e.submit()>{move||if locked(){"Đang lưu…"}else{"Lưu"}}</ion-button></div>}.into_any()
}
