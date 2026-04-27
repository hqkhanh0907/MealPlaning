import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { FormFieldComponent } from './form-field.component';
import type { FormError } from '../types';

@Component({
  standalone: true,
  imports: [FormFieldComponent],
  template: `
    <app-form-field
      [label]="label()"
      [inputId]="inputId()"
      [invalid]="invalid()"
      [errorMessage]="errorMessage()"
      [error]="error()"
    >
      <input id="t-input" class="input-native" />
    </app-form-field>
  `,
})
class HostComponent {
  readonly label = signal('Tên nguyên liệu');
  readonly inputId = signal('t-input');
  readonly invalid = signal(false);
  readonly errorMessage = signal('');
  readonly error = signal<FormError | null>(null);
}

describe('FormFieldComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('projects the input element into the wrapper', () => {
    const input = fixture.debugElement.query(By.css('.input-wrapper input'));
    expect(input).not.toBeNull();
    expect(input.attributes['id']).toBe('t-input');
  });

  it('renders the label with the matching for attribute', () => {
    const label = fixture.debugElement.query(By.css('.input-label'));
    expect(label.nativeElement.textContent.trim()).toBe('Tên nguyên liệu');
    expect(label.attributes['for']).toBe('t-input');
  });

  it('hides the label when label() is empty', () => {
    host.label.set('');
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.input-label'))).toBeNull();
  });

  it('toggles invalid class in boolean mode', () => {
    host.invalid.set(true);
    fixture.detectChanges();
    const wrap = fixture.debugElement.query(By.css('.input-wrapper'));
    expect(wrap.nativeElement.classList.contains('invalid')).toBe(true);
  });

  it('shows boolean errorMessage only when invalid is true', () => {
    host.errorMessage.set('Vui lòng nhập');
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.field-error'))).toBeNull();

    host.invalid.set(true);
    fixture.detectChanges();
    const err = fixture.debugElement.query(By.css('.field-error'));
    expect(err.nativeElement.textContent.trim()).toBe('Vui lòng nhập');
  });

  it('error-object mode takes precedence over boolean mode', () => {
    host.invalid.set(true);
    host.errorMessage.set('Boolean message');
    host.error.set({ kind: 'required', message: 'Object message' });
    fixture.detectChanges();
    const err = fixture.debugElement.query(By.css('.field-error'));
    expect(err.nativeElement.textContent.trim()).toBe('Object message');
  });

  it('marks invalid when error object is present even if invalid=false', () => {
    host.invalid.set(false);
    host.error.set({ kind: 'required', message: 'Bắt buộc' });
    fixture.detectChanges();
    const wrap = fixture.debugElement.query(By.css('.input-wrapper'));
    expect(wrap.nativeElement.classList.contains('invalid')).toBe(true);
  });
});
