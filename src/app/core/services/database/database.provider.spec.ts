import { APP_INITIALIZER, ApplicationInitStatus } from '@angular/core';
import { fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProfileStore } from '../../stores/profile.store';
import { SeedLoader } from '../seed/seed-loader';
import { provideDatabaseService, SEED_STARTUP_DELAY_MS } from './database.provider';
import { Database } from './database';

describe('provideDatabaseService startup orchestration', () => {
  function configure(): {
    calls: string[];
    db: jasmine.SpyObj<Database>;
    profileStore: jasmine.SpyObj<ProfileStore>;
    seedLoader: jasmine.SpyObj<SeedLoader>;
    initializers: (() => Promise<void>)[];
    initStatus: ApplicationInitStatus;
  } {
    const calls: string[] = [];
    const db = jasmine.createSpyObj<Database>('DatabaseService', ['initialize']);
    db.initialize.and.callFake(async () => {
      calls.push('db.initialize');
    });

    const profileStore = jasmine.createSpyObj<ProfileStore>('ProfileStore', ['loadProfile']);
    profileStore.loadProfile.and.callFake(async () => {
      calls.push('profile.loadProfile');
    });

    const seedLoader = jasmine.createSpyObj<SeedLoader>('SeedLoaderService', ['run']);
    seedLoader.run.and.callFake(async () => {
      calls.push('seed.run');
      return { ingredients: 0, dishes: 0 };
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideDatabaseService(),
        { provide: Database, useValue: db },
        { provide: ProfileStore, useValue: profileStore },
        { provide: SeedLoader, useValue: seedLoader },
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

  it('initializes database and profile before starting delayed seed load', fakeAsync(() => {
    const { calls, initStatus } = configure();
    let initialized = false;
    initStatus.donePromise.then(() => {
      initialized = true;
    });

    flushMicrotasks();
    expect(initialized).toBeTrue();
    expect(calls).toEqual(['db.initialize', 'profile.loadProfile']);

    tick(SEED_STARTUP_DELAY_MS);
    flushMicrotasks();
    expect(calls).toEqual(['db.initialize', 'profile.loadProfile', 'seed.run']);
  }));

  it('does not wait for seed loader during app init', fakeAsync(() => {
    let resolveSeed!: (value: { ingredients: number; dishes: number }) => void;
    const { calls, seedLoader, initStatus } = configure();
    seedLoader.run.and.callFake(
      () =>
        new Promise<{ ingredients: number; dishes: number }>((resolve) => {
          calls.push('seed.run');
          resolveSeed = resolve;
        }),
    );

    let initialized = false;
    initStatus.donePromise.then(() => {
      initialized = true;
    });
    flushMicrotasks();
    expect(initialized).toBeTrue();
    expect(calls).toEqual(['db.initialize', 'profile.loadProfile']);

    tick(SEED_STARTUP_DELAY_MS);
    expect(calls).toEqual(['db.initialize', 'profile.loadProfile', 'seed.run']);
    resolveSeed({ ingredients: 0, dishes: 0 });
    flushMicrotasks();
  }));

  it('continues startup even if seed loader throws', fakeAsync(() => {
    const warnSpy = spyOn(console, 'warn');
    const { calls, seedLoader, initStatus } = configure();
    seedLoader.run.and.callFake(async () => {
      calls.push('seed.run');
      throw new Error('boom');
    });
    let initialized = false;
    initStatus.donePromise.then(() => {
      initialized = true;
    });
    flushMicrotasks();
    expect(initialized).toBeTrue();
    expect(calls).toEqual(['db.initialize', 'profile.loadProfile']);

    tick(SEED_STARTUP_DELAY_MS);
    flushMicrotasks();
    expect(calls).toEqual(['db.initialize', 'profile.loadProfile', 'seed.run']);
    expect(warnSpy).toHaveBeenCalledWith(
      '[DatabaseProvider] seed load failed:',
      jasmine.any(Error),
    );
  }));
});
