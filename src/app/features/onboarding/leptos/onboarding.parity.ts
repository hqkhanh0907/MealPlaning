import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDownOutline } from 'ionicons/icons';
import type { UserProfile } from '../../../core/models/user-profile.model';
import { LocalDay } from '../../../core/stores/local-day';
import { ProfileStore } from '../../../core/stores/profile.store';
import OnboardingPage from '../onboarding.page';
import LeptosOnboardingPage from './onboarding.page';

type Profile = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
interface Handle {
  back(): boolean;
  setDay(iso: string): void;
  free(): void;
}
interface Module {
  default(): Promise<void>;
  mountOnboarding(host: HTMLElement, date: string, save: (p: Profile) => Promise<void>): Handle;
}
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function snapshot(root: HTMLElement) {
  const all = (q: string) => Array.from(root.querySelectorAll<HTMLElement>(q));
  const clean = (el: HTMLElement) => el.textContent?.replace(/\s+/g, ' ').trim();
  return {
    progress: root.querySelector('ion-progress-bar')?.value,
    heading: all('h1').map(clean),
    labels: all('.radio-label, .input-label, .gender-options label').map(clean),
    selected: all('[role=radio]').map(
      (el) => el.getAttribute('aria-checked') ?? (el as HTMLInputElement).checked,
    ),
    buttons: all('[data-testid^=onb-step]').map((el) => [
      clean(el),
      (el as HTMLButtonElement).disabled,
    ]),
    fields: all('.input-native').map((el) => {
      const field = el as HTMLInputElement;
      return [
        field.id,
        field.value,
        field.min,
        field.max,
        field.getAttribute('aria-invalid'),
        field.getAttribute('aria-describedby'),
      ];
    }),
    errors: all('[role=alert]').map(clean),
    status: all('[role=status],#field-age-hint,.date-display').map(clean),
  };
}

