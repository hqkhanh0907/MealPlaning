import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { AiOfflineBanner } from './ai-offline-banner';
import { NetworkStore } from '../../../core/stores/network.store';

describe('AiOfflineBanner', () => {
  let fixture: ComponentFixture<AiOfflineBanner>;
  const onlineSig = signal(true);

  beforeEach(async () => {
    onlineSig.set(true);
    const fakeStore = { online: onlineSig } as unknown as NetworkStore;

    await TestBed.configureTestingModule({
      imports: [AiOfflineBanner],
      providers: [{ provide: NetworkStore, useValue: fakeStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AiOfflineBanner);
    fixture.detectChanges();
  });

  it('renders nothing when online', () => {
    expect(fixture.nativeElement.querySelector('.ai-offline-banner')).toBeNull();
  });

  it('renders banner with Vietnamese text when offline', () => {
    onlineSig.set(false);
    fixture.detectChanges();
    const banner = fixture.nativeElement.querySelector('.ai-offline-banner');
    expect(banner).not.toBeNull();
    expect(banner.textContent).toContain('Cần kết nối mạng để dùng AI');
  });

  it('toggles back to hidden when going online again', () => {
    onlineSig.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ai-offline-banner')).not.toBeNull();
    onlineSig.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ai-offline-banner')).toBeNull();
  });
});
