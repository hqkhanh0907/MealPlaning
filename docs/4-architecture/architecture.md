# Software Architecture Document (SAD) — HealthMate AI

**Version:** 1.1 (gram-only revision)  
**Date:** 2026-04-30  
**Status:** Active

> **Revision 1.1 (2026-04-30) — Gram-only absolute.** Folder structure (§4) đã loại `unit-resolver.ts`, `unit.repository.ts`, `ingredient-unit.repository.ts`. Code example IngredientRepository (§ Data Access Pattern) cập nhật cột bảng `ingredient` theo schema mới — chỉ còn `calories_per_100g`, `protein_g_per_100g`, `carbs_g_per_100g`, `fat_g_per_100g`, `fiber_g_per_100g`. Bỏ tất cả tham chiếu `nutrition_basis_unit`, `default_entry_unit`, `grams_per_unit`, `ml_per_unit`.

---

## 1. Tổng quan kiến trúc

### Tech Stack

| Layer | Công nghệ | Version | Ghi chú |
|-------|-----------|---------|---------|
| UI Framework | Angular | 21 | Standalone components, Signals, Signal Forms, new control flow |
| UI Components | Ionic | 8 | Mobile-native UI components |
| Language | TypeScript | 5.9, strict mode | No `any` allowed |
| Native Wrapper | Capacitor | 8.3 | Android only |
| Database | SQLite | sql.js + @capacitor-community/sqlite | Dual implementation |
| State Management | Angular Signals | built-in | signal(), computed(), effect() |
| AI | Groq, Gemini | Theo cấu hình | Văn bản và ảnh có quy tắc chọn nhà cung cấp riêng tại mục 6. |
| Testing | Karma + Jasmine | — | Angular default test runner |
| Styling | Ionic theme + SCSS | — | CSS custom properties + SCSS |
| Build | Angular CLI | esbuild | Official Angular builder |
| CI/CD | GitHub Actions | — | Auto build APK |
| Platform | Android only | — | Play Store |

### Runtime Prerequisites

| Tool | Version | Ghi chú |
|------|---------|---------|
| Node.js | **22 LTS** | LTS mới nhất (support đến Apr 2027) |
| Java (JDK) | **21 LTS** | Cần cho Android build. AGP 8.13 + Gradle 8.14 support Java 17-24. |
| Android SDK | API 36 | compileSdk 36, minSdk 24 (Android 7.0+) |
| npm | 10+ | Đi kèm Node 22 |

### Kiến trúc tổng thể

```
┌─────────────────────────────────────────┐
│              Angular 21 App              │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │Dashboard│ │Calendar │ │Management│  │
│  └────┬────┘ └────┬────┘ └────┬─────┘  │
│       │           │           │         │
│  ┌────┴────┐ ┌────┴────┐ ┌───┴──────┐  │
│  │Fitness  │ │Settings │ │ AI Module│  │
│  └────┬────┘ └────┬────┘ └────┬─────┘  │
│       │           │           │         │
│  ─────┴───────────┴───────────┴─────── │
│  │         Signal Stores (core/)     │  │
│  ─────────────────┬──────────────────  │
│                   │                     │
│  ┌────────────────┴────────────────┐   │
│  │        Repository Layer          │   │
│  │  IngredientRepo · DishRepo · .. │   │
│  └────────────────┬────────────────┘   │
│                   │                     │
│  ┌────────────────┴────────────────┐   │
│  │    DatabaseService (Abstract)    │   │
│  ├─────────────┬───────────────────┤   │
│  │ WebDatabase │ NativeDatabase    │   │
│  │ (sql.js)    │ (Capacitor SQLite)│   │
│  └─────────────┴───────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │       Capacitor Plugins          │   │
│  │ Camera·Notifications·Network·.. │   │
│  └─────────────────────────────────┘   │
│                                         │
└────────────────────┬────────────────────┘
                     │
              ┌──────┴──────┐
              │   Android    │
              │   WebView    │
              └─────────────┘
```

---

## 2. Project Structure

> Coding conventions chi tiết (naming style 2016 vs 2025, file/folder rules, AI agent guidelines): xem `./coding-conventions.md`.
> Audit baseline (snapshot 2026-04-28): xoá khỏi repo trong cleanup 2026-04-29 sau khi Style 2025 migration (Phase C) đã ship. Convention canonical hiện tại: `./coding-conventions.md`.

