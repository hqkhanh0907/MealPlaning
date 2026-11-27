import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barbellOutline, calendarOutline, libraryOutline, timeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-workout-tabs',
  templateUrl: './workout-tabs.html',
  styleUrl: './workout-tabs.scss',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class WorkoutTabs {
  constructor() {
    addIcons({ barbellOutline, calendarOutline, libraryOutline, timeOutline });
  }
}
