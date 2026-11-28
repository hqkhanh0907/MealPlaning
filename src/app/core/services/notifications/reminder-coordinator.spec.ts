import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AccountSession, type AccountIdentity } from '../../account/account-session';
import type { ActiveTrainingPlan, TrainingPlanDayWithExercises } from '../../models/fitness.types';
import type { UserProfile } from '../../models/user-profile.model';
import { TrainingPlanRepository } from '../../repositories/training-plan.repository';
import { ProfileStore } from '../../stores/profile.store';
import { LocalNotifications, webReminderPlan } from './local-notifications';
import { notificationFlags } from './notification-preferences';
import { ReminderCoordinator } from './reminder-coordinator';

const ownerA = { id: 'reminderqa00001', username: 'reminder_a', name: 'An' };
const ownerB = { id: 'reminderqa00002', username: 'reminder_b', name: 'Bình' };
const preferenceKey = (id: string): string => 'mealplan.workout-reminder.v1:' + id;
const profile = {
  onboarding_completed: 1,
  notif_morning: 1,
  notif_lunch: 0,
  notif_evening: 0,
  notif_weekly: 1,
} as UserProfile;
const workout = (day: number): TrainingPlanDayWithExercises =>
  ({
    day_of_week: day,
    is_rest_day: 0,
    exercises: [{ id: 'planned' }],
  }) as TrainingPlanDayWithExercises;
const plan = (...days: TrainingPlanDayWithExercises[]): ActiveTrainingPlan =>
  ({ days }) as ActiveTrainingPlan;
