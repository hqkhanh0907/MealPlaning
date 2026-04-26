import { inject, Injectable } from '@angular/core';
import type { UnitModel } from '../models/management.model';
import { DatabaseService } from '../services/database/database.service';

@Injectable({ providedIn: 'root' })
export class UnitRepository {
  private readonly db = inject(DatabaseService);

  async list(): Promise<UnitModel[]> {
    return this.db.query<UnitModel>('SELECT * FROM unit ORDER BY display_order ASC, id ASC');
  }
}
