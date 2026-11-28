mod forms;
mod preview;

use super::{number, parse, string};
use healthmate_domain::{
    dates::{age_on_date, parse_local_date},
    profile::{
        Gender, Goal, Measurement, RecalcInput, RecalcOutput, Target, birth_date_error,
        body_measurement_error, recalc_targets, valid_manual_target,
    },
};
use leptos::{mount::mount_to, prelude::*};
use serde_json::{Map, Value, json};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::{JsFuture, spawn_local};
use web_sys::HtmlElement;

#[derive(Clone, Copy, PartialEq, Eq)]
enum Kind {
    Name,
    Body,
    Goals,
    Activity,
}
impl Kind {
    fn parse(v: &str) -> Result<Self, JsValue> {
        match v {
            "name" => Ok(Self::Name),
            "body" => Ok(Self::Body),
            "goals" => Ok(Self::Goals),
            "activity" => Ok(Self::Activity),
            _ => Err(js_sys::Error::new("Unknown settings editor").into()),
        }
    }
}
#[derive(Clone)]
struct Form {
    kind: Kind,
    initial: Value,
    profile: Value,
    today: String,
    name: String,
    height: Option<f64>,
    weight: Option<f64>,
    birth: String,
    gender: String,
    goal: String,
    calories: Option<f64>,
    protein: Option<f64>,
    carbs: Option<f64>,
    fat: Option<f64>,
    calorie_mode: String,
    protein_mode: String,
    factor: f64,
    fitness: String,
    error: String,
    locked: bool,
}
impl Form {
    fn new(kind: Kind, input: &Value) -> Self {
        let p = &input["profile"];
        let text = |k: &str, default: &str| p[k].as_str().unwrap_or(default).to_owned();
        let num = |k: &str| p[k].as_f64();
        Self {
            kind,
            initial: p.clone(),
            profile: p.clone(),
            today: string(input, "today"),
            name: string(input, "name"),
            height: num("height_cm"),
            weight: num("weight_kg"),
            birth: text("birth_date", ""),
            gender: text("gender", "male"),
            goal: text("goal", "maintain"),
            calories: if p.is_null() {
                Some(0.)
            } else {
                num("target_calories").filter(|v| *v != 0.)
            },
            protein: num("target_protein").filter(|v| *v != 0.),
            carbs: num("target_carbs"),
            fat: num("target_fat"),
            calorie_mode: text("calorie_target_mode", "auto"),
            protein_mode: text("protein_target_mode", "auto"),
            factor: num("activity_factor").unwrap_or(1.55),
            fitness: text("fitness_level", "beginner"),
            error: String::new(),
            locked: false,
        }
    }
    fn body_error(&self, key: &str) -> Option<&'static str> {
        match key {
            "height" => body_measurement_error(Measurement::HeightCm, self.height),
            "weight" => body_measurement_error(Measurement::WeightKg, self.weight),
            "birth"
                if !self.birth.is_empty()
                    && self.initial["birth_date"].as_str() == Some(&self.birth) =>
            {
                None
            }
            "birth" => {
                parse_local_date(&self.today).and_then(|day| birth_date_error(&self.birth, day))
            }
            _ => None,
        }
    }
    fn value(&self, key: &str) -> Option<f64> {
        match key {
            "height" => self.height,
            "weight" => self.weight,
            "calo" => self.calories,
            "protein" => self.protein,
            "carbs" => self.carbs,
            "fat" => self.fat,
            _ => None,
        }
    }
    fn set_value(&mut self, key: &str, v: Option<f64>) {
        match key {
            "height" => self.height = v,
            "weight" => self.weight = v,
            "calo" => {
                self.calorie_mode = "manual".into();
                self.calories = v;
            }
            "protein" => {
                self.protein_mode = "manual".into();
                self.protein = v;
            }
            "carbs" => self.carbs = v,
            "fat" => self.fat = v,
            _ => {}
        }
    }
    fn invalid(&self, key: &str) -> bool {
        let target = match key {
            "calo" => Target::Calories,
            "protein" => Target::Protein,
            "carbs" => Target::Carbs,
            "fat" => Target::Fat,
            _ => return self.body_error(key).is_some(),
        };
        !valid_manual_target(target, self.value(key))
    }
    fn dirty_activity(&self) -> bool {
        !self.profile.is_null()
            && (self.profile["activity_factor"].as_f64() != Some(self.factor)
                || self.profile["fitness_level"].as_str() != Some(&self.fitness))
    }
    fn invalid_form(&self) -> bool {
        match self.kind {
            Kind::Name => false,
            Kind::Body => {
                ["height", "weight", "birth"]
                    .into_iter()
                    .any(|k| self.invalid(k))
                    || !matches!(self.gender.as_str(), "male" | "female")
            }
            Kind::Goals => ["calo", "protein", "carbs", "fat"]
                .into_iter()
                .any(|k| self.invalid(k)),
            Kind::Activity => !self.dirty_activity(),
        }
    }
    fn estimate(&self) -> Option<RecalcOutput> {
        let p = &self.profile;
        if p.is_null() || self.kind == Kind::Body && self.invalid_form() {
            return None;
        }
        let change_body = self.kind == Kind::Body;
        let birth = if change_body {
            Some(self.birth.as_str())
        } else {
            p["birth_date"].as_str()
        };
        let gender = if change_body {
            self.gender.as_str()
        } else {
            p["gender"].as_str()?
        };
        let goal = if self.kind == Kind::Goals {
            self.goal.as_str()
        } else {
            p["goal"].as_str()?
        };
        let factor = if self.kind == Kind::Activity {
            self.factor
        } else {
            p["activity_factor"].as_f64()?
        };
        Some(recalc_targets(&RecalcInput {
            height_cm: if change_body {
                self.height?
            } else {
                p["height_cm"].as_f64()?
            },
            weight_kg: if change_body {
                self.weight?
            } else {
                p["weight_kg"].as_f64()?
            },
            age: f64::from(age_on_date(birth, parse_local_date(&self.today)?)?),
            gender: match gender {
                "male" => Gender::Male,
                "female" => Gender::Female,
                _ => return None,
            },
            goal: match goal {
                "lose_weight" => Goal::LoseWeight,
                "maintain" => Goal::Maintain,
                "gain_muscle" => Goal::GainMuscle,
                "performance" => Goal::Performance,
                _ => return None,
            },
            activity_factor: factor,
        }))
    }
    fn update_auto(&mut self, reset: bool) {
        let Some(v) = self.estimate() else {
            return;
        };
        if reset || self.calorie_mode == "auto" {
            self.calorie_mode = "auto".into();
            self.calories = (v.target_calories != 0.).then_some(v.target_calories);
        }
        if reset || self.protein_mode == "auto" {
            self.protein_mode = "auto".into();
            self.protein = (v.target_protein != 0.).then_some(v.target_protein);
        }
    }
    fn submit(&mut self) -> Option<Value> {
        if self.locked || self.invalid_form() {
            return None;
        }
        let patch = match self.kind {
            Kind::Name => {
                let trimmed = js_sys::JsString::from(self.name.as_str()).trim();
                let len = String::from(trimmed).chars().count();
                if len == 0 || len > 100 {
                    self.error = if len == 0 {
                        "Nhập họ và tên."
                    } else {
                        "Họ và tên tối đa 100 ký tự."
                    }
                    .into();
                    return None;
                }
                json!({"name": self.name})
            }
            Kind::Body | Kind::Activity => {
                let baseline = if self.kind == Kind::Body {
                    &self.initial
                } else {
                    &self.profile
                };
                if baseline.is_null() {
                    return None;
                }
                let candidates = if self.kind == Kind::Body {
                    json!({"height_cm":self.height,"weight_kg":self.weight,"gender":self.gender,"birth_date":self.birth})
                } else {
                    json!({"activity_factor":self.factor,"fitness_level":self.fitness})
                };
                let same = |key: &str, v: &Value| {
                    if v.is_number() {
                        baseline[key].as_f64() == v.as_f64()
                    } else {
                        &baseline[key] == v
                    }
                };
                let changed: Map<String, Value> = candidates
                    .as_object()?
                    .iter()
                    .filter(|(k, v)| !same(k, v))
                    .map(|(k, v)| (k.clone(), v.clone()))
                    .collect();
                json!({"patch":changed})
            }
            Kind::Goals => {
                json!({"patch":{"goal":self.goal,"target_calories":self.calories.unwrap_or(0.),"calorie_target_mode":self.calorie_mode,
       "target_protein":self.protein.unwrap_or(0.),"protein_target_mode":self.protein_mode,"target_carbs":self.carbs,"target_fat":self.fat}})
            }
        };
        self.locked = true;
        self.error.clear();
        Some(patch)
    }
}
#[derive(Clone, Copy)]
struct Editor {
    model: RwSignal<Form>,
    save: UnsyncCallback<Value>,
}
impl Editor {
    fn read<T>(self, f: impl FnOnce(&Form) -> T) -> T {
        self.model.with(f)
    }
    fn submit(self) {
        if let Some(payload) = self.model.try_update(Form::submit).flatten() {
            self.save.run(payload);
        }
    }
}
#[wasm_bindgen]
pub struct SettingsEditorHandle {
    editor: Editor,
    owner: Owner,
    unmount: Option<Box<dyn FnOnce()>>,
}
#[wasm_bindgen(js_name=mountSettingsEditor)]
pub fn mount(
    body: HtmlElement,
    footer: HtmlElement,
    kind: &str,
    input: &str,
    callback: js_sys::Function,
) -> Result<SettingsEditorHandle, JsValue> {
    let kind = Kind::parse(kind)?;
    let data = parse(input)?;
    let owner = Owner::new();
    let editor = owner.with(|| {
        let model = RwSignal::new(Form::new(kind, &data));
        let save = UnsyncCallback::new(move |p: Value| {
            let value = js_sys::JSON::parse(&p.to_string()).unwrap_throw();
            let result = callback.call1(&JsValue::UNDEFINED, &value);
            spawn_local(async move {
                let result = match result {
                    Ok(v) => JsFuture::from(js_sys::Promise::resolve(&v)).await,
                    Err(e) => Err(e),
                };
                if let Err(error) = result {
                    let message = js_sys::Reflect::get(&error, &"message".into())
                        .ok()
                        .and_then(|v| v.as_string())
                        .unwrap_or_else(|| "Chưa lưu được thay đổi.".into());
                    model.try_update(|f| {
                        f.error = message;
                        f.locked = false;
                    });
                } else if kind == Kind::Name {
                    model.try_update(|f| f.locked = false);
                }
            });
        });
        Editor { model, save }
    });
    let page = mount_to(body, move || match kind {
        Kind::Name => forms::name(editor).into_any(),
        Kind::Goals => forms::goals(editor).into_any(),
        Kind::Activity => forms::activity(editor).into_any(),
        Kind::Body => forms::body(editor).into_any(),
    });
    let buttons = mount_to(footer, move || forms::footer(editor, kind));
    Ok(SettingsEditorHandle {
        editor,
        owner,
        unmount: Some(Box::new(move || drop((page, buttons)))),
    })
}
#[wasm_bindgen]
impl SettingsEditorHandle {
    pub fn update(&self, input: &str) -> Result<(), JsValue> {
        let v = parse(input)?;
        self.editor.model.update(|f| {
            let day = string(&v, "today");
            let changed = day != f.today;
            f.today = day;
            f.profile = v["profile"].clone();
            if changed && f.kind == Kind::Goals {
                f.update_auto(false);
            }
        });
        Ok(())
    }
}
impl Drop for SettingsEditorHandle {
    fn drop(&mut self) {
        if let Some(unmount) = self.unmount.take() {
            unmount();
        }
        self.owner.cleanup();
    }
}
