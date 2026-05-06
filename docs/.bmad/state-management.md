# State Management — HealthMate AI

**Date:** 2026-05-06
**Pattern:** Angular Signals (built-in, không dùng NgRx/Redux/MobX).

## 1. Why Signals (not NgRx)

- Project size hiện tại: 12 components/pages, 4 stores, 21k LOC → NgRx overkill.
- Angular 21 Signals stable, có `signal/computed/effect` đủ cho mọi nhu cầu.
- Đơn giản hóa testing: mock store = set signal value trực tiếp.
- Reactive UI: `@if`, `@for` đọc thẳng signal, không cần `async pipe`.

## 2. Stores Inventory (4 stores)

Tất cả ở `src/app/core/stores/`. Mỗi store có spec đi cặp.

| Store | File | Trách nhiệm | Reads from |
|---|---|---|---|
| **DishStore** | `dish.store.ts` | Cache dish list, CRUD reactions | `DishRepository` |
| **IngredientStore** | `ingredient.store.ts` | Cache ingredient list, CRUD reactions | `IngredientRepository` |
| **ProfileStore** | `profile.store.ts` | User profile + computed BMR/TDEE/targets | `UserProfileRepository` |
| **NetworkStore** | `network.store.ts` | Online/offline state cho AI banner | Capacitor Network plugin |

## 3. Canonical Store Pattern

```ts
@Injectable({ providedIn: 'root' })
export class DishStore {
  private readonly repo = inject(DishRepository);

  // ── Private writable signals (state) ───────────────────────
  private readonly _dishes = signal<Dish[]>([]);
  private readonly _loading = signal(false);

  // ── Public readonly signals (selectors) ───────────────────
  readonly dishes = this._dishes.asReadonly();
  readonly loading = this._loading.asReadonly();

  // ── Computed views ─────────────────────────────────────────
  readonly dishCount = computed(() => this._dishes().length);
  readonly favoriteDishes = computed(() =>
    this._dishes().filter(d => d.is_favorite)
  );

  // ── Actions ────────────────────────────────────────────────
  async loadAll(): Promise<void> {
    this._loading.set(true);
    try {
      this._dishes.set(await this.repo.findAll());
    } finally {
      this._loading.set(false);
    }
  }

  async create(input: NewDishInput): Promise<Dish> {
    const dish = await this.repo.create(input);
    this._dishes.update(list => [...list, dish]);
    return dish;
  }

  async update(id: string, patch: Partial<Dish>): Promise<void> {
    await this.repo.update(id, patch);
    this._dishes.update(list =>
      list.map(d => (d.id === id ? { ...d, ...patch } : d))
    );
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
    this._dishes.update(list => list.filter(d => d.id !== id));
  }
}
```

### Quy ước nhất quán

- `_xxx` private writable, `xxx` public readonly (dùng `asReadonly()`).
- Computed cho derived state — không lưu state trùng lặp.
- Actions là async methods, optimistic update sau khi repo trả về OK.
- KHÔNG mutate signal value — luôn `.set()` / `.update(prev => ...)` với new reference.

## 4. Effects (rare)

`effect()` chỉ dùng cho:
- Sync side-effect ra ngoài Angular (vd: localStorage write, Capacitor Network listener).
- KHÔNG dùng để update signal khác (gây cycle).

Ví dụ ở `network.store.ts`:
```ts
constructor() {
  Network.addListener('networkStatusChange', s => this._online.set(s.connected));
  effect(() => {
    // Sync online state ra somewhere external nếu cần
  });
}
```

## 5. Component consumption pattern

```ts
@Component({
  templateUrl: './dish-list.page.html',
  styleUrl: './dish-list.page.scss',
})
export class DishListPage {
  readonly store = inject(DishStore);

  async ngOnInit() {
    await this.store.loadAll();
  }
}
```

```html
<!-- dish-list.page.html -->
@if (store.loading()) {
  <ion-spinner />
} @else {
  @for (dish of store.dishes(); track dish.id) {
    <app-dish-card [dish]="dish" />
  } @empty {
    <app-empty-state message="Chưa có món nào" />
  }
}
```

## 6. Anti-patterns (đã tránh)

- ❌ KHÔNG dùng `BehaviorSubject` cho state mới — Signals thay thế.
- ❌ KHÔNG share state qua input/output prop chains — inject store trực tiếp.
- ❌ KHÔNG `subscribe()` thủ công trong component — dùng signal hoặc `toSignal()`.
- ❌ KHÔNG mutate signal payload (vd `dishes()[0].name = 'x'`) — set new reference.

## 7. Form state (separate from store)

- Reactive Forms hiện tại — form state nằm trong component, KHÔNG lưu vào store.
- Save form → call store action.
- Migration plan sang Signal Forms: `docs/5-development/signal-forms-migration-plan.md`.

## 8. Testing

- **Mock pattern:** override store qua `TestBed` provider:
  ```ts
  TestBed.configureTestingModule({
    providers: [
      { provide: DishStore, useValue: {
        dishes: signal<Dish[]>([fakeDish]).asReadonly(),
        loading: signal(false).asReadonly(),
        loadAll: jasmine.createSpy('loadAll'),
      }},
    ],
  });
  ```
- **Coverage:** mỗi store có spec đi cặp (4 spec files).
