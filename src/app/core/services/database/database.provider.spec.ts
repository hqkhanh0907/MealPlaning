import { APP_INITIALIZER, ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProfileStore } from '../../stores/profile.store';
import { SeedLoaderService } from '../seed/seed-loader.service';
import { provideDatabaseService } from './database.provider';
import { DatabaseService } from './database.service';

describe('provideDatabaseService startup orchestration', () => {
  function configure(): {
    calls: string[];
    db: jasmine.SpyObj<DatabaseService>;
    profileStore: jasmine.SpyObj<ProfileStore>;
    seedLoader: jasmine.SpyObj<SeedLoaderService>;
    initializers: (() => Promise<void>)[];
    initStatus: ApplicationInitStatus;
  } {
    const calls: string[] = [];
    const db = jasmine.createSpyObj<DatabaseService>('DatabaseService', ['initialize']);
    db.initialize.and.callFake(async () => {
      calls.push('db.initialize');
    });

    const profileStore = jasmine.createSpyObj<ProfileStore>('ProfileStore', ['loadProfile']);
    profileStore.loadProfile.and.callFake(async () => {
      calls.push('profile.loadProfile');
    });

    const seedLoader = jasmine.createSpyObj<SeedLoaderService>('SeedLoaderService', ['run']);
    seedLoader.run.and.callFake(async () => {
      calls.push('seed.run');
      return { ingredients: 0, dishes: 0 };
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideDatabaseService(),
        { provide: DatabaseService, useValue: db },
        { provide: ProfileStore, useValue: profileStore },
        { provide: SeedLoaderService, useValue: seedLoader },
      ],
    });

    return {
      calls,
      db,
      profileStore,
      seedLoader,
      initializers: TestBed.inject(APP_INITIALIZER) as (() => Promise<void>)[],
      initStatus: TestBed.inject(ApplicationInitStatus),
    };
  }

  it('registers a single app initializer for database startup', () => {
    const { initializers } = configure();
    expect(initializers.length).toBe(1);
  });

  it('initializes database before loading profile during app init', async () => {
    const { calls, initStatus } = configure();
    await initStatus.donePromise;
    expect(calls).toEqual(['db.initialize', 'seed.run', 'profile.loadProfile']);
  });

  it('continues startup even if seed loader throws', async () => {
    const { calls, seedLoader, initStatus } = configure();
    seedLoader.run.and.callFake(async () => {
      calls.push('seed.run');
      throw new Error('boom');
    });
    await initStatus.donePromise;
    expect(calls).toEqual(['db.initialize', 'seed.run', 'profile.loadProfile']);
  });
});
