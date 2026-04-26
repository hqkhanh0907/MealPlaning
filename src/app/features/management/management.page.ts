import { DOCUMENT, NgClass } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  addOutline,
  closeOutline,
  createOutline,
  ellipsisVertical,
  nutritionOutline,
  searchOutline,
  settingsOutline,
  sparklesOutline,
  trashOutline,
} from 'ionicons/icons';
import { INGREDIENT_CATEGORIES } from '../../core/models/management.constants';
import type { UnitModel } from '../../core/models/management.model';
import type { DishListItem } from '../../core/repositories/dish.repository';
import type { IngredientListItem } from '../../core/repositories/ingredient.repository';
import { UnitRepository } from '../../core/repositories/unit.repository';
import { DishStore } from '../../core/stores/dish.store';
import { IngredientStore } from '../../core/stores/ingredient.store';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  DishEditModalComponent,
  type DishEditFormValue,
} from '../../shared/components/dish-edit-modal/dish-edit-modal.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import {
  IngredientEditModalComponent,
  type IngredientEditFormValue,
} from '../../shared/components/ingredient-edit-modal/ingredient-edit-modal.component';
import { SearchToolbarComponent } from '../../shared/components/search-toolbar/search-toolbar.component';
import {
  SegmentedControlComponent,
  type SegmentedControlOption,
} from '../../shared/components/segmented-control/segmented-control.component';

type ManagementTab = 'ingredients' | 'dishes';
type DishCreateMode = 'ingredient' | 'ai';
type IngredientFilter = 'Tất cả' | (typeof INGREDIENT_CATEGORIES)[number];

