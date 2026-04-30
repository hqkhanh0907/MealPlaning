/**
 * DishAutofillSheet — bottom sheet preview cho F-02 AI Dish Autofill.
 *
 * Source-of-truth: `docs/5-development/phase-1.5b-ai-foundation.md` §4.2.
 * Implementation plan: `.hermes/plans/f02-implementation.md` Layer 5.
 *
 * UX direction: PA1 — all-in-one bottom sheet (single scroll, không wizard).
 *
 * Responsibilities:
 *   1. Hiển thị tất cả `DishAutofillRow` của một result trong một danh sách
 *      thẻ duy nhất, phân biệt 3 kind bằng badge mầu:
 *        - existing      → "Đã có"        (green)
 *        - new           → "Mới"          (blue)
 *        - fuzzyConfirm  → "Cần xác nhận" (amber)
 *   2. Cho user resolve mỗi row `fuzzyConfirm` bằng 2 nút:
 *        - "Dùng <suggestedMatchName>"  → decision = 'accept-suggestion'
 *        - "Tạo mới"                    → decision = 'reject-create-new'
 *   3. Default behavior (Option B): row `fuzzyConfirm` chưa được resolve
 *      coi như user chọn 'reject-create-new' khi bấm Áp dụng. Nút Áp dụng
 *      LUÔN enabled. Caption amber: "Nếu bỏ qua, sẽ tạo mới.".
 *   4. Emit `(applied)` với `Map<rowIndex, FuzzyConfirmDecision>` đã chứa
 *      sẵn default cho các row chưa resolve — caller (dish-edit page) chỉ
 *      cần gọi `DishAutofillApplier.apply(result, { fuzzyDecisions })`.
 *
 * Sheet này KHÔNG ghi DB và KHÔNG tự gọi applier — giữ pure để dễ test.
 */

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';

import type { DishAutofillResult, DishAutofillRow } from '../../../core/services/ai/nutrition-ai';
import type { FuzzyConfirmDecision } from '../../../core/services/ai/dish-autofill-applier';

export interface DishAutofillAppliedPayload {
  /** Chỉ chứa quyết định cho các row có kind === 'fuzzyConfirm'. */
  readonly fuzzyDecisions: ReadonlyMap<number, FuzzyConfirmDecision>;
  /** Truyền lại result gốc để caller convenience. */
  readonly result: DishAutofillResult;
}

@Component({
  selector: 'app-dish-autofill-sheet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon],
  templateUrl: './dish-autofill-sheet.html',
  styleUrl: './dish-autofill-sheet.scss',
})
export class DishAutofillSheet {
  /** Two-way: caller set true để mở. */
  @Input() set isOpen(value: boolean) {
    this._isOpen.set(value);
  }
  get isOpen(): boolean {
    return this._isOpen();
  }
  private readonly _isOpen = signal(false);

  /** AI dish autofill result — required khi isOpen=true. */
  @Input() set result(value: DishAutofillResult | null) {
    this._result.set(value);
    // Reset decisions mỗi lần result mới (sheet được reuse cho nhiều dish).
    this._decisions.set(new Map());
  }
  private readonly _result = signal<DishAutofillResult | null>(null);

  /** Emit khi user bấm "Áp dụng". */
  @Output() readonly applied = new EventEmitter<DishAutofillAppliedPayload>();

  /** Emit khi sheet bị dismiss (X / kéo xuống / Hủy). */
  @Output() readonly dismissed = new EventEmitter<void>();

  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------

  /** Map<rowIndex, decision> — chỉ chứa các row fuzzyConfirm đã resolve. */
  private readonly _decisions = signal<ReadonlyMap<number, FuzzyConfirmDecision>>(new Map());

  protected readonly resultView = this._result.asReadonly();

  /** Render rows kèm index gốc — template không gọi trackBy phức tạp. */
  protected readonly rows = computed(() => {
    const r = this._result();
    return r ? r.rows.map((row, index) => ({ row, index })) : [];
  });

  /**
   * Số lượng từng kind — show ở header summary.
   *  - existing / new / fuzzyConfirm
   */
  protected readonly counts = computed(() => {
    const rows = this._result()?.rows ?? [];
    let existing = 0;
    let created = 0;
    let needsConfirm = 0;
    for (const r of rows) {
      if (r.kind === 'existing') existing++;
      else if (r.kind === 'new') created++;
      else needsConfirm++;
    }
    return { existing, created, needsConfirm };
  });

  /**
   * Số lượng row fuzzyConfirm CHƯA resolve. UI dùng để show caption amber
   * "Nếu bỏ qua, sẽ tạo mới." trên footer.
   *
   * Option B: nút Áp dụng KHÔNG bị disable bởi giá trị này.
   */
  protected readonly unresolvedCount = computed(() => {
    const rows = this._result()?.rows ?? [];
    const decisions = this._decisions();
    let unresolved = 0;
    rows.forEach((r, i) => {
      if (r.kind === 'fuzzyConfirm' && !decisions.has(i)) unresolved++;
    });
    return unresolved;
  });

  protected readonly decisionsView = this._decisions.asReadonly();

  constructor() {
    addIcons({ closeOutline });
  }

  // --------------------------------------------------------------------------
  // Template helpers
  // --------------------------------------------------------------------------

  /** Trả về CSS modifier theo kind cho badge. */
  protected badgeClass(row: DishAutofillRow): string {
    return `dasf-badge dasf-badge--${row.kind}`;
  }

  protected badgeLabel(row: DishAutofillRow): string {
    if (row.kind === 'existing') return 'Đã có';
    if (row.kind === 'new') return 'Mới';
    return 'Cần xác nhận';
  }

  /** Decision đã chọn cho 1 row fuzzyConfirm (hoặc undefined nếu chưa). */
  protected decisionFor(index: number): FuzzyConfirmDecision | undefined {
    return this._decisions().get(index);
  }

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

  /** User chọn dùng suggestion từ DB. */
  protected acceptSuggestion(index: number): void {
    this._decisions.update((m) => {
      const next = new Map(m);
      next.set(index, 'accept-suggestion');
      return next;
    });
  }

  /** User chọn tạo ingredient mới (reject suggestion). */
  protected rejectAndCreate(index: number): void {
    this._decisions.update((m) => {
      const next = new Map(m);
      next.set(index, 'reject-create-new');
      return next;
    });
  }

  /**
   * Gather final decisions theo Option B:
   *   - Row đã resolve → giữ nguyên user choice.
   *   - Row fuzzyConfirm CHƯA resolve → fill default 'reject-create-new'.
   *   - Row existing/new → không có entry trong map (applier không cần).
   */
  protected onApply(): void {
    const r = this._result();
    if (!r) return;

    const final = new Map<number, FuzzyConfirmDecision>(this._decisions());
    r.rows.forEach((row, i) => {
      if (row.kind === 'fuzzyConfirm' && !final.has(i)) {
        final.set(i, 'reject-create-new');
      }
    });

    this.applied.emit({ fuzzyDecisions: final, result: r });
    this._isOpen.set(false);
  }

  protected onCancel(): void {
    this._isOpen.set(false);
    this.dismissed.emit();
  }

  protected onIonDismiss(): void {
    this._isOpen.set(false);
    this.dismissed.emit();
  }
}
