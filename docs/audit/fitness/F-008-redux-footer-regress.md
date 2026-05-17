# F-008-redux — Bottom-anchored Hoàn thành footer KHÔNG còn trên hub sau merge; regression của F-008 turn 7-8

**Severity:** P1
**Status:** RESOLVED (Turn 12, code + runtime emulator verify)
**Discovered:** Turn 12 (runtime cross-check)
**Fixed:** Turn 12

## Evidence

`docs/audit/fitness/F-008-complete-action-demoted.md` ghi RESOLVED turn 7-8 với `<ion-footer>` bottom-anchored ở **`active-workout.page.html`**. Sau merge `8f72bb49` (origin/main vào nhánh audit), hub `fitness.page.html` lại trở thành surface render active session (xem F-014) mà KHÔNG có footer; "Hoàn thành" lùi về `<ion-button fill="clear" size="small">` trong header — chính lỗi mà F-008 đã sửa.

Runtime Turn 12 (pre-fix): tap "Bắt đầu buổi tự do" → log 1 set → dump uihit thấy:
- Header (y=577): "Hủy buổi tập" + "Hoàn thành (small clear)" — hierarchy inversion.
- Bottom: KHÔNG có footer.
→ Apple HIG 2 violations (hierarchy inversion + thumb-reach) tái phát.

## Cause

Merge picked `fitness.page.{ts,html,scss}` từ phía `origin/main` (kỳ vọng route tách `active-workout`) — phía đó footer nằm trong `active-workout.page` riêng. Nhưng hub vẫn render inline session (F-014). Hậu quả: footer **không** kế thừa sang hub. Đây là chi phí điển hình của tách-page-half-way: ship route mới nhưng quên wire entry và quên port lại UI primitive sang hub.

## Fix (Turn 12)

1. `fitness.page.ts`: thêm `IonFooter` vào component imports.
2. `fitness.page.html` (cuối file, sau `</ion-content>`):
   ```html
   @if (fitness.activeSession() && fitness.canCompleteWorkout()) {
     <ion-footer class="active-workout-footer">
       <ion-toolbar>
         <ion-button
           expand="block"
           fill="solid"
           size="default"
           (click)="fitness.completeWorkout()"
           aria-label="Hoàn thành buổi tập"
         >
           <ion-icon slot="start" name="checkmark-circle-outline" aria-hidden="true" />
           Hoàn thành buổi tập
         </ion-button>
       </ion-toolbar>
     </ion-footer>
   }
   ```
   Gate đôi: `activeSession && canCompleteWorkout` — pre-first-set không hiện gì (silent), post-first-set hiện đúng 1 CTA primary.
3. Header "Hoàn thành" demoted từ button có label sang icon-only (`slot="icon-only"`) + aria-label đổi thành "Hoàn thành (header)" để screen reader phân biệt với footer button.
4. SCSS append `.active-workout-footer` block (white surface, divider top, `--space-lg` padding, `--radius-md` button, `font-weight: 600`) — mirror với pattern đã có trong `active-workout.page.scss`.

## Runtime verify (Turn 12)

`ng build` GREEN. `cap sync` GREEN. `gradlew assembleDebug` GREEN. APK install. Cold launch → Tập luyện → resume active session đang có 1 set → dump:
```
540,2067 clk=1 | '' | 'Hoàn thành buổi tập'
```
Vision: footer "HOÀN THÀNH BUỔI TẬP" full-width filled green, anchored ngay trên tab bar (y=2244). Tap → `completeSession()` chạy → DB cập nhật `completed_at=2026-05-17T06:23:30`, `duration_minutes=2`, `total_volume=2080.0`. Hub refresh, active session signal cleared.

## Apple-spirit re-audit

- **Hierarchy:** destination action (filled, full-width, bottom) vs destructive (clear small in header) — đúng Apple HIG.
- **Reduce cognitive load:** chỉ render khi có ≥1 set; pre-first-set state silent.
- **Thumb reach:** bottom-anchored on 1080×2400 → tự nhiên.
- **Status clarity:** sự hiện diện của button = affordance, không có disabled state phải interpret.

## Test gap (P3 follow-up)

`fitness.page.spec` không cover footer visibility gate. Thêm spec sau Pha 1: footer KHÔNG render khi `activeSession()=null`; KHÔNG render khi `canCompleteWorkout()=false`; render khi cả 2 truthy.

## Status

RESOLVED — code + runtime emulator. Test spec deferred → tests-needed.md.
