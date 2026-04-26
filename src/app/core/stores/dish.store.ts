import { Injectable, inject, signal } from '@angular/core';
import type { CreateDishIngredientInput } from '../repositories/dish-ingredient.repository';
import type { CreateDishInput, DishListItem, DishWithIngredients } from '../repositories/dish.repository';
import { DishRepository } from '../repositories/dish.repository';

@Injectable({ providedIn: 'root' })
export class DishStore {
  private readonly repo = inject(DishRepository);

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

  async addFromIngredients(
    input: CreateDishInput,
    items: CreateDishIngredientInput[],
  ): Promise<void> {
    const saved = await this.repo.insert(input, items);
    this.dishes.set([this.toListItem(saved), ...this.dishes()]);
  }

  async edit(id: string, input: CreateDishInput, items: CreateDishIngredientInput[]): Promise<void> {
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

  async countReferences(id: string): Promise<number> {
    return this.repo.countReferences(id);
  }

  private toListItem(item: DishWithIngredients): DishListItem {
    const { ingredients: _ingredients, ...listItem } = item;
    return listItem;
  }
}