@Component({
  selector: 'app-management',
  template: `
    @if (!editOverlayOpen()) {
      <ion-header>
        <ion-toolbar>
          <ion-title>Quản lý</ion-title>
          <ion-buttons slot="end">
            <ion-button (click)="openSettings()" aria-label="Mở cài đặt">
              <ion-icon slot="icon-only" name="settings-outline" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
    }

    <ion-content [fullscreen]="editOverlayOpen()">
      <section class="management-shell">
        <app-segmented-control
          [options]="managementTabs"
          [value]="tab()"
          ariaLabel="Chuyển giữa nguyên liệu và món ăn"
          (valueChange)="onTabChange($event)"
        />

        @if (tab() === 'ingredients') {
          @if (showIngredientSearch()) {
            <app-search-toolbar
              [query]="ingredientStore.searchQuery()"
              placeholder="Tìm nguyên liệu..."
              ariaLabel="Tìm nguyên liệu"
              (queryChange)="onIngredientSearch($event)"
            />
          }

          @if (showIngredientFilters()) {
            <div class="filter-strip" role="group" aria-label="Lọc theo nhóm nguyên liệu">
              @for (category of ingredientFilters; track category) {
                <button
                  type="button"
                  class="filter-chip"
                  [class.filter-chip--active]="activeIngredientFilter() === category"
                  [attr.aria-pressed]="activeIngredientFilter() === category"
                  (click)="setIngredientFilter(category)"
                >
                  {{ category }}
                </button>
              }
            </div>
          }

          @if (ingredientStore.loading()) {
            <p class="state-text">Đang tải nguyên liệu...</p>
          } @else if (filteredIngredients().length === 0) {
            <app-empty-state
              [icon]="ingredientStore.searchQuery().trim() ? 'search-outline' : 'nutrition-outline'"
              [title]="ingredientStore.searchQuery().trim() ? 'Không tìm thấy nguyên liệu nào' : 'Chưa có nguyên liệu nào'"
              [description]="ingredientStore.searchQuery().trim() ? 'Thử từ khóa khác hoặc thêm nguyên liệu mới.' : 'Bắt đầu thêm nguyên liệu để quản lý dinh dưỡng.'"
              [actionLabel]="ingredientStore.searchQuery().trim() ? null : '+ Thêm nguyên liệu đầu tiên'"
              (action)="openCreateIngredient()"
            />
          } @else {
            <div class="card-list">
              @for (ingredient of filteredIngredients(); track ingredient.id) {
                <article class="item-card item-card--ingredient">
                  <button
                    type="button"
                    class="kebab-button"
                    aria-haspopup="menu"
                    [attr.aria-label]="'Tuỳ chọn cho ' + ingredient.name"
                    (click)="openIngredientOptions(ingredient, $event)"
                  >
                    <ion-icon name="ellipsis-vertical" />
                  </button>

                  <button
                    type="button"
                    class="item-card__main-action"
                    [attr.aria-label]="'Mở nguyên liệu ' + ingredient.name"
                    (click)="openEditIngredient(ingredient.id)"
                  >
                    <div class="item-card__split">
                      <div class="item-card__heading">
                        <h3>{{ ingredient.name }}</h3>
                        <div class="badge-row">
                          <span class="badge badge--category" [ngClass]="ingredientCategoryClass(ingredient.category)">
                            {{ ingredient.category }}
                          </span>
                          <span class="badge badge--source">{{ ingredientSourceLabel(ingredient.source) }}</span>
                        </div>
                      </div>

                      <div class="item-card__metric">
                        <strong>{{ formatNumber(ingredient.calories) }}</strong>
                        <span>kcal / {{ ingredient.nutrition_basis_quantity }}{{ ingredient.nutrition_basis_unit }}</span>
                      </div>
                    </div>
                  </button>
                </article>
              }
            </div>

            @if (ingredientResultHint(); as hint) {
              <p class="result-hint result-hint--centered">{{ hint }}</p>
            }
          }
        } @else {
          @if (showDishSearch()) {
            <app-search-toolbar
              [query]="dishStore.searchQuery()"
              placeholder="Tìm món ăn..."
              ariaLabel="Tìm món ăn"
              (queryChange)="onDishSearch($event)"
            />
          }

          @if (dishStore.loading()) {
            <p class="state-text">Đang tải món ăn...</p>
          } @else if (filteredDishes().length === 0) {
            <app-empty-state
              [icon]="dishStore.searchQuery().trim() ? 'search-outline' : 'nutrition-outline'"
              [title]="dishStore.searchQuery().trim() ? 'Không tìm thấy món ăn nào' : 'Chưa có món ăn nào'"
              [description]="dishStore.searchQuery().trim() ? 'Thử tên món khác hoặc thêm món ăn mới.' : 'Thêm món ăn đầu tiên để bắt đầu lập kế hoạch bữa ăn.'"
              [actionLabel]="dishStore.searchQuery().trim() ? null : '+ Thêm món ăn đầu tiên'"
              (action)="openCreateDish()"
            />
          } @else {
            <div class="card-list">
              @for (dish of filteredDishes(); track dish.id) {
                <article class="item-card item-card--dish">
                  <button
                    type="button"
                    class="kebab-button"
                    aria-haspopup="menu"
                    [attr.aria-label]="'Tuỳ chọn cho ' + dish.name"
                    (click)="openDishOptions(dish, $event)"
                  >
                    <ion-icon name="ellipsis-vertical" />
                  </button>

                  <button
                    type="button"
                    class="item-card__main-action"
                    [attr.aria-label]="'Mở món ăn ' + dish.name"
                    (click)="openEditDish(dish.id)"
                  >
                    <div class="item-card__heading item-card__heading--dish">
                      <h3>{{ dish.name }}</h3>
                      <div class="badge-row">
                        <span class="badge" [ngClass]="dishTypeClass(dish.type)">{{ dishTypeLabel(dish.type) }}</span>
                      </div>
                    </div>

                    <div class="dish-calories">{{ formatNumber(dish.total_calories) }} kcal</div>
                    <p class="dish-macros">
                      <span class="macro macro--protein">P: {{ formatNumber(dish.total_protein) }}g</span>
                      <span class="macro macro--carbs">C: {{ formatNumber(dish.total_carbs) }}g</span>
                      <span class="macro macro--fat">F: {{ formatNumber(dish.total_fat) }}g</span>
                    </p>
                    <p class="item-card__detail item-card__detail--dish">
                      {{ formatNumber(dish.servings) }} phần · <span class="badge badge--source-inline">{{ dishSourceLabel(dish.source) }}</span>
                    </p>
                  </button>
                </article>
              }
            </div>

            @if (dishResultHint(); as hint) {
              <p class="result-hint result-hint--centered">{{ hint }}</p>
            }
          }
        }

        @if (!hideFab()) {
          <button
            class="fab"
            type="button"
            [attr.aria-label]="tab() === 'dishes' ? (fabMenuOpen() ? 'Đóng menu tạo món' : 'Mở menu tạo món') : 'Thêm mới'"
            (click)="openCreateAction()"
          >
            <ion-icon [name]="tab() === 'dishes' && fabMenuOpen() ? 'close-outline' : 'add-outline'" />
          </button>
        }

        @if (tab() === 'dishes' && fabMenuOpen()) {
          <div class="fab-menu-backdrop" role="presentation" (click)="closeFabMenu()">
            <div class="fab-menu" tabindex="-1" (click)="$event.stopPropagation()" (keydown.escape)="closeFabMenu()">
              <button
                type="button"
                class="fab-menu-item fab-menu-item--primary"
                aria-label="Tạo món từ nguyên liệu"
                (click)="handleDishCreateMode('ingredient')"
              >
                <ion-icon class="fab-menu-icon" name="create-outline" />
                <span class="fab-menu-text">
                  <span class="fab-menu-label">Tạo từ nguyên liệu</span>
                  <span class="fab-menu-sublabel">Tính dinh dưỡng tự động, quản lý chi tiết</span>
                </span>
              </button>
              <button
                type="button"
                class="fab-menu-item"
                aria-label="AI tự điền từ tên món"
                (click)="handleDishCreateMode('ai')"
              >
                <ion-icon class="fab-menu-icon" name="sparkles-outline" />
                <span class="fab-menu-text">
                  <span class="fab-menu-label">AI tự điền</span>
                  <span class="fab-menu-sublabel">Nhập tên món để AI gợi ý nguyên liệu và khối lượng</span>
                </span>
              </button>
            </div>
          </div>
        }

        <app-ingredient-edit-modal
          [isOpen]="ingredientModalOpen()"
          [form]="ingredientForm()"
          [saving]="ingredientSaving()"
          [title]="ingredientModalTitle()"
          [saveLabel]="ingredientModalSaveLabel()"
          [allowDelete]="editingIngredientId() !== null"
          [availableUnits]="availableUnits()"
          (dismissed)="closeIngredientModal()"
          (submitted)="submitIngredient($event)"
          (deleteRequested)="handleIngredientDeleteFromModal()"
        />

        <app-dish-edit-modal
          [isOpen]="dishModalOpen()"
          [form]="dishForm()"
          [saving]="dishSaving()"
          [title]="dishModalTitle()"
          [saveLabel]="dishModalSaveLabel()"
          [allowDelete]="editingDishId() !== null"
          [ingredients]="ingredientStore.ingredients()"
          (dismissed)="closeDishModal()"
          (submitted)="submitDish($event)"
          (deleteRequested)="handleDishDeleteFromModal()"
        />

        <app-confirm-dialog
          [isOpen]="pendingIngredientDeleteId() !== null"
          [title]="ingredientDeleteDialogTitle()"
          [message]="ingredientDeleteMessage()"
          [cancelLabel]="ingredientDeleteCancelLabel()"
          [confirmLabel]="ingredientDeleteBlocked() ? 'Xem món' : 'Xóa'"
          [confirmAriaLabel]="ingredientDeleteConfirmAriaLabel()"
          [confirmVariant]="ingredientDeleteBlocked() ? 'primary' : 'danger'"
          (cancelled)="closeIngredientDeleteDialog()"
          (confirmed)="confirmIngredientDelete()"
        />

        <app-confirm-dialog
          [isOpen]="pendingDishDeleteId() !== null"
          [title]="dishDeleteDialogTitle()"
          [message]="dishDeleteMessage()"
          [cancelLabel]="dishDeleteCancelLabel()"
          [confirmLabel]="dishDeleteBlocked() ? 'Đóng' : 'Xóa'"
          [confirmAriaLabel]="dishDeleteConfirmAriaLabel()"
          [confirmVariant]="dishDeleteBlocked() ? 'primary' : 'danger'"
          (cancelled)="closeDishDeleteDialog()"
          (confirmed)="confirmDishDelete()"
        />

        @if (ingredientOptionsItem(); as activeIngredient) {
          <div
            class="options-sheet-backdrop"
            role="button"
            tabindex="0"
            aria-label="Đóng tuỳ chọn nguyên liệu"
            (click)="handleIngredientBackdropClick($event)"
            (keydown.enter)="closeIngredientOptions()"
            (keydown.space)="closeIngredientOptions()"
          >
            <section class="options-sheet">
              <h2>Tuỳ chọn cho {{ activeIngredient.name }}</h2>
              <button type="button" class="options-sheet__action" (click)="handleIngredientEditOption()">
                <ion-icon name="create-outline" />
                <span>Sửa</span>
              </button>
              <button
                type="button"
                class="options-sheet__action options-sheet__action--danger"
                (click)="handleIngredientDeleteOption()"
              >
                <ion-icon name="trash-outline" />
                <span>Xóa</span>
              </button>
              <button type="button" class="options-sheet__cancel" (click)="closeIngredientOptions()">Đóng</button>
            </section>
          </div>
        }

        @if (dishOptionsItem(); as activeDish) {
          <div
            class="options-sheet-backdrop"
            role="button"
            tabindex="0"
            aria-label="Đóng tuỳ chọn món ăn"
            (click)="handleDishBackdropClick($event)"
            (keydown.enter)="closeDishOptions()"
            (keydown.space)="closeDishOptions()"
          >
            <section class="options-sheet">
              <h2>Tuỳ chọn cho {{ activeDish.name }}</h2>
              <button type="button" class="options-sheet__action" (click)="handleDishEditOption()">
                <ion-icon name="create-outline" />
                <span>Sửa</span>
              </button>
              <button type="button" class="options-sheet__action options-sheet__action--danger" (click)="handleDishDeleteOption()">
                <ion-icon name="trash-outline" />
                <span>Xóa</span>
              </button>
              <button type="button" class="options-sheet__cancel" (click)="closeDishOptions()">Đóng</button>
            </section>
          </div>
        }
      </section>
    </ion-content>
  `,
  styles: `
    .management-shell {
      padding: 12px 16px 80px;
      background: var(--bg-page);
      min-height: 100%;
    }

    .filter-strip {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      margin: 12px 0 8px;
      padding-bottom: 2px;
      scrollbar-width: none;
    }

    .filter-strip::-webkit-scrollbar {
      display: none;
    }

    .filter-chip {
      flex: 0 0 auto;
      min-height: 36px;
      padding: 8px 12px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xs);
      background: var(--bg-card);
      color: var(--text-tertiary);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0;
      text-transform: none;
    }

    .filter-chip--active {
      border-color: rgba(var(--ion-color-primary-rgb), 0.2);
      background: rgba(var(--ion-color-primary-rgb), 0.08);
      color: var(--primary-700);
    }

    .result-hint,
    .state-text,
    .item-card__detail,
    .dish-macros {
      margin: 0;
      color: var(--text-tertiary);
      font-size: 13px;
      line-height: 1.5;
    }

    .result-hint {
      margin: 12px 0 0;
    }

    .result-hint--centered {
      text-align: center;
    }

    .state-text {
      margin-top: 12px;
    }

    .card-list {
      display: grid;
      gap: 12px;
      margin-top: 16px;
    }

    .item-card {
      position: relative;
      padding: 14px 64px 14px 16px;
      border-radius: var(--radius-lg);
      background: var(--bg-card);
      box-shadow: var(--shadow-md);
    }

    .item-card--ingredient {
      padding-right: 64px;
    }

    .item-card__main-action {
      width: 100%;
      padding: 0;
      border: none;
      background: transparent;
      text-align: left;
      color: inherit;
    }

    .item-card__split {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .item-card__heading {
      min-width: 0;
      flex: 1;
      padding-right: 8px;
    }

    .item-card__heading--dish {
      padding-right: 0;
    }

    .item-card__heading h3 {
      margin: 0;
      color: var(--text-primary);
      font-variant-numeric: tabular-nums;
    }

    .item-card__heading h3 {
      font-size: 16px;
      font-weight: 600;
      line-height: 1.4;
    }

    .badge-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: var(--radius-xs);
      background: var(--bg-muted);
      color: var(--text-tertiary);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0;
      text-transform: none;
    }

    .badge--category {
      color: var(--text-secondary);
    }

    .badge--source,
    .badge--source-inline {
      padding: 1px 6px;
      border-radius: var(--radius-micro);
      font-size: 10px;
      letter-spacing: 0;
      text-transform: none;
    }

    .badge--source,
    .badge--source-inline {
      background: var(--border-color);
      color: var(--text-tertiary);
    }

    .badge--category-cat-thit {
      background: rgba(198, 40, 40, 0.1);
      color: #c62828;
    }

    .badge--category-cat-ca {
      background: rgba(21, 101, 192, 0.1);
      color: #1565c0;
    }

    .badge--category-cat-trung {
      background: rgba(245, 127, 23, 0.1);
      color: #f57f17;
    }

    .badge--category-cat-rau {
      background: rgba(46, 125, 50, 0.1);
      color: #2e7d32;
    }

    .badge--category-cat-ngu-coc {
      background: rgba(230, 81, 0, 0.1);
      color: #e65100;
    }

    .badge--category-cat-dau-hat {
      background: rgba(123, 31, 162, 0.1);
      color: #7b1fa2;
    }

    .badge--category-cat-dau-mo {
      background: rgba(249, 168, 37, 0.1);
      color: #f9a825;
    }

    .badge--category-cat-gia-vi {
      background: rgba(173, 20, 87, 0.1);
      color: #ad1457;
    }

    .badge--category-cat-nuoc-dung {
      background: rgba(0, 105, 92, 0.1);
      color: #00695c;
    }

    .badge--category-cat-trai-cay {
      background: rgba(191, 54, 12, 0.1);
      color: #bf360c;
    }

    .badge--category-cat-khac {
      background: rgba(84, 110, 122, 0.1);
      color: #546e7a;
    }

    .badge--type-ingredient {
      background: #e3f2fd;
      color: #1565c0;
    }

    .badge--type-ai {
      background: #fff3e0;
      color: #e65100;
    }

    @media (prefers-color-scheme: dark) {
      .badge--category-cat-thit {
        background: rgba(198, 40, 40, 0.12);
        color: #ef9a9a;
      }

      .badge--category-cat-ca {
        background: rgba(21, 101, 192, 0.12);
        color: #90caf9;
      }

      .badge--category-cat-trung {
        background: rgba(245, 127, 23, 0.12);
        color: #ffe082;
      }

      .badge--category-cat-rau {
        background: rgba(46, 125, 50, 0.12);
        color: #a5d6a7;
      }

      .badge--category-cat-ngu-coc {
        background: rgba(230, 81, 0, 0.12);
        color: #ffcc80;
      }

      .badge--category-cat-dau-hat {
        background: rgba(123, 31, 162, 0.12);
        color: #ce93d8;
      }

      .badge--category-cat-dau-mo {
        background: rgba(249, 168, 37, 0.12);
        color: #fff59d;
      }

      .badge--category-cat-gia-vi {
        background: rgba(173, 20, 87, 0.12);
        color: #f48fb1;
      }

      .badge--category-cat-nuoc-dung {
        background: rgba(0, 105, 92, 0.12);
        color: #80cbc4;
      }

      .badge--category-cat-trai-cay {
        background: rgba(191, 54, 12, 0.12);
        color: #ffab91;
      }

      .badge--category-cat-khac {
        background: rgba(84, 110, 122, 0.12);
        color: #b0bec5;
      }

      .badge--type-ingredient {
        background: rgba(33, 150, 243, 0.2);
        color: #90caf9;
      }

      .badge--type-ai {
        background: rgba(255, 152, 0, 0.2);
        color: #ffb74d;
      }
    }

    .kebab-button {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 44px;
      min-width: 44px;
      height: 44px;
      margin: 0;
      border: none;
      border-radius: var(--radius-full);
      background: transparent;
      color: var(--text-tertiary);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .kebab-button ion-icon {
      font-size: 20px;
    }

    .item-card__detail {
      margin-top: 6px;
      margin-bottom: 10px;
    }

    .item-card__detail--dish {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
      margin-bottom: 0;
      font-size: 12px;
    }

    .item-card__metric {
      min-width: 68px;
      flex-shrink: 0;
      text-align: right;
      color: var(--text-tertiary);
      font-size: 12px;
      line-height: 1.4;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .item-card__metric strong {
      display: block;
      color: var(--text-primary);
      font-size: 16px;
      font-weight: 600;
      line-height: 1.4;
    }

    .dish-calories {
      margin: 4px 0 0;
      color: var(--text-primary);
      font-size: 22px;
      font-weight: 700;
      line-height: 1.3;
      font-variant-numeric: tabular-nums;
    }

    .dish-macros {
      margin-top: 4px;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      font-variant-numeric: tabular-nums;
    }

    .macro--protein {
      color: var(--ion-color-success);
    }

    .macro--carbs {
      color: var(--ion-color-warning);
    }

    .macro--fat {
      color: var(--ion-color-danger);
    }

  `,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    SegmentedControlComponent,
    NgClass,
    EmptyStateComponent,
    SearchToolbarComponent,
    ConfirmDialogComponent,
    IngredientEditModalComponent,
    DishEditModalComponent,
  ],
})
export default class ManagementPage {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly unitRepository = inject(UnitRepository);
  readonly ingredientStore = inject(IngredientStore);
  readonly dishStore = inject(DishStore);

