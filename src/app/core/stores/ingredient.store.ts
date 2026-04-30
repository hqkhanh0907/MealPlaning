import { Injectable, inject, signal } from '@angular/core';
import type {
  CreateIngredientInput,
  IngredientListItem,
  UpdateIngredientInput,
} from '../repositories/ingredient.repository';
import { IngredientRepository } from '../repositories/ingredient.repository';

@Injectable({ providedIn: 'root' })
export class IngredientStore {
  private readonly repo = inject(IngredientRepository);

  readonly ingredients = signal<IngredientListItem[]>([]);
  readonly loading = signal(false);
  readonly searchQuery = signal('');

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.ingredients.set(await this.repo.list());
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
      this.ingredients.set(nextItems);
    } finally {
      this.loading.set(false);
    }
  }

  async add(input: CreateIngredientInput): Promise<void> {
    const saved = await this.repo.insert(input);
    this.ingredients.set([saved, ...this.ingredients()]);
  }

  /**
   * F-02 — Bulk-merge ingredients vào cache sau khi store-level transaction
   * commit (tránh repo.list() reload tốn IO). Dedup theo `id`: nếu cache đã
   * có row cùng id (vì find-or-create trả về existing) thì giữ nguyên,
   * không double-prepend.
   */
  addManyToCache(saved: readonly IngredientListItem[]): void {
    if (saved.length === 0) {
      return;
    }
    const existingIds = new Set(this.ingredients().map((row) => row.id));
    const fresh = saved.filter((row) => !existingIds.has(row.id));
    if (fresh.length === 0) {
      return;
    }
    this.ingredients.set([...fresh, ...this.ingredients()]);
  }

  async edit(id: string, input: UpdateIngredientInput): Promise<void> {
    await this.repo.update(id, input);
    await this.reloadActiveView();
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
    this.ingredients.set(this.ingredients().filter((item) => item.id !== id));
  }

  async countDishReferences(id: string): Promise<number> {
    return this.repo.countDishReferences(id);
  }

  private async reloadActiveView(): Promise<void> {
    const query = this.searchQuery().trim();
    const nextItems = query ? await this.repo.searchByName(query) : await this.repo.list();
    this.ingredients.set(nextItems);
  }
}
