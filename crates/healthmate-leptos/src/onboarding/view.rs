use super::{
    fields,
    state::{Field, Wizard},
};
use healthmate_domain::profile::{ActivityLevel, Goal, GymExperience};
use leptos::prelude::*;
use serde_json::Value;

#[derive(Clone, Copy)]
pub(super) struct Screen {
    pub data: RwSignal<Wizard>,
    pub focus: UnsyncCallback<&'static str>,
    pub commit: UnsyncCallback<Value>,
}
impl Screen {
    pub fn back(self) -> bool {
        let step = self.data.with_untracked(|s| s.step);
        if step == 1 {
            return false;
        }
        self.data.update(|s| {
            s.step -= 1;
            s.date_touched = false;
        });
        self.focus.run("h1");
        true
    }
    fn advance(self) {
        let current = self.data.with_untracked(|s| s.step);
        if current == 1 {
            if self.data.with_untracked(|s| s.goal.is_none()) {
                return;
            }
            self.data.update(|s| {
                s.step = 2;
                s.date_touched = false;
            });
        } else {
            self.data.update(|s| s.submitted_body = true);
            if let Some(field) = self.data.with_untracked(Wizard::first_invalid) {
                self.data.update(|s| s.step = 2);
                self.focus.run(match field {
                    Field::Height => "#err-height",
                    Field::Weight => "#err-weight",
                    Field::Birth => "#err-birth-date",
                    Field::Gender => "#err-gender",
                });
                return;
            }
            if current == 3 {
                if let Some(payload) = self
                    .data
                    .with_untracked(|s| (!s.saving && !s.saved).then(|| s.profile()).flatten())
                {
                    self.data.update(|s| {
                        s.saving = true;
                        s.save_error = false;
                    });
                    self.commit.run(payload);
                }
                return;
            }
            self.data.update(|s| s.step = 3);
        }
        self.focus.run("h1");
    }
}

#[derive(Clone, Copy)]
enum Choice {
    Goal(Goal),
    Activity(ActivityLevel),
    Gym(GymExperience),
}
impl Choice {
    fn select(self, s: Screen) {
        s.data.update(|w| match self {
            Self::Goal(v) => w.goal = Some(v),
            Self::Activity(v) => w.activity = Some(v),
            Self::Gym(v) => w.experience = Some(v),
        });
    }
    fn selected(self, s: Screen) -> bool {
        s.data.with(|w| match self {
            Self::Goal(v) => w.goal == Some(v),
            Self::Activity(v) => w.activity == Some(v),
            Self::Gym(v) => w.experience == Some(v),
        })
    }
}

fn radio(
    s: Screen,
    value: Choice,
    label: &'static str,
    icon: Option<&'static str>,
) -> impl IntoView {
    view! {<div class="radio-item" class:selected=move || value.selected(s) role="radio" tabindex="0"
        aria-checked=move || value.selected(s).to_string() on:click=move |_|value.select(s)
        on:keydown=move |event|match event.key().as_str(){"Enter"=>value.select(s)," "=>{event.prevent_default();value.select(s);},_=>{}}>
        <span class="radio-circle" aria-hidden="true"></span>
        {icon.map(|name|view!{<ion-icon name=name class="radio-icon"></ion-icon>})}
        <span class="radio-label">{label}</span>
        <Show when=move || value.selected(s)><ion-icon name="checkmark" class="check-icon"></ion-icon></Show>
    </div>}
}