### 2.1 Cấu trúc tại ngày 2026-04-28

Đây là cấu trúc THỰC TẾ trong `src/` tại thời điểm 2026-04-28. **Không** thêm/bớt file ảo.

> **Phase B refactor — DONE (2026-04-28):** toàn bộ component đã tuân thủ PC-1, dùng `templateUrl` + `styleUrl` external. Refactor chia 3 wave (Wave 1: 9 component nhỏ, Wave 2: 4 component trung bình, Wave 3: 4 component lớn — `dish-edit-modal` 652 dòng, `ingredient-edit-modal` 749 dòng, `onboarding.page` 869 dòng, `management.page` 1163 dòng). Lint + 145/145 test + ng build + APK build + emulator smoke đều pass. Helper script `scripts/extract-component-template.mjs` được giữ lại để dùng cho component mới nếu cần.

```
src/
├── main.ts
├── polyfills.ts
├── test.ts
├── zone-flags.ts
├── global.scss
├── index.html
├── types/
│   └── sql.js.d.ts
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
├── theme/
│   └── variables.scss
├── theme/form-field.scss              # Floating-label input pattern (xem design-system §8.6)
└── app/
    ├── app.component.ts               # Root: IonApp + IonRouterOutlet
    ├── app.config.ts                  # bootstrapApplication providers
    ├── app.routes.ts                  # Top-level routes (onboarding, tabs, settings)
    │
    ├── core/
    │   ├── services/
    │   │   ├── database/
    │   │   │   ├── database.service.ts            # Abstract interface
    │   │   │   ├── web-database.service.ts        # sql.js WASM (web + tests)
    │   │   │   ├── database.provider.ts           # Factory
    │   │   │   ├── schema.ts                      # Schema constants
    │   │   │   ├── schema-compatibility.ts
    │   │   │   ├── migrations.ts                  # Versioned migrations (TypeScript inline, KHÔNG phải .sql riêng)
    │   │   │   ├── migration-runner.ts
    │   │   │   └── legacy-sqljs-migrator.ts       # Migrate dữ liệu từ legacy DB
    │   │   └── (các service khác)
    │   ├── repositories/                          # 3 file .repository.ts (gram-only revision)
    │   │   ├── ingredient.repository.ts
    │   │   ├── dish.repository.ts
    │   │   └── dish-ingredient.repository.ts
    │   ├── stores/                                # 3 file .store.ts (ingredient, dish, profile)
    │   ├── models/
    │   │   ├── management.model.ts                # Gộp ingredient/dish/dish-ingredient (no unit)
    │   │   ├── management.types.ts
    │   │   ├── management.constants.ts
    │   │   └── user-profile.model.ts
    │   └── guards/
    │       └── onboarding.guard.ts
    │
    ├── shared/
    │   ├── components/                            # Component dùng cho ≥ 2 features
    │   │   ├── ingredient-edit-modal/             # đã tách external (PC-1, Phase B Wave 3)
    │   │   ├── dish-edit-modal/                   # đã tách external (PC-1, Phase B Wave 3)
    │   │   └── (các component shared khác)
    │   ├── forms/                                 # Signal Forms infrastructure
    │   │   ├── form-field/
    │   │   ├── schemas/
    │   │   │   └── common.ts
    │   │   ├── mappers/                           # PLACEHOLDER — chỉ có README.md
    │   │   ├── types.ts
    │   │   └── index.ts
    │   ├── pipes/                                 # PLACEHOLDER — rỗng
    │   └── directives/                            # PLACEHOLDER — rỗng
    │
    ├── features/                                  # Lazy-loaded feature pages
    │   ├── dashboard/
    │   │   ├── dashboard.page.ts
    │   │   └── dashboard.routes.ts
    │   ├── calendar/
    │   │   ├── calendar.page.ts
    │   │   └── calendar.routes.ts
    │   ├── management/
    │   │   ├── management.page.ts                 # đã tách external (PC-1, Phase B Wave 3)
    │   │   ├── management.routes.ts
    │   │   └── (unit-resolver.ts đã xoá ở Phase A — re-export barrel không dùng)
    │   ├── fitness/
    │   │   ├── fitness.page.ts
    │   │   └── fitness.routes.ts
    │   ├── settings/
    │   │   ├── settings.page.ts
    │   │   └── settings.routes.ts
    │   └── onboarding/
    │       ├── onboarding.page.ts                 # đã tách external (PC-1, Phase B Wave 3)
    │       ├── onboarding.routes.ts
    │       ├── onboarding-validation.ts           # Pure util (không suffix)
    │       └── onboarding-calculation.ts          # Pure util (không suffix)
    │
    └── tabs/
        ├── tabs.page.ts                           # IonTabs wrapper (4 tabs)
        └── tabs.routes.ts
```

