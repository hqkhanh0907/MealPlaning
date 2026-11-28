use super::{Editor, number};
use crate::settings::home;
use leptos::prelude::*;

pub(super) fn body(e: Editor) -> impl IntoView {
    view! {{move||e.read(|f|f.estimate().map(|r|(r,home::activity(f.profile["activity_factor"].as_f64().unwrap_or_default())))).map(|(r,activity)|view!{
      <section class="estimates" aria-labelledby="body-estimates"><h2 id="body-estimates">"Ước tính hằng ngày"</h2>
        <dl class="targets">
          {r.energy_note.is_none().then(||view!{<div><dt>"Năng lượng đề xuất"</dt><dd><strong>{number(r.target_calories)}</strong>" kcal/ngày"</dd></div>})}
          <div><dt>"Đạm tham khảo"</dt><dd>{if r.target_protein!=0.{view!{<strong>{number(r.target_protein)}</strong>" g/ngày"}.into_any()}else{"Chưa có đề xuất".into_any()}}</dd></div>
        </dl>
        {r.energy_note.map(|note|view!{<p class="estimate-note">{note}" Bạn vẫn có thể ghi bữa ăn."</p>})}
        {(r.bmr>0.).then(||view!{<dl class="expenditure"><div><dt>"Năng lượng lúc nghỉ"</dt><dd>{number(r.bmr)}" kcal/ngày"</dd></div>
          <div><dt>"Tổng tiêu hao "<span>"("{activity}")"</span></dt><dd>{number(r.tdee)}" kcal/ngày"</dd></div></dl>})}
        <p class="estimate-note">"Mục tiêu đã nhập tay vẫn giữ nguyên khi bạn đổi số đo."</p>
      </section>
    })}}
}
fn row(title: &'static str, value: String, accent: bool) -> impl IntoView {
    view! {<div class="preview-row" class:preview-row--accent=accent><span class="preview-label">{title}</span><span class="preview-value">{value}</span></div>}
}
pub(super) fn activity(e: Editor) -> impl IntoView {
    view! {{move||e.read(|f|f.estimate()).map(|r|view!{
      <h3 class="section-caption">"Ước tính hằng ngày"</h3><div class="preview-card">
       {(r.bmr>0.).then(||view!{
           {row("Năng lượng lúc nghỉ",format!("{} kcal/ngày",number(r.bmr)),false)}
           {row("Tổng năng lượng tiêu hao",format!("{} kcal",number(r.tdee)),false)}
       })}
       {if let Some(note)=r.energy_note{view!{<p class="preview-hint">{note}" Bạn vẫn có thể ghi bữa ăn."</p>}.into_any()}else{
         row("Mục tiêu năng lượng đề xuất",format!("{} kcal/ngày",number(r.target_calories)),true).into_any()}}
       {row("Mục tiêu đạm tham khảo",if r.target_protein!=0.{format!("{} g/ngày",number(r.target_protein))}else{"Chưa có đề xuất".into()},false)}
       <p class="preview-hint">"Khi bạn đổi thông số, ứng dụng giữ mục tiêu bạn đã nhập tay."</p>
      </div>
    })}}
}