type Scheduler = Pick<LocalNotifications, 'hasPermission' | 'sync' | 'reconcile'>;

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('ReminderCoordinator', () => {
  const account = signal<AccountIdentity | null>(ownerA);
  const currentProfile = signal<UserProfile | null>(profile);
  let coordinator: ReminderCoordinator;
  let notifications: jasmine.SpyObj<Scheduler>;
  let plans: jasmine.SpyObj<TrainingPlanRepository>;
  let createPlans: jasmine.Spy;

  beforeEach(() => {
    account.set(ownerA);
    currentProfile.set(profile);
    notifications = jasmine.createSpyObj<Scheduler>('LocalNotifications', [
      'hasPermission',
      'sync',
      'reconcile',
    ]);
    notifications.hasPermission.and.resolveTo(true);
    notifications.sync.and.resolveTo();
    notifications.reconcile.and.resolveTo();
    plans = jasmine.createSpyObj<TrainingPlanRepository>('TrainingPlanRepository', [
      'getActivePlan',
    ]);
    plans.getActivePlan.and.resolveTo(null);
    createPlans = jasmine.createSpy('createPlans').and.returnValue(plans);
    TestBed.configureTestingModule({
      providers: [
        { provide: AccountSession, useValue: { required: true, current: account } },
        { provide: ProfileStore, useValue: { profile: currentProfile } },
        { provide: LocalNotifications, useValue: notifications },
        { provide: TrainingPlanRepository, useFactory: createPlans },
      ],
    });
    coordinator = TestBed.inject(ReminderCoordinator);
  });

  afterEach(() => {
    localStorage.removeItem(preferenceKey(ownerA.id));
    localStorage.removeItem(preferenceKey(ownerB.id));
  });

  it('keeps opt-in isolated per native owner and persists it on the device', () => {
    expect(coordinator.workoutEnabled()).toBeFalse();
    coordinator.setWorkoutEnabled(true);
    expect(coordinator.workoutEnabled()).toBeTrue();
    expect(
      TestBed.runInInjectionContext(() => new ReminderCoordinator()).workoutEnabled(),
    ).toBeTrue();

    account.set(ownerB);
    expect(coordinator.workoutEnabled()).toBeFalse();
    coordinator.setWorkoutEnabled(false);
    account.set(null);
    coordinator.setWorkoutEnabled(true);
    expect(coordinator.workoutEnabled()).toBeFalse();

    account.set(ownerA);
    expect(coordinator.workoutEnabled()).toBeTrue();
    coordinator.setWorkoutEnabled(false);
    expect(coordinator.workoutEnabled()).toBeFalse();
  });

  it('uses only distinct training days containing exercises and keeps meal and weekly flags', async () => {
    coordinator.setWorkoutEnabled(true);
    plans.getActivePlan.and.resolveTo(
      plan(
        workout(6),
        workout(0),
        workout(6),
        { ...workout(2), is_rest_day: 1 },
        { ...workout(3), exercises: [] },
        workout(-1),
        workout(7),
        workout(1.5),
      ),
    );

    await coordinator.refresh(true);

    expect(notifications.hasPermission).not.toHaveBeenCalled();
    const [input, current] = notifications.reconcile.calls.mostRecent().args;
    expect(current?.()).toBeTrue();
    expect(input.days.length).toBe(8);
    expect(webReminderPlan(input).notifications.map((n) => n.id)).toEqual([101, 104, 151, 157]);
  });

  it('does not initialize training data when disabled, signed out, missing a profile, or denied', async () => {
    await coordinator.refresh(true);
    coordinator.setWorkoutEnabled(true);
    await coordinator.refresh(false);
    currentProfile.set(null);
    await coordinator.refresh(true);
    currentProfile.set(profile);
    account.set(null);
    await coordinator.refresh();

    expect(createPlans).not.toHaveBeenCalled();
    expect(notifications.hasPermission).not.toHaveBeenCalled();
    expect(notifications.sync.calls.allArgs().map((args) => args.slice(0, 2))).toEqual([
      [notificationFlags(null), []],
      [notificationFlags(null), []],
    ]);
    expect(notifications.reconcile.calls.allArgs().map(([input]) => input.granted)).toEqual([
      true,
      false,
    ]);
  });

  it('preserves meal flags when there is no active plan', async () => {
    coordinator.setWorkoutEnabled(true);
    await coordinator.refresh();

    expect(notifications.hasPermission).toHaveBeenCalledOnceWith();
    expect(plans.getActivePlan).toHaveBeenCalledOnceWith();
    expect(
      webReminderPlan(notifications.reconcile.calls.mostRecent().args[0]).notifications.map(
        (n) => n.id,
      ),
    ).toEqual([101, 104]);
  });

  it('ignores an earlier permission result when a newer same-owner request denies scheduling', async () => {
    const permission = deferred<boolean>();
    notifications.hasPermission.and.returnValue(permission.promise);
    coordinator.setWorkoutEnabled(true);
    const earlier = coordinator.refresh();
    await coordinator.refresh(false);
    permission.resolve(true);
    await earlier;

    expect(createPlans).not.toHaveBeenCalled();
    expect(notifications.reconcile.calls.count()).toBe(1);
    expect(notifications.reconcile.calls.mostRecent().args[0].granted).toBeFalse();
  });

  it('discards a pending plan result when the account changes', async () => {
    coordinator.setWorkoutEnabled(true);
    const queued = deferred<ActiveTrainingPlan | null>();
    plans.getActivePlan.and.returnValue(queued.promise);
    const earlier = coordinator.refresh(true);
    expect(plans.getActivePlan).toHaveBeenCalledOnceWith();

    account.set(ownerB);
    await coordinator.refresh(true);
    queued.resolve(plan(workout(3)));
    await earlier;

    expect(notifications.reconcile.calls.count()).toBe(1);
    expect(notifications.reconcile.calls.mostRecent().args[0].days).toEqual([]);
    expect(notifications.reconcile.calls.mostRecent().args[0].workoutEnabled).toBeFalse();
  });

  it('invalidates requests before sign-out and ignores refresh while alarms are being cleared', async () => {
    const permission = deferred<boolean>();
    const cancel = deferred<void>();
    notifications.hasPermission.and.returnValue(permission.promise);
    notifications.sync.and.returnValue(cancel.promise);
    coordinator.setWorkoutEnabled(true);
    const earlier = coordinator.refresh();
    const clear = coordinator.clear();
    const concurrent = coordinator.refresh(true);
    permission.resolve(true);
    await earlier;
    cancel.resolve();
    await Promise.all([clear, concurrent]);

    expect(createPlans).not.toHaveBeenCalled();
    expect(notifications.sync).toHaveBeenCalledTimes(1);
    expect(notifications.reconcile).not.toHaveBeenCalled();
    expect(notifications.sync.calls.mostRecent().args[0]).toEqual(notificationFlags(null));
    expect(coordinator.workoutEnabled()).toBeTrue();
  });
});
