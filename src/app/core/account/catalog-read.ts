import { inject, Injectable, InjectionToken } from '@angular/core';
import type { IngredientModel } from '../models/management.model';
import type { Database } from '../services/database/database';
import { AccountSession } from './account-session';
import { nativeAccount } from './native-account';

export type CatalogCommand =
  | { op: 'list' }
  | { op: 'searchByName'; query: string }
  | { op: 'findRecentlyUsed'; limit: number }
  | { op: 'getById'; id: string }
  | { op: 'countDishReferences'; id: string }
  | { op: 'findByIds'; ids: readonly string[] }
  | { op: 'findByExactName'; name: string };

export type CatalogValue<C extends CatalogCommand> = C extends { op: 'countDishReferences' }
  ? number
  : C extends { op: 'getById' | 'findByExactName' }
    ? IngredientModel | null
    : IngredientModel[];

export interface NativeCatalogRead {
  ownerId: string;
  op: CatalogCommand['op'];
  value: IngredientModel[] | IngredientModel | null | number;
}

type NativeRead = (request: {
  ownerId: string;
  command: CatalogCommand;
}) => Promise<NativeCatalogRead>;
export const NATIVE_CATALOG_READ = new InjectionToken<NativeRead>(
  'Native ingredient catalog read',
  {
    providedIn: 'root',
    factory: () => (request) => nativeAccount.catalogRead(request),
  },
);

@Injectable({ providedIn: 'root' })
export class CatalogRead {
  private readonly native = inject(NATIVE_CATALOG_READ);
  private readonly session = inject(AccountSession);

  async run<C extends CatalogCommand>(
    db: Database,
    command: C,
    local: () => Promise<CatalogValue<C>>,
  ): Promise<CatalogValue<C>> {
    const owner = this.session.current();
    if (!owner) throw new Error('A current ingredient catalog account is required.');
    const assertOwner = (): void => {
      if (this.session.current() !== owner) throw new Error('Ingredient catalog account changed.');
    };
    if (!db.hasActiveTransaction) {
      try {
        const result = await this.native({ ownerId: owner.id, command });
        assertOwner();
        if (
          result.ownerId !== owner.id ||
          result.op !== command.op ||
          !Object.hasOwn(result, 'value')
        ) {
          throw new Error('Unexpected native ingredient catalog reply.');
        }
        if (!db.hasActiveTransaction) return result.value as CatalogValue<C>;
      } catch (error: unknown) {
        assertOwner();
        const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
        if (code !== 'UNIMPLEMENTED' && code !== 'catalog_native_unavailable') throw error;
      }
    }
    const value = await local();
    assertOwner();
    return value;
  }
}
