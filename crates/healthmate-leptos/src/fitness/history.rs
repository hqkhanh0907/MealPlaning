use super::{
    Action,
    model::{History, duration, number},
};
use leptos::prelude::*;
pub(super) fn details(d: ReadSignal<History>, send: Action) -> impl IntoView {
    move || {
        let s = d.get();
        if s.exercises.is_empty() {
            return view! { <p>"Không có chi tiết bài tập."</p> }.into_any();
        }
        s.exercises.into_iter().map(|exercise|{let id=exercise.id;
            let sets=if exercise.sets.is_empty(){view! { <p>"Chưa ghi hiệp nào."</p> }.into_any()}else{
                view! {
                    <ul class="session-sets">
                        {exercise
                            .sets
                            .into_iter()
                            .map(|set| {
                                let info = if set.status == "skipped" {
                                    view! {
                                        <span class="session-set--skipped">"Đã bỏ qua"</span>
                                    }
                                        .into_any()
                                } else {
                                    let editable = set.can_edit(&id);
                                    view! {
                                        <span>{set.value(&id)}</span>
                                        {editable
                                            .then(|| {
                                                view! {
                                                    <ion-button
                                                        fill="clear"
                                                        size="small"
                                                        aria-label=format!("Sửa hiệp {}", set.set_number)
                                                        disabled=s.saving
                                                        on:click=move |_| send.run(("editSet", set.id.clone()))
                                                    >
                                                        "Sửa"
                                                    </ion-button>
                                                }
                                            })}
                                    }
                                        .into_any()
                                };
                                view! {
                                    <li>
                                        <span>"Hiệp "{set.set_number}</span>
                                        " "
                                        {info}
                                    </li>
                                }
                            })
                            .collect_view()}
                    </ul>
                }.into_any()
            };
            view! {
                <section class="session-exercise">
                    <h3>{exercise.name}</h3>
                    {exercise
                        .note
                        .filter(|n| !n.is_empty())
                        .map(|n| view! { <p>"Ghi chú cuối buổi · "{n}</p> })}
                    {exercise
                        .unit
                        .filter(|n| !n.is_empty())
                        .map(|n| {
                            view! { <p class="session-exercise__unit">"Đơn vị ghi: "{n}</p> }
                        })}
                    {sets}
                </section>
            }
        }).collect_view().into_any()
    }
}
pub(super) fn summary(data: ReadSignal<History>, _: Action) -> impl IntoView {
    move || {
        let s = data.get();
        let count = s.count();
        let label = s.title.unwrap_or_else(|| {
            if s.mode == "free" {
                "Tập tự do".into()
            } else {
                "Buổi tập".into()
            }
        });
        view! {
            <span class="session-card__date">
                <span class="session-card__day-name">{label}</span>
                <time class="session-card__date-text" datetime=s.date>
                    {s.date_label}
                </time>
            </span>
            <span class="session-card__stats">
                <span class="stat">
                    <ion-icon name="list-outline" aria-hidden="true"></ion-icon>
                    {count}
                    " hiệp đã ghi"
                </span>
                <span class="stat">
                    <ion-icon name="barbell-outline" aria-hidden="true"></ion-icon>
                    "Tổng khối lượng "
                    {number(s.volume)}
                    " kg"
                </span>
                <span class="stat">
                    <ion-icon name="timer-outline" aria-hidden="true"></ion-icon>
                    {duration(s.minutes)}
                </span>
            </span>
            <ion-icon
                class="session-card__chevron"
                name="chevron-down-outline"
                aria-hidden="true"
            ></ion-icon>
        }
    }
}
pub(super) fn replay(d: ReadSignal<History>, send: Action) -> impl IntoView {
    move || {
        let s = d.get();
        if s.mode != "free" || s.exercises.is_empty() {
            return ().into_any();
        }
        let id = s.id;
        if let Some(p) = s.preview {
            view! {
                <section class="session-replay" aria-label="Xem trước buổi tập lại">
                    <h3>"Xem trước buổi tập lại"</h3>
                    <p>{p.place}</p>
                    <ol>
                        {p
                            .exercises
                            .into_iter()
                            .map(|item| {
                                view! {
                                    <li>
                                        {item.name}
                                        {(!item.note.is_empty())
                                            .then(|| view! { <small>" · "{item.note}</small> })}
                                    </li>
                                }
                            })
                            .collect_view()}
                    </ol>
                    {if s.active {
                        view! {
                            <p>"Bạn đang có một buổi tập dang dở."</p>
                            <ion-button on:click=move |_| {
                                send.run(("resume", String::new()))
                            }>"Tiếp tục buổi đang tập"</ion-button>
                        }
                            .into_any()
                    } else {
                        view! {
                            <ion-button
                                data-testid="start-replay"
                                disabled=s.busy
                                on:click=move |_| send.run(("startReplay", id.clone()))
                            >
                                "Bắt đầu tập lại"
                            </ion-button>
                        }
                            .into_any()
                    }}
                    <ion-button fill="clear" on:click=move |_| send.run(("clear", String::new()))>
                        "Đóng"
                    </ion-button>
                </section>
            }
            .into_any()
        } else {
            view! {
                <ion-button
                    fill="outline"
                    data-testid="replay-workout"
                    disabled=s.busy
                    on:click=move |_| send.run(("prepareReplay", id.clone()))
                >
                    "Tập lại"
                </ion-button>
            }
            .into_any()
        }
    }
}