  readonly managementTabs: SegmentedControlOption<ManagementTab>[] = [
    { value: 'ingredients', label: 'Nguyên liệu', ariaLabel: 'Tab nguyên liệu' },
    { value: 'dishes', label: 'Món ăn', ariaLabel: 'Tab món ăn' },
  ];
  readonly ingredientFilters: IngredientFilter[] = ['Tất cả', ...INGREDIENT_CATEGORIES];
  readonly tab = signal<ManagementTab>('ingredients');
  readonly activeIngredientFilter = signal<IngredientFilter>('Tất cả');
  readonly availableUnits = signal<UnitModel[]>([]);

  readonly ingredientOptionsItem = signal<IngredientListItem | null>(null);
  readonly dishOptionsItem = signal<DishListItem | null>(null);

  readonly pendingIngredientDeleteId = signal<string | null>(null);
  readonly pendingIngredientDeleteName = signal('');
  readonly ingredientDeleteReferenceCount = signal(0);
  readonly ingredientModalOpen = signal(false);
  readonly ingredientSaving = signal(false);
  readonly editingIngredientId = signal<string | null>(null);

  readonly pendingDishDeleteId = signal<string | null>(null);
  readonly pendingDishDeleteName = signal('');
  readonly dishDeleteReferenceCount = signal(0);
  readonly dishModalOpen = signal(false);
  readonly dishSaving = signal(false);
  readonly editingDishId = signal<string | null>(null);
  readonly fabMenuOpen = signal(false);
  readonly editOverlayOpen = computed(() => this.ingredientModalOpen() || this.dishModalOpen());