**Inventory thực tế (102 file `.ts`):**
- 33 spec, 10 component, 8 routes, 7 page, 5 repository, 4 service, 3 store, 3 schema, 5 types, 2 model, 1 guard, 1 provider, 1 constants, 19 không suffix (utility/bootstrap/env).

### 2.2 Target — Style 2025 (sau migration task)

Sẽ migrate trong task riêng. Mapping rule:

| Current (2016) | Target (2025) |
|----------------|---------------|
| `dashboard.page.ts` + `class DashboardPage` | `dashboard.ts` + `class Dashboard` |
| `ingredient.repository.ts` + `class IngredientRepository` | `ingredient-repository.ts` + `class IngredientRepository` (giữ class — Style Guide cho phép khi cùng tên với entity) |
| `web-database.service.ts` + `class WebDatabaseService` | `web-database.ts` + `class WebDatabase` |
| `ingredient.store.ts` + `class IngredientStore` | `ingredient-store.ts` (giữ suffix file để tránh đụng `ingredient.ts` model) |
| `onboarding.guard.ts` | `onboarding-guard.ts` |
| `app.routes.ts` | `app.routes.ts` (KHÔNG đổi) |
| `*.spec.ts` | `*.spec.ts` (KHÔNG đổi) |
| `management.model.ts` / `*.types.ts` / `*.constants.ts` | giữ — Style Guide không cấm |

Folder layout của target **giống current** — chỉ khác tên file/class.

### 2.3 Drift đã ghi nhận (sẽ xử lý ở task riêng)

1. **Doc cũ liệt kê services/repositories chưa tồn tại** (gemini, nutrition-ai, fitness-ai, insight-ai, platform, network, day-plan/meal-slot/exercise/training-plan/workout/weight-log/streak-log/ai-chat-log/app-config repos, day-plan/fitness/dashboard/ui stores). Đã xoá khỏi doc — sẽ tái-thêm khi feature thực sự được implement.
2. **Doc cũ nói có `features/<x>/components/`** với danh sách sub-component cụ thể. Thực tế các features hiện chỉ có `*.page.ts` + `*.routes.ts`; modal lớn được nâng lên `shared/components/`. Khi triển khai sub-component cho feature, đặt vào `features/<x>/components/<name>/`.
3. **Migrations**: doc cũ nói `migrations/V1_initial_schema.sql`. Thực tế là `migrations.ts` (TypeScript inline) cho phép logic phức tạp + type-safe. **Giữ implementation thực tế**.
4. **Dead barrel**: `features/management/unit-resolver.ts` — ✅ **đã xoá** (Phase A, 2026-04-28). Spec file moved sang `core/services/unit-resolver.spec.ts`.
5. **Empty placeholder folders**: `shared/pipes/`, `shared/directives/`, `core/services/ai/` — ✅ **đã xoá** (Phase A, 2026-04-28). Còn lại `shared/forms/mappers/` — giữ tạm; xoá nếu sau Q3 2026 vẫn không có content.
6. **17/17 component inline** → ✅ **DONE Phase B (2026-04-28)**. Toàn bộ đã tách `templateUrl` + `styleUrl` external theo PC-1. Wave 1 (9 component nhỏ), Wave 2 (4 component trung bình), Wave 3 (4 component lớn: `management.page` 1163, `onboarding.page` 869, `ingredient-edit-modal` 749, `dish-edit-modal` 652). Lint + 145/145 test + ng build + APK install + emulator smoke pass. Helper script: `scripts/extract-component-template.mjs`.

### 2.4 Compliance vs Angular Style Guide 2025

> Phân biệt:
> - **[Angular]** = rule chính thức từ angular.dev/style-guide.
> - **[Project]** = convention nội bộ HealthMate AI (PC-N), không phải Angular official.

