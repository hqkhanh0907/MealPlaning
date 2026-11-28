use crate::model::trimmed;
use leptos::{mount::mount_to, prelude::*};
use std::{cell::Cell, rc::Rc};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::{JsFuture, spawn_local};
use web_sys::HtmlElement;

#[derive(Clone, Copy, Default)]
struct Errors {
    name: Option<&'static str>,
    username: Option<&'static str>,
    password: Option<&'static str>,
    request: Option<&'static str>,
}

fn name_error(name: &str) -> Option<&'static str> {
    match trimmed(name).chars().count() {
        0 => Some("Nhập họ và tên."),
        1..=100 => None,
        _ => Some("Họ và tên tối đa 100 ký tự."),
    }
}

fn request_error(response: &JsValue, register: bool) -> Errors {
    let get = |key: &str| js_sys::Reflect::get(response, &key.into()).unwrap_or(JsValue::NULL);
    let mut errors = Errors::default();
    match get("field").as_string().as_deref() {
        Some("name") => errors.name = Some("Kiểm tra lại họ và tên."),
        Some("username") => {
            errors.username = Some("Tên đăng nhập này không dùng được. Hãy thử tên khác.")
        }
        _ => {
            errors.request = Some(match get("status").as_f64() {
                Some(403.0) if get("code").as_string().as_deref() == Some("account_forbidden") => {
                    "Tài khoản thiếu quyền đồng bộ."
                }
                Some(400.0 | 401.0) if register => {
                    "Không tạo được tài khoản. Hãy kiểm tra thông tin."
                }
                Some(400.0 | 401.0) => "Tên đăng nhập hoặc mật khẩu chưa đúng.",
                _ => "Chưa kết nối được. Hãy thử lại sau.",
            });
        }
    }
    errors
}

#[wasm_bindgen]
pub struct AccountHandle {
    alive: Rc<Cell<bool>>,
    cleanup: Option<Box<dyn FnOnce()>>,
}

impl Drop for AccountHandle {
    fn drop(&mut self) {
        self.alive.set(false);
        if let Some(cleanup) = self.cleanup.take() {
            cleanup()
        }
    }
}