  readonly filteredIngredients = computed(() => {
    const activeFilter = this.activeIngredientFilter();
    const items = this.ingredientStore.ingredients();
    if (activeFilter === 'Tất cả') {
      return items;
    }

    return items.filter((item) => item.category === activeFilter);
  });

  readonly filteredDishes = computed(() => this.dishStore.dishes());

  readonly showIngredientResultHint = computed(() => {
    return this.ingredientStore.searchQuery().trim().length > 0 || this.activeIngredientFilter() !== 'Tất cả';
  });

  readonly showIngredientSearch = computed(() => {
    return this.ingredientStore.searchQuery().trim().length > 0 || this.ingredientStore.loading() || this.ingredientStore.ingredients().length > 0;
  });

  readonly showIngredientFilters = computed(() => {
    return this.ingredientStore.searchQuery().trim().length === 0 &&
      (this.ingredientStore.loading() || this.ingredientStore.ingredients().length > 0);
  });

  readonly showDishSearch = computed(() => {
    return this.dishStore.searchQuery().trim().length > 0 || this.dishStore.loading() || this.dishStore.dishes().length > 0;
  });

  readonly ingredientResultHint = computed(() => {
    if (!this.showIngredientResultHint()) {
      return null;
    }

    const query = this.ingredientStore.searchQuery().trim();
    const count = this.filteredIngredients().length;
    if (count === 0) {
      return null;
    }

    if (query) {
      return `${count} kết quả cho “${query}”`;
    }

    if (this.activeIngredientFilter() !== 'Tất cả') {
      return `${count} nguyên liệu trong “${this.activeIngredientFilter()}”`;
    }

    return null;
  });