| # | Rule | Source | Status | Ghi chú |
|---|------|--------|--------|---------|
| 1 | Code in `src/` | [Angular] | ✅ | |
| 2 | One concept per file | [Angular] | ✅ | |
| 3 | Group related files (ts/html/scss/spec cùng folder) | [Angular] | ✅ | |
| 4 | kebab-case file names | [Angular] | ✅ | |
| 5 | Same base name across ts/html/scss/spec | [Angular] | ✅ | (theo cặp đang tồn tại) |
| 6 | Style 2025 file/class names (no `.component.ts`/`Component` suffix) | [Angular] | ⏳ | Migrate trong task riêng |
| 7 | `.spec.ts` cùng folder | [Angular] | ✅ | |
| 8 | Selector có prefix riêng cho app | [Angular] | ✅ | 17/17 dùng `app-` |
| 9 | Tách external template/style khi "more than a few lines" | [Angular] | ⚠️ | Angular không nêu ngưỡng — xem PC-1 |
| 10 | Multi-style file → hậu tố mô tả | [Angular] | n/a | hiện không có case multi-style |
| PC-1 | Mọi component MUST tách `templateUrl` + `styleUrl` (binary, không ngoại lệ) | [Project] | ✅ | **DONE Phase B (2026-04-28)** — 17/17 component external |
| PC-2 | Naming pattern khi tách external (Style 2016 vs 2025) | [Project] | ✅ | Xem `coding-conventions.md` §2.2 |

---

## 3. Navigation — 4 Tabs + Settings Icon

### Tab Layout

```
┌──────────────────────────────┐
│ HealthMate AI           [⚙️] │  ← Settings icon (push page)
├──────────────────────────────┤
│                              │
│     (Tab content)            │
│                              │
├──────────────────────────────┤
│ [🏠]   [📅]   [🍽️]   [🏋️]  │  ← 4 tabs
│ Home  Calendar Mgmt  Fitness │
└──────────────────────────────┘
```

### Routes (lazy loaded)

```typescript
// src/app/app.routes.ts
export const routes: Routes = [
  {
    path: 'onboarding',
    loadComponent: () => import('./features/onboarding/onboarding.page'),
  },
  {
    path: '',
    component: TabsPage,
    canActivate: [onboardingGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes')
      },
      {
        path: 'calendar',
        loadChildren: () => import('./features/calendar/calendar.routes')
      },
      {
        path: 'management',
        loadChildren: () => import('./features/management/management.routes')
      },
      {
        path: 'fitness',
        loadChildren: () => import('./features/fitness/fitness.routes')
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'settings',
    loadChildren: () => import('./features/settings/settings.routes')
  }
];
```

### Tabs Component

```typescript
@Component({
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="dashboard">
          <ion-icon name="home-outline" />
          <ion-label>Tổng quan</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="calendar">
          <ion-icon name="calendar-outline" />
          <ion-label>Lịch ăn</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="management">
          <ion-icon name="restaurant-outline" />
          <ion-label>Quản lý</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="fitness">
          <ion-icon name="barbell-outline" />
          <ion-label>Tập luyện</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `
})
export class TabsPage {}
```

---

## 4. Database Layer — Repository Pattern

### Architecture

```
Feature/Store  →  Repository  →  DatabaseService  →  SQLite
                                   ├── WebDatabaseService (sql.js)
                                   └── NativeDatabaseService (Capacitor SQLite)
```

### DatabaseService (Abstract — 4 methods)

```typescript
export abstract class DatabaseService {
  abstract initialize(): Promise<void>;
  abstract execute(sql: string, params?: unknown[]): Promise<void>;
  abstract query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  abstract getOne<T>(sql: string, params?: unknown[]): Promise<T | null>;
}
```

### Factory Provider

```typescript
export function provideDatabaseService(): Provider {
  return {
    provide: DatabaseService,
    useFactory: () => {
      if (Capacitor.isNativePlatform()) {
        return new NativeDatabaseService();
      }
      return new WebDatabaseService();
    }
  };
}
```

### Repository Example

```typescript
@Injectable({ providedIn: 'root' })
export class IngredientRepository {
  private readonly db = inject(DatabaseService);

  async getAll(): Promise<Ingredient[]> {
    return this.db.query<Ingredient>('SELECT * FROM ingredient ORDER BY name');
  }

  async getById(id: string): Promise<Ingredient | null> {
    return this.db.getOne<Ingredient>('SELECT * FROM ingredient WHERE id = ?', [id]);
  }