fn goals(s: Screen) -> impl IntoView {
    let disabled = move || s.data.with(|w| w.goal.is_none());
    view! {<div class="step-content">
        <h1 class="step-title" tabindex="-1">"Chọn mục tiêu"</h1>
        <p class="step-subtitle">"Chọn mục tiêu chính để tính chỉ tiêu dinh dưỡng."</p>
        <div role="radiogroup" aria-label="Chọn mục tiêu">
            {[(Goal::LoseWeight,"Giảm cân","body-outline"),(Goal::GainMuscle,"Tăng cơ","barbell-outline"),(Goal::Maintain,"Duy trì","scale-outline"),(Goal::Performance,"Tăng sức mạnh","trophy-outline")]
                .into_iter().map(|(v,label,icon)|radio(s,Choice::Goal(v),label,Some(icon))).collect_view()}
        </div>
        <ion-button data-testid="onb-step1-continue" expand="block" color=move || if disabled() {"medium"}else{"secondary"}
            class="cta-button" disabled=disabled prop:disabled=disabled on:click=move |_|s.advance()>"Tiếp tục"</ion-button>
    </div>}
}
fn activity(s: Screen) -> impl IntoView {
    view! {<div class="step-content activity-step"><h1 class="step-title" tabindex="-1">"Mức hoạt động"</h1>
        <p class="step-subtitle">"Chọn mức vận động thường ngày và kinh nghiệm tập."</p>
        <p class="section-label section-label--flush">"Mức vận động"</p>
        <div role="radiogroup" aria-label="Mức vận động">
            {[ActivityLevel::Sedentary,ActivityLevel::Light,ActivityLevel::Moderate,ActivityLevel::Heavy].into_iter()
                .map(|v| radio(s,Choice::Activity(v),v.labels().1,None)).collect_view()}
        </div>
        <p class="section-label">"Kinh nghiệm tập gym?"</p><div role="radiogroup" aria-label="Kinh nghiệm tập gym">
            {[(GymExperience::Never,"Chưa bao giờ"),(GymExperience::UnderSixMonths,"Dưới 6 tháng"),
                (GymExperience::SixMonthsToTwoYears,"Từ 6 tháng đến 2 năm"),(GymExperience::OverTwoYears,"Trên 2 năm")]
                .into_iter().map(|(v,l)| radio(s,Choice::Gym(v),l,None)).collect_view()}
        </div>
        {move || s.data.with(|w|w.estimate().and_then(|e|e.energy_note)).map(|note|
            view!{<p class="step-subtitle" role="status">{note}" Bạn vẫn có thể lên lịch và ghi bữa ăn."</p>})}
    </div>}
}

fn footer(s: Screen, step: u8) -> impl IntoView {
    let disabled = move || {
        s.data.with(|w| {
            if step == 2 {
                !w.present()
            } else {
                w.saving || w.activity.is_none() || w.experience.is_none()
            }
        })
    };
    let back_disabled = move || step == 3 && s.data.with(|w| w.saving);
    view! {<ion-footer class="ion-no-border onboarding-footer">
    <Show when=move || step==3 && s.data.with(|w|w.save_error)>
        <div class="error-toast" role="alert" aria-live="assertive"><ion-text color="danger">"Lưu thất bại. Vui lòng thử lại."</ion-text></div>
    </Show>
    <div class="button-row">
    <ion-button data-testid=if step==2 {"onb-step2-back"}else{"onb-step3-back"} fill="outline" class="btn-row btn-row--secondary"
       disabled=back_disabled prop:disabled=back_disabled on:click=move |_| {s.back();}>"Quay lại"</ion-button>
    <ion-button data-testid=if step==2 {"onb-step2-continue"}else{"onb-step3-finish"} class="btn-row btn-row--primary"
       color=move || if disabled() {"medium"}else{"primary"} disabled=disabled prop:disabled=disabled on:click=move |_|s.advance()>
       {move || if step==2 {"Tiếp tục"}else if s.data.with(|w| w.saving) {"Đang lưu…"}else{"Hoàn tất"}}
    </ion-button></div></ion-footer>}
}
pub(super) fn page(s: Screen) -> impl IntoView {
    let step = Memo::new(move |_| s.data.with(|w| w.step));
    let can_go_back = move || step.get() > 1;
    view! {
        <ion-header class:body-step=move || step.get()==2><ion-toolbar>
            <Show when=can_go_back><ion-buttons slot="start" class:body-back-slot=move || step.get()==2>
                <ion-button fill="clear" class="back-button" aria-label="Quay lại" on:click=move |_|{s.back();}>
                <ion-icon slot="icon-only" name="arrow-back-outline"></ion-icon></ion-button></ion-buttons></Show>
            <ion-title>"Thiết lập hồ sơ"</ion-title></ion-toolbar>
            <ion-progress-bar prop:value=move || f64::from(step.get())/3.0 class="onboarding-progress"></ion-progress-bar>
        </ion-header>
        <ion-content class:body-step=move || step.get()==2><div class="page-container">
            {move || match step.get(){ 1=>goals(s).into_any(),2=>fields::body(s).into_any(),_=>activity(s).into_any()}}
        </div></ion-content>
        {move ||{let current=step.get();(current>1).then(||footer(s,current))}}
    }
}