  readonly dishResultHint = computed(() => {
    const query = this.dishStore.searchQuery().trim();
    const count = this.filteredDishes().length;
    if (!query || count === 0) {
      return null;
    }

    return `${count} kết quả`;
  });

  readonly hideFab = computed(() => {
    if (this.editOverlayOpen() || this.pendingIngredientDeleteId() !== null || this.pendingDishDeleteId() !== null) {
      return true;
    }

    if (this.ingredientOptionsItem() !== null || this.dishOptionsItem() !== null || this.fabMenuOpen()) {
      return true;
    }

    if (this.tab() === 'ingredients') {
      return !this.ingredientStore.loading() &&
        this.filteredIngredients().length === 0 &&
        this.ingredientStore.searchQuery().trim().length === 0;
    }

    return !this.dishStore.loading() && this.filteredDishes().length === 0 && this.dishStore.searchQuery().trim().length === 0;
  });

  readonly ingredientDeleteBlocked = computed(() => this.ingredientDeleteReferenceCount() > 0);
  readonly ingredientDeleteDialogTitle = computed(() =>
    this.ingredientDeleteBlocked() ? 'Không thể xóa' : 'Xóa nguyên liệu?',
  );
  readonly ingredientDeleteCancelLabel = computed(() =>
    this.ingredientDeleteBlocked() ? 'Đóng' : 'Giữ lại',
  );
  readonly ingredientDeleteConfirmAriaLabel = computed(() =>
    this.ingredientDeleteBlocked()
      ? `Xem ${this.ingredientDeleteReferenceCount()} món đang dùng nguyên liệu ${this.pendingIngredientDeleteName()}`
      : `Xóa nguyên liệu ${this.pendingIngredientDeleteName()}`,
  );
  readonly ingredientDeleteMessage = computed(() => {
    if (this.ingredientDeleteBlocked()) {
      return `Nguyên liệu “${this.pendingIngredientDeleteName()}” đang được dùng trong ${this.ingredientDeleteReferenceCount()} món ăn.`;
    }

    return this.pendingIngredientDeleteName()
      ? `Bạn có chắc muốn xóa “${this.pendingIngredientDeleteName()}”? Thao tác này không thể hoàn tác.`
      : 'Nguyên liệu này sẽ bị xóa khỏi thư viện hiện tại.';
  });

