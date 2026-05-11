import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DishContextMenuModal } from './dish-context-menu-modal';

describe('DishContextMenuModal', () => {
  let fixture: ComponentFixture<DishContextMenuModal>;
  let component: DishContextMenuModal;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DishContextMenuModal],
    }).compileComponents();

    fixture = TestBed.createComponent(DishContextMenuModal);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('dishName', 'Phở bò');
  });

  it('does not render sheet when isOpen=false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sheet')).toBeNull();
  });

  it('renders dishName in header when open', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.sheet-title') as HTMLElement | null;
    expect(title?.textContent?.trim()).toBe('Phở bò');
  });

  it('emits actionSelected with copy/move/delete on each action button', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    const emitted: string[] = [];
    component.actionSelected.subscribe((a) => emitted.push(a));

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.sheet-action'),
    ) as HTMLButtonElement[];
    expect(buttons.length).toBe(3);
    buttons[0].click();
    buttons[1].click();
    buttons[2].click();
    expect(emitted).toEqual(['copy', 'move', 'delete']);
  });

  it('emits dismissed on backdrop click and on cancel button', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    let dismissCount = 0;
    component.dismissed.subscribe(() => dismissCount++);

    const cancel = fixture.nativeElement.querySelector('.sheet-cancel') as HTMLButtonElement;
    cancel.click();
    const backdrop = fixture.nativeElement.querySelector(
      '.sheet-backdrop__dismiss',
    ) as HTMLButtonElement;
    backdrop.click();
    expect(dismissCount).toBe(2);
  });

  it('does not dismiss when clicking inside sheet', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    let dismissCount = 0;
    component.dismissed.subscribe(() => dismissCount++);
    (fixture.nativeElement.querySelector('.sheet') as HTMLElement).click();
    expect(dismissCount).toBe(0);
  });
});
