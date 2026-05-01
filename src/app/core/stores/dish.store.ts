import { Injectable, inject, signal } from '@angular/core';
import type { CreateDishIngredientInput } from '../repositories/dish-ingredient.repository';
import type {
  CreateDishInput,
  DishListItem,
  DishWithIngredients,
} from '../repositories/dish.repository';
import { DishRepository } from '../repositories/dish.repository';
import {
  DishAutofillApplier,
  type ApplyAutofillOptions,
} from '../services/ai/dish-autofill-applier';
import type { DishAutofillResult } from '../services/ai/nutrition-ai';
import { Database } from '../services/database/database';
import { IngredientRepository } from '../repositories/ingredient.repository';
import { IngredientStore } from './ingredient.store';

@Injectable({ providedIn: 'root' })
export class DishStore {
  private readonly repo = inject(DishRepository);
  private readonly db = inject(Database);
  private readonly autofillApplier = inject(DishAutofillApplier);
  private readonly ingredientRepo = inject(IngredientRepository);
  private readonly ingredientStore = inject(IngredientStore);

  readonly dishes = signal<DishListItem[]>([]);
  readonly loading = signal(false);
  readonly searchQuery = signal('');

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.dishes.set(await this.repo.list());
    } finally {
      this.loading.set(false);
    }
  }

  async search(query: string): Promise<void> {
    this.searchQuery.set(query);
    this.loading.set(true);
    try {
      const nextItems = query.trim()
        ? await this.repo.searchByName(query.trim())
        : await this.repo.list();
      this.dishes.set(nextItems);
    } finally {
      this.loading.set(false);
    }
  }

  async fetchById(id: string): Promise<DishWithIngredients | null> {
    return this.repo.getById(id);
  }

  /**
   * Pre-check trùng tên cho AI autofill flow. Trả về dish trùng (case-insensitive,
   * exact normalized) hoặc null. KHÔNG dùng cho fuzzy/contains search — đã có
   * `search()` riêng cho UI list filter.
   */
  async findByNormalizedName(name: string): Promise<DishListItem | null> {
    return this.repo.findByNormalizedName(name);
  }

  async addFromIngredients(
    input: CreateDishInput,
    items: CreateDishIngredientInput[],
  ): Promise<void> {
    const saved = await this.repo.insert(input, items);
    this.dishes.set([this.toListItem(saved), ...this.dishes()]);
  }

  async edit(
    id: string,
    input: CreateDishInput,
    items: CreateDishIngredientInput[],
  ): Promise<void> {
    const saved = await this.repo.update(id, input, items);
    const nextItem = this.toListItem(saved);
    this.dishes.set(this.dishes().map((item) => (item.id === id ? nextItem : item)));
    if (!this.dishes().some((item) => item.id === id)) {
      this.dishes.set([nextItem, ...this.dishes()]);
    }
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
    this.dishes.set(this.dishes().filter((item) => item.id !== id));
  }

  /**
   * F-02 — Atomic AI autofill ingredient materialization.
   *
   * Wrap `autofillApplier.apply()` trong 1 outer `withTransaction`:
   *  - find-or-create N ingredient mới qua `IngredientRepository.insert`
   *    (mỗi insert là inner tx → no-op nested vì đã trong outer tx).
   *  - Nếu bất kỳ insert nào throw → ROLLBACK toàn bộ ingredient batch
   *    (cache không update).
   *  - Sau commit: bulk-merge ingredient mới vào `ingredientStore.addManyToCache`.
   *
   * KHÔNG save dish ở đây. Dish save vẫn đi qua `addFromIngredients` /
   * `edit` (tx riêng) sau khi user nhấn nút lưu — 2 atomic boundaries
   * riêng biệt khớp UX (apply → form sửa → save).
   */
  async applyAutofillAtomic(
    autofillResult: DishAutofillResult,
    options: ApplyAutofillOptions,
  ): Promise<{
    dishIngredients: readonly CreateDishIngredientInput[];
    createdIngredientIds: readonly string[];
  }> {
    const applied = await this.db.withTransaction(async () =>
      this.autofillApplier.apply(autofillResult, options),
    );

    if (applied.createdIngredientIds.length > 0) {
      const newIngredients = await this.ingredientRepo.findByIds([...applied.createdIngredientIds]);
      this.ingredientStore.addManyToCache(newIngredients);
    }

    return {
      dishIngredients: applied.dishIngredients,
      createdIngredientIds: applied.createdIngredientIds,
    };
  }

  async countReferences(id: string): Promise<number> {
    return this.repo.countReferences(id);
  }

  private toListItem(item: DishWithIngredients): DishListItem {
    const { ingredients: _ingredients, ...listItem } = item;
    return listItem;
  }
}
