use super::{state::Field, view::Screen};
use healthmate_domain::profile::Gender;
use leptos::prelude::*;

fn field_shell(
    s: Screen,
    field: Field,
    id: &'static str,
    label: &'static str,
    input: impl IntoView,
) -> impl IntoView {
    let error = move || s.data.with(|w| w.visible_error(field));
    view! {<app-form-field><div class="form-field"><div class="input-wrapper" class:invalid=move || error().is_some()>
    <label class="input-label" class:invalid=move ||error().is_some() for=id>{label}</label>
    {input}</div>
    {move ||error().map(|message|view!{<div class="field-error" id=field.error_id() role="alert">{message}</div>})}
    </div></app-form-field>}
}
fn number(s: Screen, field: Field) -> impl IntoView {
    let height = field == Field::Height;
    let (id, label, test, min, max) = if height {
        ("field-height", "Chiều cao (cm)", "onb-height", "100", "250")
    } else {
        ("field-weight", "Cân nặng (kg)", "onb-weight", "30", "300")
    };
    let invalid = move || s.data.with(|w| w.visible_error(field).is_some());
    let initial = s
        .data
        .with_untracked(|w| if height { w.height } else { w.weight })
        .map(|v| v.to_string())
        .unwrap_or_default();
    field_shell(
        s,
        field,
        id,
        label,
        view! {
            <input id=id type="number" step="any" inputmode="decimal" min=min max=max data-testid=test class="input-native" prop:value=initial
             on:input=move |e| {
                let value=event_target_value(&e).parse::<f64>().ok().filter(|v|v.is_finite());
                s.data.update(|w| if height{w.height=value}else{w.weight=value});
             }
             aria-invalid=move ||invalid().then_some("true") aria-describedby=move ||invalid().then_some(field.error_id())/>
        },
    )
}
fn birthday(s: Screen) -> impl IntoView {
    let invalid = move || s.data.with(|w| w.visible_error(Field::Birth).is_some());
    let age = move || s.data.with(|w| w.age());
    let display = move || s.data.with(|w| w.date_display());
    let initial = s.data.with_untracked(|w| w.birth.clone());
    view! {<app-birth-date-field class="inline-age">
        {field_shell(s, Field::Birth,"field-birth-date","Ngày sinh",view!{
            <input id="field-birth-date" type="date" lang="vi-VN" required class="input-native" class:has-display=move ||display().is_some()
             max=move ||s.data.with(|w|w.day.to_string()) prop:value=initial
             on:input=move |e|s.data.update(|w|w.birth=event_target_value(&e))
             on:blur=move |_|s.data.update(|w|w.date_touched=true)
             aria-invalid=move ||invalid().then_some("true")
             aria-describedby=move || if invalid(){Some("err-birth-date")}else{age().map(|_|"field-age-hint")}/>
             {move ||display().map(|d|view!{<span class="date-display" aria-hidden="true">{d}</span>})}
             <ion-icon class="date-chevron" name="chevron-down-outline" aria-hidden="true"></ion-icon>
        })}
        {move || (!invalid()).then(age).flatten().map(|age| view!{<p id="field-age-hint">{age}" tuổi"</p>})}
    </app-birth-date-field>}
}
pub(super) fn body(s: Screen) -> impl IntoView {
    let gender_error = move || s.data.with(|w| w.visible_error(Field::Gender));
    view! {<div class="body-step-form"><h1 tabindex="-1">"Số đo và thông tin cá nhân"</h1>
    <p>"Dùng để ước tính mục tiêu dinh dưỡng của bạn."</p>
    <app-body-fields><div class="measurements">{number(s,Field::Height)}{number(s,Field::Weight)}</div>
     {birthday(s)}
     <fieldset class="gender" aria-label="Giới tính" aria-describedby=move ||gender_error().map(|_|"err-gender")>
         <legend>"Giới tính"</legend><div class="gender-options">
           {[(Gender::Male,"male","Nam"),(Gender::Female,"female","Nữ")].into_iter().map(|(v,value,label)| view!{
              <label><input type="radio" role="radio" name="field-gender" value=value prop:checked=move ||s.data.with(|w|w.gender==Some(v))
                 on:change=move |_|s.data.update(|w|w.gender=Some(v))/>" "{label}</label>
           }).collect_view()}
         </div>{move ||gender_error().map(|err|view!{<div id="err-gender" class="field-error" role="alert">{err}</div>})}
     </fieldset></app-body-fields></div>}
}
