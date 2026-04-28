import { inject, Injectable } from '@angular/core';
import type { UnitModel } from '../models/management.model';
import { Database } from '../services/database/database';

@Injectable({ providedIn: 'root' })
export class UnitRepository {
  private readonly db = inject(Database);

  async list(): Promise<UnitModel[]> {
    return this.db.query<UnitModel>('SELECT * FROM unit ORDER BY display_order ASC, id ASC');
  }
}
