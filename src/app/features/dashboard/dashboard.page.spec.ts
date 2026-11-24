import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { CalendarStore, type PendingMealTarget } from '../../core/stores/calendar.store';
import { DashboardStore } from '../../core/stores/dashboard.store';
import { NetworkStore } from '../../core/stores/network.store';
import DashboardPage from './dashboard.page';

describe('DashboardPage pending meal link', () => {
  const target: PendingMealTarget = {
    date: '2026-11-24',
    mealType: 'lunch',
    plannedDishId: 'planned-lunch',
  };
  let router: jasmine.SpyObj<Router>;
  let pendingMealNavigation: CalendarStore['pendingMealNavigation'];
  let page: DashboardPage;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate'], { url: '/tabs/calendar' });
    router.navigate.and.resolveTo(true);
    pendingMealNavigation = signal(null);
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: CalendarStore, useValue: { pendingMealNavigation } },
        { provide: DashboardStore, useValue: {} },
        { provide: NetworkStore, useValue: {} },
        { provide: ToastController, useValue: {} },
      ],
    });
    page = TestBed.runInInjectionContext(() => new DashboardPage());
  });

  it('opens the pending meal through one router navigation on a primary click', async () => {
    const event = new MouseEvent('click', { cancelable: true });

    await page.openPendingMeal(event, target);

    expect(event.defaultPrevented).toBeTrue();
    expect(pendingMealNavigation()).toEqual(target);
    expect(router.navigate).toHaveBeenCalledOnceWith(['/tabs/calendar']);
  });

  it('leaves modified and auxiliary clicks to the browser', async () => {
    const options = [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { button: 1 }];
    for (const option of options) {
      const event = new MouseEvent('click', { ...option, cancelable: true });
      await page.openPendingMeal(event, target);
      expect(event.defaultPrevented).toBeFalse();
    }

    expect(pendingMealNavigation()).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
