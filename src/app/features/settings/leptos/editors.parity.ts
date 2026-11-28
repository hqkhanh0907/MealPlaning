import { Location } from '@angular/common';
import { signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { AccountSession } from '../../../core/account/account-session';
import { ProfileStore } from '../../../core/stores/profile.store';
import { LocalDay } from '../../../core/stores/local-day';
import NameEdit from '../name-edit/name-edit.page';
import BodyEdit from '../body-edit/body-edit.page';
import ActivityEdit from '../activity-edit/activity-edit.page';
import GoalsEdit from '../goals-edit/goals-edit.page';
import { loadSettingsPage } from './settings-renderer';
import { profile, frame } from './settings.fixture';

const originals = { name: NameEdit, body: BodyEdit, goals: GoalsEdit, activity: ActivityEdit };
type Kind = keyof typeof originals;
const clean = (s: string | null) => s?.trim().replace(/\s+/g, ' ');
function visible(root: HTMLElement) {
  const list = (q: string) => Array.from(root.querySelectorAll<HTMLElement>(q));
  return {
    labels: list(
      'h2,h3,.input-label,legend,.section-caption,.form-hint,.field-error,.preview-hint,.estimate-note,details>summary,dt,dd,.preview-label,.preview-value,.goal-button__label',
    ).map((el) => clean(el.textContent)),
    inputs: list('input').map((el) => {
      const i = el as HTMLInputElement;
      return [
        i.id,
        i.value,
        i.type,
        i.min,
        i.max,
        i.getAttribute('aria-invalid'),
        i.getAttribute('aria-describedby'),
      ];
    }),
    save: list('ion-footer ion-button').map((el) => [
      (el as HTMLButtonElement).disabled,
      clean(el.textContent),
    ]),
  };
}
for (const kind of Object.keys(originals) as Kind[]) {
  describe('Settings ' + kind, () => {
    it('matches the old form, calculations and saved payload', async () => {
      const original = originals[kind] as Type<unknown>,
        next = await loadSettingsPage(kind);
      expect(next).not.toBe(original);
      const data = signal({ ...profile }),
        owner = signal({ id: 'owner', name: 'An', username: 'an' });
      const update = jasmine.createSpy('updateProfile').and.resolveTo(),
        rename = jasmine.createSpy('updateName').and.resolveTo();
      await TestBed.configureTestingModule({
        imports: [original, next],
        providers: [
          provideRouter([]),
          provideIonicAngular(),
          { provide: ProfileStore, useValue: { profile: data, updateProfile: update } },
          { provide: AccountSession, useValue: { current: owner, updateName: rename } },
          { provide: ActivatedRoute, useValue: { snapshot: { routeConfig: { path: kind } } } },
        ],
      }).compileComponents();
      spyOn(TestBed.inject(Location), 'back');
      spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
      TestBed.inject(LocalDay).iso.set('2026-11-28');
      const a = TestBed.createComponent(original),
        b = TestBed.createComponent(next),
        roots: HTMLElement[] = [a.nativeElement, b.nativeElement];
      const sync = async () => {
        a.detectChanges();
        b.detectChanges();
        await frame();
        await frame();
        expect(visible(roots[1])).toEqual(visible(roots[0]));
      };
      const input = async (q: string, v: string) => {
        for (const r of roots) {
          const e = r.querySelector<HTMLInputElement>(q)!;
          e.value = v;
          e.dispatchEvent(new Event('input', { bubbles: true }));
        }
        await sync();
      };
      const tap = async (q: string) => {
        for (const r of roots) r.querySelector<HTMLElement>(q)!.click();
        await sync();
      };
      await sync();
      switch (kind) {
        case 'name':
          await input('#settings-full-name', '  ');
          await tap('ion-footer ion-button');
          await input('#settings-full-name', 'Bình Nguyễn');
          await tap('ion-footer ion-button');
          expect(rename.calls.allArgs()).toEqual([['Bình Nguyễn'], ['Bình Nguyễn']]);
          break;
        case 'body':
          await input('#body-field-height', '0');
          await input('#body-field-height', '172.5');
          await input('#body-field-birth-date', '1996-02-28');
          await tap('ion-footer ion-button');
          break;
        case 'goals':
          await input('#goals-field-calo', '700');
          await input('#goals-field-calo', '1100');
          await input('#goals-field-protein', '');
          await input('#goals-field-carbs', '0');
          await tap('[role=radio]:last-child');
          await tap('ion-footer ion-button');
          break;
        case 'activity':
          for (const r of roots)
            r.querySelector('ion-radio-group')?.dispatchEvent(
              new CustomEvent('ionChange', { bubbles: true, detail: { value: 1.725 } }),
            );
          await sync();
          await tap('ion-footer ion-button');
          break;
      }
      if (kind !== 'name') {
        expect(update.calls.count()).toBe(2);
        expect(update.calls.argsFor(0)).toEqual(update.calls.argsFor(1));
      }
      a.destroy();
      b.destroy();
    });
  });
}