  async insert(data: Omit<Ingredient, 'id' | 'created_at'>): Promise<Ingredient> {
    const id = crypto.randomUUID();
    await this.db.execute(
      `INSERT INTO ingredient (
         id, name, category, emoji,
         calories_per_100g, protein_g_per_100g, carbs_g_per_100g, fat_g_per_100g, fiber_g_per_100g,
         source
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.category,
        data.emoji ?? null,
        data.calories_per_100g,
        data.protein_g_per_100g,
        data.carbs_g_per_100g,
        data.fat_g_per_100g,
        data.fiber_g_per_100g ?? null,
        data.source,
      ]
    );
    return this.getById(id) as Promise<Ingredient>;
  }

  async update(id: string, data: Partial<Ingredient>): Promise<void> {
    // Dynamic update query based on provided fields
  }

  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM ingredient WHERE id = ?', [id]);
  }

  async search(query: string): Promise<Ingredient[]> {
    return this.db.query<Ingredient>(
      'SELECT * FROM ingredient WHERE name LIKE ? ORDER BY name',
      [`%${query}%`]
    );
  }
}
```

---

## 5. State Management — Signal Stores

### Store Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class IngredientStore {
  private readonly repo = inject(IngredientRepository);

  // State signals
  readonly ingredients = signal<Ingredient[]>([]);
  readonly loading = signal(false);
  readonly searchQuery = signal('');
  readonly error = signal<string | null>(null);

  // Computed
  readonly filtered = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.ingredients();
    return this.ingredients().filter(i =>
      i.name.toLowerCase().includes(query)
    );
  });

  readonly count = computed(() => this.ingredients().length);

  // Actions
  async loadAll(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.repo.getAll();
      this.ingredients.set(data);
    } catch (e) {
      this.error.set('Không thể tải dữ liệu');
    } finally {
      this.loading.set(false);
    }
  }

  async add(data: Omit<Ingredient, 'id' | 'created_at'>): Promise<void> {
    const created = await this.repo.insert(data);
    this.ingredients.update(list => [...list, created]);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
    this.ingredients.update(list => list.filter(i => i.id !== id));
  }
}
```

### Stores Mapping

| Store | Scope | Data | Used by |
|-------|-------|------|---------|
| `IngredientStore` | root | Ingredients list + search | Management, Calendar (picker) |
| `DishStore` | root | Dishes list + search | Management, Calendar (picker) |
| `DayPlanStore` | root | Day plans + meal slots | Calendar, Dashboard |
| `FitnessStore` | root | Training plans + workouts + progress | Fitness, Dashboard |
| `ProfileStore` | root | User profile + targets + settings | Settings, AI services, Dashboard |
| `DashboardStore` | root | Aggregated dashboard data | Dashboard |
| `UiStore` | root | Loading, offline status, theme | All features |

---

## 6. Ranh giới nghiệp vụ và dịch vụ AI

[Bản đồ mã hiện hành](domain-map.md) nối từng nghiệp vụ với điểm nhập, nơi ghi dữ liệu, màn hình đọc và kiểm thử. Mục 2.1 ghi lại cấu trúc tháng 4.

### Nơi sở hữu quy tắc

| Nghiệp vụ | Quy tắc chung | Nơi dùng |
|---|---|---|
| Hồ sơ cá nhân | Hồ sơ giữ thông số cơ thể, vận động, trình độ tập, mục tiêu và tùy chọn nhắc lịch. `recalc-targets.ts` giữ mục tiêu thủ công khi tính lại. | Thiết lập ban đầu, Cài đặt, Tổng quan, gợi ý AI và nhắc lịch |
| Danh mục và dinh dưỡng | `nutrition.ts` quy đổi khối lượng và nhân khẩu phần. `DishListItem` mô tả dinh dưỡng của một khẩu phần. | Sửa món, chọn món, xem trước bữa từ ảnh, gợi ý AI |
| Lịch ăn | `dish-per-serving.sql.ts` đọc công thức hiện tại cho món dự kiến và số liệu đã lưu cho món đã ăn. | Lịch ăn và Tổng quan |
| Giáo án | `fitness-prescription.ts` quy định giới hạn của bài tập dự kiến. | Sửa giáo án, tiếp nhận giáo án AI, lưu giáo án |
| Buổi tập | `fitness-workout-set.ts` kiểm tra hiệp thực tế. Kho buổi tập tính khối lượng từ tạ và số lần đã ghi. | Màn tập, lịch sử, thống kê tuần |
| Lịch địa phương | `local-date.ts` tính ngày và tuần theo múi giờ thiết bị. Thời điểm bắt đầu và kết thúc buổi tập vẫn có múi giờ. | Chọn ngày, sao chép tuần, lịch ăn và lịch sử tập |
| Nhắc lịch | `notification-preferences.ts` chuyển lựa chọn trong hồ sơ thành các lịch có thể bật theo quyền hệ điều hành. | Khởi động và Cài đặt |
| Dữ liệu mẫu | `seed-records.ts` định nghĩa trường mà bộ tạo dữ liệu xuất và bộ nạp SQLite đọc. | Tạo dữ liệu mẫu, nạp nguyên liệu và món |

Mỗi nghiệp vụ giữ các quyết định riêng. Bữa đã ăn giữ số liệu tại lúc xác nhận. Gợi ý từ ảnh cho phép sửa số gram trước khi lưu.
Giáo án mô tả bài dự kiến. Nhật ký buổi tập giữ từng hiệp đã ghi hoặc bỏ qua. Hiệp tính bằng giây có đơn vị riêng.
SQLite web và Android cùng dùng giao diện `Database`. Mỗi nền tảng giữ cách mở kết nối, giao dịch và lưu dữ liệu phù hợp.

### Chọn nhà cung cấp AI

`AiGeneration` chọn nhà cung cấp và kiểm tra cấu trúc kết quả. `AiAvailability` kết hợp cùng cấu hình với trạng thái mạng để màn hình báo lý do khi một thao tác chưa dùng được.

| Yêu cầu | Quy tắc chọn | Nghiệp vụ |
|---|---|---|
| Văn bản | Ưu tiên Groq. Dùng Gemini khi chỉ có khóa Gemini. | Tra nguyên liệu, điền món, gợi ý thực đơn, lập lịch ăn, tạo giáo án, nhận xét ngày |
| Ảnh | Cần khóa Groq. | Nhận diện món và tạo bản nháp khẩu phần |

Một lần bấm gửi tới một nhà cung cấp. Nếu nhà cung cấp từ chối yêu cầu, màn hình báo lỗi. Người dùng quyết định khi nào thử lại.
Mỗi nghiệp vụ kiểm tra kết quả theo mục đích. Gợi ý lịch ăn phải tham chiếu món đã gửi và đáp ứng giới hạn năng lượng.
Giáo án phải tham chiếu bài tập có trong danh sách. Với ảnh, người dùng xem và chỉnh bản nháp trước khi lưu vào nhật ký.

---

## 7. Cross-cutting Concerns

### 7.1 Offline Handling

```
Online:  App bình thường, AI features hoạt động
Offline: Banner "Không có mạng" + AI buttons disabled (xám) + Toast khi tap AI
```

```typescript
@Injectable({ providedIn: 'root' })
export class NetworkService {
  readonly isOnline = signal(true);

