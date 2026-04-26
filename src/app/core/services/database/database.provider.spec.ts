import { APP_INITIALIZER, ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProfileStore } from '../../stores/profile.store';
import { provideDatabaseService } from './database.provider';
import { DatabaseService } from './database.service';

describe('provideDatabaseService startup orchestration', () => {
  function configure(): {
    calls: string[];
    db: jasmine.SpyObj<DatabaseService>;
    profileStore: jasmine.SpyObj<ProfileStore>;
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

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideDatabaseService(),
        { provide: DatabaseService, useValue: db },
        { provide: ProfileStore, useValue: profileStore },
      ],
    });

    return {
      calls,
      db,
      profileStore,
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
    expect(calls).toEqual(['db.initialize', 'profile.loadProfile']);
  });
});