describe('Onboarding Angular and Leptos', () => {
  let wasm: Module;
  beforeAll(async () => {
    addIcons({ chevronDownOutline });
    const url = new URL('assets/leptos/healthmate_dashboard.js', document.baseURI);
    wasm = await import(/* webpackIgnore: true */ /* @vite-ignore */ url.href);
    await wasm.default();
    expect(typeof wasm.mountOnboarding).toBe('function');
  });

  it('uses the production host, local calendar day and one pending store write', async () => {
    let finish!: () => void;
    const save = jasmine
      .createSpy('saveOnboardingProfile')
      .and.callFake(() => new Promise<void>((resolve) => (finish = resolve)));
    await TestBed.configureTestingModule({
      imports: [LeptosOnboardingPage],
      providers: [
        provideRouter([]),
        provideIonicAngular(),
        { provide: ProfileStore, useValue: { saveOnboardingProfile: save } },
      ],
    }).compileComponents();
    const day = TestBed.inject(LocalDay);
    day.iso.set('2026-02-27');
    const nav = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    const fixture = TestBed.createComponent(LeptosOnboardingPage);
    fixture.detectChanges();
    await fixture.whenStable();
    await wait();
    const root: HTMLElement = fixture.nativeElement;
    const click = async (q: string) => {
      root.querySelector<HTMLElement>(q)!.click();
      await wait();
    };
    expect(root.querySelector('app-onboarding')).toBeNull();
    root
      .querySelector<HTMLElement>('[role=radio]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    await wait();
    await click('[data-testid=onb-step1-continue]');
    expect(document.activeElement).toBe(root.querySelector('h1'));
    for (const [q, value] of [
      ['#field-height', '164'],
      ['#field-weight', '60'],
      ['#field-birth-date', '2008-02-29'],
    ]) {
      const field = root.querySelector<HTMLInputElement>(q)!;
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
    }
    await click('input[value=male]');
    expect(root.querySelector('#field-age-hint')?.textContent).toContain('17 tuổi');
    day.iso.set('2026-02-28');
    fixture.detectChanges();
    await wait();
    expect(root.querySelector('#field-age-hint')?.textContent).toContain('18 tuổi');
    await click('[data-testid=onb-step2-continue]');
    await click('[aria-label="Mức vận động"] [role=radio]');
    await click('[aria-label="Kinh nghiệm tập gym"] [role=radio]');
    const button = root.querySelector<HTMLElement>('[data-testid=onb-step3-finish]')!;
    button.click();
    button.click();
    await wait();
    expect(save).toHaveBeenCalledTimes(1);
    expect(button.textContent).toContain('Đang lưu');
    expect(nav).not.toHaveBeenCalled();
    finish();
    await fixture.whenStable();
    expect(nav).toHaveBeenCalledOnceWith('/', { replaceUrl: true });
    fixture.destroy();
  });

  for (const date of [
    '1992-02-29',
    '2008-11-28',
    '2007-11-28',
    '2016-11-28',
    '1906-11-28',
    '1947-11-28',
    '1948-11-28',
  ]) {
    it('matches visible wizard and saved values for ' + date, async () => {
      const legacyWrites: Profile[] = [],
        rustWrites: Profile[] = [];
      const rejectsFirst = (writes: Profile[]) => async (profile: Profile) => {
        writes.push(profile);
        if (writes.length === 1) throw new Error('test write failed');
      };
      await TestBed.configureTestingModule({
        imports: [OnboardingPage],
        providers: [
          provideRouter([]),
          provideIonicAngular(),
          {
            provide: ProfileStore,
            useValue: { saveOnboardingProfile: rejectsFirst(legacyWrites) },
          },
        ],
      }).compileComponents();
      TestBed.inject(LocalDay).iso.set('2026-11-28');
      spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
      const fixture = TestBed.createComponent(OnboardingPage);
      fixture.detectChanges();
      const legacy: HTMLElement = fixture.nativeElement;
      const rust = document.createElement('form');
      document.body.append(rust);
      const wizard = wasm.mountOnboarding(rust, '2026-11-28', rejectsFirst(rustWrites));
      const compare = async () => {
        fixture.detectChanges();
        await wait();
        fixture.detectChanges();
        expect(snapshot(rust)).toEqual(snapshot(legacy));
      };
      const click = async (selector: string) => {
        for (const root of [legacy, rust]) root.querySelector<HTMLElement>(selector)!.click();
        await compare();
      };
      const input = async (selector: string, value: string) => {
        for (const root of [legacy, rust]) {
          const field = root.querySelector<HTMLInputElement>(selector)!;
          field.value = value;
          field.dispatchEvent(new Event('input', { bubbles: true }));
        }
        await compare();
      };
      try {
        await compare();
        await click('[role=radio]:nth-child(2)');
        await click('[data-testid=onb-step1-continue]');
        for (const root of [legacy, rust]) {
          root.querySelector('#field-birth-date')!.dispatchEvent(new Event('blur'));
        }
        await compare();
        expect(rust.querySelector('#err-birth-date')?.textContent).toContain('nhập ngày sinh');
        await input('#field-height', '0');
        await input('#field-weight', '75.5');
        await input('#field-birth-date', '2999-01-01');
        await click('input[value=female]');
        await click('[data-testid=onb-step2-continue]');
        expect(rust.querySelector('#err-height')).not.toBeNull();
        expect(rust.querySelector('#err-birth-date')).not.toBeNull();
        await input('#field-height', '170.5');
        await input('#field-birth-date', '0001-02-01');
        await input('#field-birth-date', date);
        await click('[data-testid=onb-step2-continue]');
        await click('[aria-label="Mức vận động"] [role=radio]:nth-child(2)');
        await click('[aria-label="Kinh nghiệm tập gym"] [role=radio]:nth-child(3)');
        await click('[data-testid=onb-step3-back]');
        await click('[data-testid=onb-step2-continue]');
        await click('[data-testid=onb-step3-finish]');
        expect(rust.querySelector('.error-toast')?.textContent).toContain('Lưu thất bại');
        await click('[data-testid=onb-step3-finish]');
        expect(rustWrites).toEqual(legacyWrites);
        expect(rustWrites.length).toBe(2);
        expect(rustWrites[1].target_fat).toBeNull();
      } finally {
        wizard.free();
        rust.remove();
        fixture.componentInstance.ionViewWillLeave();
        fixture.destroy();
      }
    });
  }
});