  constructor() {
    Network.addListener('networkStatusChange', (status) => {
      this.isOnline.set(status.connected);
    });
  }
}
```

### 7.2 Error Handling

| Loại lỗi | Hiển thị | Ví dụ |
|----------|---------|-------|
| **Nhẹ** | `ion-toast` (3 giây, tự ẩn) | AI fail, save thất bại, network timeout |
| **Nặng** | `ion-alert` (dialog, user phải dismiss) | DB corrupt, critical error |

### 7.3 Loading States

| Scenario | Component |
|----------|-----------|
| Lần load đầu (lists) | `ion-skeleton-text` |
| Actions (save, delete) | `ion-spinner` trong button |
| AI calls | `ion-spinner` + text "AI đang xử lý..." |

---

## 8. Capacitor Plugins

| Plugin | Version | Mục đích |
|--------|---------|---------|
| `@capacitor-community/sqlite` | latest | SQLite database |
| `@capacitor/camera` | latest | Chụp ảnh cho AI Image (F-05) |
| `@capacitor/local-notifications` | latest | 4 loại push notification |
| `@capacitor/network` | latest | Check online/offline |
| `@capacitor/filesystem` | latest | Installed for future use — backup/export hoãn V2, chưa wire trong V1 |
| `@capacitor/status-bar` | latest | Đổi màu theo theme |
| `@capacitor/splash-screen` | latest | Logo khi mở app |

---

## 9. Angular 21 Patterns

Tất cả code tuân thủ Angular 21 best practices:

| Pattern | Mô tả |
|---------|-------|
| **Standalone components** | Không dùng NgModule — tất cả components đều standalone (default từ v19) |
| **New control flow** | `@if`, `@for`, `@switch`, `@defer` thay vì `*ngIf`, `*ngFor` |
| **inject()** | Function-based injection thay vì constructor injection |
| **Signals** | `signal()`, `computed()`, `effect()` cho state management |
| **Signal Forms** | `form()` + `schema()` + `[formField]` từ `@angular/forms/signals` (stable v21) — pattern duy nhất cho mọi form mới. Migration B1→B5 hoàn tất 2026-04-27. Xem `docs/5-development/signal-forms-migration-plan.md`. |
| **Reactive Forms / FormsModule (legacy)** | KHÔNG dùng cho form mới. `@angular/forms/signals/compat` chỉ giữ làm escape hatch nếu thật sự cần. |
| **Route-level lazy loading** | `loadChildren` / `loadComponent` |
| **`@defer` blocks** | Lazy load heavy components (charts, AI preview) |

---

## 10. Build & Deploy

### Build Pipeline (GitHub Actions)

```yaml
# .github/workflows/build-apk.yml
name: Build APK
on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'

      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npx ionic build --prod
      - run: npx ionic capacitor sync android

      - name: Build APK
        run: cd android && ./gradlew assembleRelease

      - uses: actions/upload-artifact@v4
        with:
          name: app-release.apk
          path: android/app/build/outputs/apk/release/
