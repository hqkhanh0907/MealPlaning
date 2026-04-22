import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BottomSheetPickerComponent, PickerOption } from './bottom-sheet-picker.component';

const sampleOptions: PickerOption[] = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry', description: 'Small red fruit' },
];

describe('BottomSheetPickerComponent', () => {
  let fixture: ComponentFixture<BottomSheetPickerComponent>;
  let component: BottomSheetPickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomSheetPickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BottomSheetPickerComponent);
    component = fixture.componentInstance;
    component.title = 'Pick one';
    component.options = sampleOptions;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('is closed by default', () => {
    expect(component.isOpen()).toBeFalse();
  });

  it('opens and resets query', () => {
    component.query.set('foo');
    component.open();
    expect(component.isOpen()).toBeTrue();
    expect(component.query()).toBe('');
  });

  it('close() sets isOpen false', () => {
    component.open();
    component.close();
    expect(component.isOpen()).toBeFalse();
  });

  it('select emits valueChange and closes', () => {
    const captured: { value: string | null } = { value: null };
    component.valueChange.subscribe((v: string) => {
      captured.value = v;
    });
    component.open();
    component.select(sampleOptions[1]);
    expect(captured.value).toBe('b');
    expect(component.isOpen()).toBeFalse();
  });

  it('filteredOptions filters by query case-insensitively', () => {
    component.query.set('ba');
    expect(component.filteredOptions().map((o) => o.value)).toEqual(['b']);
    component.query.set('  ');
    expect(component.filteredOptions().length).toBe(3);
  });

  it('showSearch false by default when < 16 options', () => {
    expect(component.showSearch()).toBeFalse();
  });

  it('showSearch true when searchable is set', () => {
    component.searchable = true;
    expect(component.showSearch()).toBeTrue();
  });

  it('showSearch true when options >= 16', () => {
    const many: PickerOption[] = Array.from({ length: 16 }, (_, i) => ({
      value: `v${i}`,
      label: `Label ${i}`,
    }));
    component.options = many;
    expect(component.showSearch()).toBeTrue();
  });

  it('onSearch updates query signal', () => {
    const event = new CustomEvent('ionInput', { detail: { value: 'cher' } });
    component.onSearch(event);
    expect(component.query()).toBe('cher');
    expect(component.filteredOptions().map((o) => o.value)).toEqual(['c']);
  });

  it('onDismiss emits dismissed and closes', () => {
    const state = { dismissed: false };
    component.dismissed.subscribe(() => {
      state.dismissed = true;
    });
    component.open();
    component.onDismiss();
    expect(state.dismissed).toBeTrue();
    expect(component.isOpen()).toBeFalse();
  });

  it('handles null options gracefully', () => {
    component.options = null as unknown as PickerOption[];
    expect(component.filteredOptions()).toEqual([]);
  });
});