#[wasm_bindgen(js_name = mountAccount)]
pub fn mount_account(host: HtmlElement, authenticate: js_sys::Function) -> AccountHandle {
    let alive = Rc::new(Cell::new(true));
    let active = alive.clone();
    let mount = mount_to(host, move || {
        let register = RwSignal::new(false);
        let busy = RwSignal::new(false);
        let name = RwSignal::new(String::new());
        let errors = RwSignal::new(Errors::default());
        let username = NodeRef::<leptos::html::Input>::new();
        let password = NodeRef::<leptos::html::Input>::new();
        let submit = move |event: web_sys::SubmitEvent| {
            event.prevent_default();
            if busy.get_untracked() {
                return;
            }
            let (Some(user), Some(pass)) = (username.get_untracked(), password.get_untracked())
            else {
                return;
            };
            let identity = trimmed(&user.value()).to_lowercase();
            let is_register = register.get_untracked();
            let full_name = name.get_untracked();
            let valid_user = (3..=32).contains(&identity.len())
                && identity
                    .bytes()
                    .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == b'_');
            let valid_password = (8..=72).contains(&pass.value().encode_utf16().count());
            let validation = Errors {
                name: if is_register {
                    name_error(&full_name)
                } else {
                    None
                },
                username: (!valid_user)
                    .then_some("Nhập 3 đến 32 ký tự. Dùng chữ không dấu, số hoặc dấu gạch dưới."),
                password: (!valid_password).then_some("Mật khẩu cần từ 8 đến 72 ký tự."),
                request: None,
            };
            errors.set(validation);
            if validation.name.is_some() || !valid_user || !valid_password {
                return;
            }
            busy.set(true);
            let raw = |el: &web_sys::HtmlInputElement| {
                js_sys::Reflect::get(el, &"value".into()).unwrap_throw()
            };
            let display_name = if is_register {
                JsValue::from_str(&full_name)
            } else {
                JsValue::UNDEFINED
            };
            let result =
                authenticate.call3(&JsValue::UNDEFINED, &raw(&user), &raw(&pass), &display_name);
            let active = active.clone();
            spawn_local(async move {
                let response = match result {
                    Ok(value) => JsFuture::from(js_sys::Promise::resolve(&value))
                        .await
                        .unwrap_or(JsValue::FALSE),
                    Err(_) => JsValue::FALSE,
                };
                if !active.get() {
                    return;
                }
                if !response.is_null() {
                    errors.set(request_error(&response, is_register));
                }
                busy.set(false);
            });
        };
        let title = move || {
            if register.get() {
                "Tạo tài khoản"
            } else {
                "Đăng nhập"
            }
        };
        view! {
            <main class="account">
                <div class="account-brand">"HealthMate AI"</div>
                <header class="account-intro">
                    <h1 id="account-title">{title}</h1>
                    <p>{move || if register.get() { "Tạo hồ sơ để lên lịch ăn và tập luyện." } else { "Xem lịch ăn và ghi buổi tập của bạn." }}</p>
                </header>
                <form aria-labelledby="account-title" novalidate on:submit=submit>
                    <Show when=move || register.get()>
                        <div class="input-wrapper" class:invalid=move || errors.get().name.is_some()>
                            <label for="full-name" class="input-label">"Họ và tên"</label>
                            <input id="full-name" class="input-native" autocomplete="name" autocapitalize="words" required prop:value=move || name.get()
                                disabled=move || busy.get() aria-invalid=move || errors.get().name.map(|_|"true")
                                aria-describedby=move || errors.get().name.map(|_|"name-error")
                                on:input=move |e| { let value=event_target_value(&e); if errors.get_untracked().name.is_some(){errors.update(|v|v.name=name_error(&value));} name.set(value); } />
                        </div>
                        {move || errors.get().name.map(|s|view! {<p id="name-error" class="error" role="alert">{s}</p>})}
                    </Show>
                    <div class="input-wrapper" class:invalid=move || errors.get().username.is_some()>
                        <label for="username" class="input-label">"Tên đăng nhập"</label>
                        <input node_ref=username id="username" class="input-native" autocomplete="username" autocapitalize="none" spellcheck="false" required
                           disabled=move || busy.get() aria-invalid=move || errors.get().username.map(|_|"true") aria-describedby=move || errors.get().username.map(|_|"username-error") />
                    </div>
                    {move || errors.get().username.map(|s|view! {<p id="username-error" class="error" role="alert">{s}</p>})}
                    <div class="input-wrapper" class:invalid=move || errors.get().password.is_some()>
                        <label for="password" class="input-label">"Mật khẩu"</label>
                        <input node_ref=password id="password" type="password" class="input-native" autocomplete=move || if register.get() {"new-password"} else {"current-password"}
                           aria-invalid=move || errors.get().password.map(|_|"true") aria-describedby=move || if errors.get().password.is_some(){Some("password-error")} else {register.get().then_some("password-hint")}
                           required disabled=move || busy.get() />
                    </div>
                    {move || if let Some(s)=errors.get().password {Some(view! {<p id="password-error" class="error" role="alert">{s}</p>}.into_any())} else {register.get().then(||view! {<p id="password-hint" class="password-hint">"Dùng từ 8 đến 72 ký tự."</p>}.into_any())}}
                    {move || errors.get().request.map(|s|view! {<p class="error" role="alert">{s}</p>})}
                    <button type="submit" class="primary" disabled=move || busy.get()>{move || if busy.get() {"Đang kết nối…"} else {title()} }</button>
                    <div class="account-switch"><span>{move || if register.get() {"Đã có tài khoản?"} else {"Chưa có tài khoản?"}}</span>
                        <button type="button" class="secondary" disabled=move || busy.get() on:click=move |_|{register.update(|r| *r = !*r);errors.set(Errors::default());}>
                          {move || if register.get() {"Đăng nhập"} else {"Tạo tài khoản"}}</button>
                    </div>
                </form>
            </main>
        }
    });
    AccountHandle {
        alive,
        cleanup: Some(Box::new(move || drop(mount))),
    }
}