```

### APK Signing

- **Keystore:** Local keystore file (`.jks`)
- **Lưu trữ:** Trên máy dev + backup an toàn
- **CI:** Keystore + password lưu trong GitHub Secrets

### Release Flow

```
1. Dev hoàn thành feature
2. Tag version: git tag v1.0.0
3. Push tag → GitHub Actions tự build APK
4. Download APK artifact
5. Test trên device
6. Upload lên Play Store Console (thủ công)
```

### NPM Scripts

```json
{
  "scripts": {
    "dev": "ionic serve",
    "build": "ionic build --prod",
    "lint": "ng lint",
    "lint:fix": "ng lint --fix",
    "test": "ng test",
    "test:coverage": "ng test --code-coverage --watch=false",
    "android:sync": "ionic build --prod && npx cap sync android",
    "android:run": "npx cap run android --livereload --external"
  }
}
```

> **Note:** Angular 21 default test runner là Karma + Jasmine (không phải Jest). Command `ng test` sử dụng Karma theo `angular.json` config.

---

## 11. Capacitor Config

```typescript
// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.healthmate.ai',
  appName: 'HealthMate AI',
  webDir: 'www',
  android: {
    buildOptions: {
      signingType: 'apksigner'
    }
  },
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: false
    },
    SplashScreen: {
      launchAutoHide: false,
      androidSplashResourceName: 'splash'
    },
    LocalNotifications: {
      smallIcon: 'ic_notification',
      iconColor: '#4CAF50'
    }
  }
};

export default config;
```

---

## 12. Feature Lazy Loading Map

| Route | Lazy Loaded | Components | Stores used |
|-------|:-----------:|-----------|-------------|
| `/dashboard` | ✅ | 5 cards + quick actions | DashboardStore, DayPlanStore, FitnessStore |
| `/calendar` | ✅ | Week view, Day view, meal slots, AI plan | DayPlanStore, DishStore, NutritionAiService |
| `/management` | ✅ | Ingredient CRUD, Dish CRUD, AI autofill | IngredientStore, DishStore, NutritionAiService |
| `/fitness` | ✅ | Training plans, workout logger, progress charts | FitnessStore, FitnessAiService |
| `/settings` | ✅ | Profile, goals, notifications, theme, about | ProfileStore |
| `/onboarding` | ✅ | Goal step, profile step | ProfileStore |

---

## 13. Cấu hình khi build

Đặt khóa thử cá nhân trong `.env`. Lệnh `npm run build` chuẩn bị cấu hình Groq và cấu hình Gemini cho bản production.
Bản development dùng cấu hình Gemini trong `src/environments/environment.ts`. Chọn nhà cung cấp theo mục 6.

Bản development mở `healthmate_dev.db`. Bản production mở `healthmate.db`.
Khi cập nhật giả lập chứa hồ sơ cá nhân, dùng cùng cấu hình build với bản đang cài để mở lại đúng hồ sơ.