  readonly dishDeleteBlocked = computed(() => this.dishDeleteReferenceCount() > 0);
  readonly dishDeleteDialogTitle = computed(() => (this.dishDeleteBlocked() ? 'Không thể xóa' : 'Xóa món ăn?'));
  readonly dishDeleteCancelLabel = computed(() => (this.dishDeleteBlocked() ? 'Đóng' : 'Giữ lại'));
  readonly dishDeleteConfirmAriaLabel = computed(() =>
    this.dishDeleteBlocked() ? `Đóng hộp thoại món ${this.pendingDishDeleteName()}` : `Xóa món ${this.pendingDishDeleteName()}`,
  );
  readonly dishDeleteMessage = computed(() => {
    if (this.dishDeleteBlocked()) {
      return `Món ăn “${this.pendingDishDeleteName()}” đang được dùng trong kế hoạch ăn nên chưa thể xóa.`;
    }

    return this.pendingDishDeleteName()
      ? `Bạn có chắc muốn xóa “${this.pendingDishDeleteName()}”? Thao tác này không thể hoàn tác.`
      : 'Món ăn này sẽ bị xóa khỏi thư viện hiện tại.';
  });

  readonly ingredientModalTitle = computed(() =>
    this.editingIngredientId() ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu',
  );
  readonly ingredientModalSaveLabel = computed(() =>
    this.editingIngredientId() ? 'Lưu thay đổi' : 'Lưu nguyên liệu',
  );
  readonly dishModalTitle = computed(() => (this.editingDishId() ? 'Sửa món ăn' : 'Thêm món ăn'));
  readonly dishModalSaveLabel = computed(() =>
    this.editingDishId() ? 'Lưu thay đổi' : 'Lưu món ăn',
  );

  readonly dishForm = signal<DishEditFormValue>({
    name: '',
    description: '',
    servings: 1,
    items: [],
  });
  readonly ingredientForm = signal<IngredientEditFormValue>({
    name: '',
    category: '',
    nutrition_basis_unit: 'g',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    density_g_per_ml: null,
    units: [],
  });

  constructor() {
    addIcons({
      settingsOutline,
      addOutline,
      closeOutline,
      nutritionOutline,
      searchOutline,
      ellipsisVertical,
      createOutline,
      sparklesOutline,
      trashOutline,
    });
    void this.loadUnits();

    effect(() => {
      const activeTab = this.tab();
      if (activeTab === 'ingredients') {
        void this.ingredientStore.load();
      } else {
        void this.dishStore.load();
      }
    });
  }

  onTabChange(value: ManagementTab | string | null | undefined): void {
    this.tab.set(value === 'dishes' ? 'dishes' : 'ingredients');
    this.closeFabMenu();
  }

  setIngredientFilter(category: IngredientFilter): void {
    this.activeIngredientFilter.set(category);
  }

  async openSettings(): Promise<void> {
    await this.router.navigate(['/settings']);
  }

  async onIngredientSearch(query: string): Promise<void> {
    await this.ingredientStore.search(query);
  }

  async onDishSearch(query: string): Promise<void> {
    await this.dishStore.search(query);
  }

  clearIngredientSearch(): void {
    void this.ingredientStore.search('');
  }

  clearDishSearch(): void {
    void this.dishStore.search('');
  }

  openCreateAction(): void {
    if (this.tab() === 'ingredients') {
      this.openCreateIngredient();
      return;
    }

    this.fabMenuOpen.update((open) => !open);
  }

  openIngredientOptions(item: IngredientListItem, event?: Event): void {
    event?.stopPropagation();
    this.ingredientOptionsItem.set(item);
  }

  closeIngredientOptions(): void {
    this.ingredientOptionsItem.set(null);
  }

  handleIngredientEditOption(): void {
    const active = this.ingredientOptionsItem();
    this.closeIngredientOptions();
    if (active) {
      this.openEditIngredient(active.id);
    }
  }

  handleIngredientDeleteOption(): void {
    const active = this.ingredientOptionsItem();
    this.closeIngredientOptions();
    if (active) {
      void this.openIngredientDeleteDialog(active.id, active.name);
    }
  }

  handleIngredientDeleteFromModal(): void {
    const id = this.editingIngredientId();
    if (!id) {
      return;
    }

    const ingredient = this.ingredientStore.ingredients().find((item) => item.id === id);
    this.closeIngredientModal();
    void this.openIngredientDeleteDialog(id, ingredient?.name ?? 'nguyên liệu');
  }

  handleIngredientBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeIngredientOptions();
    }
  }

  openDishOptions(item: DishListItem, event?: Event): void {
    event?.stopPropagation();
    this.dishOptionsItem.set(item);
  }

  closeDishOptions(): void {
    this.dishOptionsItem.set(null);
  }

  closeFabMenu(): void {
    this.fabMenuOpen.set(false);
  }

  handleDishCreateMode(mode: DishCreateMode): void {
    this.closeFabMenu();
    if (mode === 'ingredient') {
      void this.openCreateDish();
      return;
    }

    void this.openCreateAiDish();
  }

  handleDishEditOption(): void {
    const active = this.dishOptionsItem();
    this.closeDishOptions();
    if (active) {
      void this.openEditDish(active.id);
    }
  }

  handleDishDeleteOption(): void {
    const active = this.dishOptionsItem();
    this.closeDishOptions();
    if (active) {
      void this.openDishDeleteDialog(active.id, active.name);
    }
  }

  handleDishDeleteFromModal(): void {
    const id = this.editingDishId();
    if (!id) {
      return;
    }

    const dish = this.dishStore.dishes().find((item) => item.id === id);
    this.closeDishModal();
    void this.openDishDeleteDialog(id, dish?.name ?? 'món ăn');
  }

  handleDishBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeDishOptions();
    }
  }

  async openCreateDish(): Promise<void> {
    this.closeFabMenu();
    await this.ingredientStore.load();
    this.editingDishId.set(null);
    this.dishForm.set({
      name: '',
      description: '',
      servings: 1,
      items: [],
    });
    this.dishModalOpen.set(true);
    this.document.body.classList.add('edit-overlay-open');
  }

  async openCreateAiDish(): Promise<void> {
    this.closeFabMenu();
    await this.openCreateDish();
  }

  async openEditDish(id: string): Promise<void> {
    const dish = await this.dishStore.fetchById(id);
    if (!dish) {
      return;
    }

    await this.ingredientStore.load();
    this.editingDishId.set(id);
    this.dishForm.set({
      name: dish.name,
      description: dish.description ?? '',
      servings: dish.servings,
      items: dish.ingredients.map((item) => ({
        local_id: this.createLocalId('dish-item'),
        ingredient_id: item.ingredient_id,
        amount_value: item.amount_value,
        unit_id: item.unit_id,
      })),
    });
    this.dishModalOpen.set(true);
    this.document.body.classList.add('edit-overlay-open');
  }

  closeDishModal(): void {
    this.dishModalOpen.set(false);
    this.dishSaving.set(false);
    this.editingDishId.set(null);
    this.closeFabMenu();
    this.document.body.classList.remove('edit-overlay-open');
  }

  async submitDish(form: DishEditFormValue): Promise<void> {
    this.dishSaving.set(true);
    try {
      const items = form.items.map((item) => ({
        ingredient_id: item.ingredient_id,
        amount_value: item.amount_value,
        unit_id: item.unit_id,
      }));

      const payload = {
        name: form.name,
        description: form.description || null,
        type: 'ingredient_based' as const,
        source: 'custom' as const,
        servings: form.servings,
        image_url: null,
      };

      const editingId = this.editingDishId();
      if (editingId) {
        await this.dishStore.edit(editingId, payload, items);
      } else {
        await this.dishStore.addFromIngredients(payload, items);
      }
      this.closeDishModal();
      this.tab.set('dishes');
    } finally {
      this.dishSaving.set(false);
    }
  }

  openCreateIngredient(): void {
    this.editingIngredientId.set(null);
    this.ingredientForm.set({
      name: '',
      category: '',
      nutrition_basis_unit: 'g',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      density_g_per_ml: null,
      units: [],
    });
    this.ingredientModalOpen.set(true);
    this.document.body.classList.add('edit-overlay-open');
  }

  closeIngredientModal(): void {
    this.ingredientModalOpen.set(false);
    this.ingredientSaving.set(false);
    this.editingIngredientId.set(null);
    this.closeFabMenu();
    this.document.body.classList.remove('edit-overlay-open');
  }

  openEditIngredient(id: string): void {
    const ingredient = this.ingredientStore.ingredients().find((item) => item.id === id);
    if (!ingredient) {
      return;
    }

    this.editingIngredientId.set(id);
    this.ingredientForm.set({
      name: ingredient.name,
      category: ingredient.category,
      nutrition_basis_unit: ingredient.nutrition_basis_unit,
      calories: ingredient.calories,
      protein: ingredient.protein,
      carbs: ingredient.carbs,
      fat: ingredient.fat,
      fiber: ingredient.fiber,
      density_g_per_ml: ingredient.density_g_per_ml,
      units: ingredient.units.map((unit) => ({
        local_id: this.createLocalId('ingredient-unit'),
        unit_id: unit.unit_id,
        factor_to_basis: unit.factor_to_basis,
        is_default: unit.is_default === 1,
        display_label: unit.display_label ?? unit.short_name_vi,
        is_approximate: unit.is_approximate === 1,
        short_name_vi: unit.short_name_vi,
      })),
    });
    this.ingredientModalOpen.set(true);
    this.document.body.classList.add('edit-overlay-open');
  }

  async submitIngredient(form: IngredientEditFormValue): Promise<void> {
    this.ingredientSaving.set(true);
    try {
      const editingId = this.editingIngredientId();
      const units = form.units.map((unit) => ({
        unit_id: unit.unit_id,
        factor_to_basis: unit.factor_to_basis,
        is_default: unit.is_default ? 1 : 0,
        display_label: unit.display_label.trim() || null,
      }));

      if (editingId) {
        await this.ingredientStore.edit(editingId, {
          name: form.name,
          category: form.category,
          nutrition_basis_unit: form.nutrition_basis_unit,
          nutrition_basis_quantity: 100,
          calories: form.calories,
          protein: form.protein,
          carbs: form.carbs,
          fat: form.fat,
          fiber: form.fiber,
          density_g_per_ml: form.density_g_per_ml,
          source: 'manual',
          units,
        });
      } else {
        await this.ingredientStore.add({
          name: form.name,
          category: form.category,
          nutrition_basis_unit: form.nutrition_basis_unit,
          nutrition_basis_quantity: 100,
          calories: form.calories,
          protein: form.protein,
          carbs: form.carbs,
          fat: form.fat,
          fiber: form.fiber,
          density_g_per_ml: form.density_g_per_ml,
          source: 'manual',
          units,
        });
      }
      this.closeIngredientModal();
    } finally {
      this.ingredientSaving.set(false);
    }
  }

  async openIngredientDeleteDialog(id: string, name: string): Promise<void> {
    this.pendingIngredientDeleteId.set(id);
    this.pendingIngredientDeleteName.set(name);
    this.ingredientDeleteReferenceCount.set(await this.ingredientStore.countDishReferences(id));
  }

  closeIngredientDeleteDialog(): void {
    this.pendingIngredientDeleteId.set(null);
    this.pendingIngredientDeleteName.set('');
    this.ingredientDeleteReferenceCount.set(0);
  }

  async confirmIngredientDelete(): Promise<void> {
    const id = this.pendingIngredientDeleteId();
    if (!id) {
      return;
    }

    if (this.ingredientDeleteBlocked()) {
      this.closeIngredientDeleteDialog();
      this.tab.set('dishes');
      await this.dishStore.load();
      return;
    }

    await this.ingredientStore.remove(id);
    this.closeIngredientDeleteDialog();
  }

  async openDishDeleteDialog(id: string, name: string): Promise<void> {
    this.pendingDishDeleteId.set(id);
    this.pendingDishDeleteName.set(name);
    this.dishDeleteReferenceCount.set(await this.dishStore.countReferences(id));
  }

  closeDishDeleteDialog(): void {
    this.pendingDishDeleteId.set(null);
    this.pendingDishDeleteName.set('');
    this.dishDeleteReferenceCount.set(0);
  }

  async confirmDishDelete(): Promise<void> {
    const id = this.pendingDishDeleteId();
    if (!id) {
      return;
    }

    if (this.dishDeleteBlocked()) {
      this.closeDishDeleteDialog();
      return;
    }

    await this.dishStore.remove(id);
    this.closeDishDeleteDialog();
  }

  ingredientSourceLabel(source: string): string {
    return source === 'db' ? 'Có sẵn' : source === 'ai' ? 'AI' : 'Tự tạo';
  }

  ingredientCategoryClass(category: string): string {
    const categoryMap: Record<string, string> = {
      'Thịt': 'badge--category-cat-thit',
      'Cá & Hải sản': 'badge--category-cat-ca',
      'Trứng & Sữa': 'badge--category-cat-trung',
      'Rau củ': 'badge--category-cat-rau',
      'Ngũ cốc & Tinh bột': 'badge--category-cat-ngu-coc',
      'Đậu & Hạt': 'badge--category-cat-dau-hat',
      'Dầu & Mỡ': 'badge--category-cat-dau-mo',
      'Gia vị': 'badge--category-cat-gia-vi',
      'Nước dùng & Nước chấm': 'badge--category-cat-nuoc-dung',
      'Trái cây': 'badge--category-cat-trai-cay',
      'Khác': 'badge--category-cat-khac',
    };

    return categoryMap[category] ?? 'badge--category-cat-khac';
  }

  dishSourceLabel(source: string): string {
    return source === 'db' ? 'Có sẵn' : source === 'ai' ? 'AI' : 'Tự tạo';
  }

  dishTypeClass(type: string): string {
    return type === 'ai_autofill' ? 'badge--type-ai' : 'badge--type-ingredient';
  }

  dishTypeLabel(type: string): string {
    return type === 'ai_autofill' ? 'AI tự điền' : 'Nguyên liệu';
  }

  ingredientUnitSummary(
    units: {
      display_label: string | null;
      short_name_vi?: string;
      is_default: number;
      is_approximate: number;
    }[],
  ): string {
    const defaultUnit = units.find((unit) => unit.is_default === 1);
    const approximateUnit = units.find((unit) => unit.is_approximate === 1);
    const defaultLabel = defaultUnit?.display_label ?? defaultUnit?.short_name_vi ?? '—';
    if (approximateUnit) {
      return `Mặc định: ${defaultLabel} · Có đơn vị ước lượng`;
    }

    return `Mặc định: ${defaultLabel}`;
  }

  formatNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
  }

  private async loadUnits(): Promise<void> {
    this.availableUnits.set(await this.unitRepository.list());
  }

  private createLocalId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
