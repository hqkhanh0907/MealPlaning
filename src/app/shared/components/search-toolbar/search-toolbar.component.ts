import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeCircleOutline, searchOutline } from 'ionicons/icons';

@Component({
  selector: 'app-search-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon],
  templateUrl: './search-toolbar.component.html',
  styleUrl: './search-toolbar.component.scss',
})
export class SearchToolbarComponent {
  @Input() query = '';
  @Input() placeholder = 'Tìm kiếm';
  @Input() ariaLabel = 'Thanh tìm kiếm';
  @Output() queryChange = new EventEmitter<string>();

  constructor() {
    addIcons({ searchOutline, closeCircleOutline });
  }

  onInput(value: string): void {
    this.queryChange.emit(value);
  }

  handleInput(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.onInput(value);
  }

  clear(): void {
    this.queryChange.emit('');
  }
}
