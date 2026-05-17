# F-018 — Button label uppercase ("GHI SET", "BẮT ĐẦU", "LỊCH SỬ", "HOÀN THÀNH BUỔI TẬP") trái với Apple style sentence-case

**Severity:** P3 (visual polish; aggregate cognitive load)
**Status:** OPEN
**Discovered:** Turn 12, runtime vision + dump

## Evidence

Mọi `<ion-button>` trong feature `fitness` đều render label uppercase trong runtime:
- "GHI SET" (logger primary)
- "BẮT ĐẦU" (rest timer)
- "LỊCH SỬ" (history CTA, vừa add Turn 12)
- "HOÀN THÀNH BUỔI TẬP" (footer Turn 12)
- "THÊM BÀI TẬP" (empty state)

Vision Turn 12 confirm: "tab labels sentence-case", "buttons UPPERCASE".

## Cause

Ionic default `<ion-button>` áp `text-transform: uppercase` thông qua `--text-transform` CSS variable. Không phải nội dung — text trong HTML là sentence-case ("Ghi set"). Capacitor 8 + Ionic 8 không tự đảo style này.

## Apple style nguyên tắc

iOS standard buttons (system, prominent, plain) đều **sentence-case hoặc title-case** ("Save", "Cancel", "Done", "Add Exercise"). Uppercase là Material Design (Android pre-Material-3) legacy. App đang vi phạm chính DESIGN.md / brand-guideline của chính mình (PRD nhấn mạnh "tinh thần Apple").

Cognitive load: uppercase chậm đọc 10-15% so với mixed-case (well-established psycholinguistics). Khi mỗi screen có 3-5 button uppercase, người dùng phải parse chậm hơn → tăng friction trên flow tap-heavy như set logging.

## Fix proposal

`src/theme/variables.scss` global override:
```scss
ion-button {
  --text-transform: none;
  letter-spacing: 0;
}
```
Hoặc more conservatively: chỉ override trong feature scope (`features/fitness/**.scss` + `shared/components/button.scss`). Global preferable — toàn app sẽ đồng nhất.

Verify: `npm run check:design-tokens` không reject (text-transform không thuộc whitelist guard).

## Test plan

- Visual diff trên 5 screen: dashboard, fitness hub, active session logger, history, settings. Confirm không button nào còn uppercase.
- a11y: contrast ratio không đổi (cùng color); chỉ text-transform changes.

## Status

OPEN — fix 3-dòng SCSS, ship cùng Pha 1 follow-up batch.
