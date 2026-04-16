import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, calendarOutline, restaurantOutline, barbellOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="dashboard">
          <ion-icon name="home-outline" aria-hidden="true" />
          <ion-label>Tổng quan</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="calendar">
          <ion-icon name="calendar-outline" aria-hidden="true" />
          <ion-label>Lịch ăn</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="management">
          <ion-icon name="restaurant-outline" aria-hidden="true" />
          <ion-label>Quản lý</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="fitness">
          <ion-icon name="barbell-outline" aria-hidden="true" />
          <ion-label>Tập luyện</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  styles: [
    `
      ion-tab-bar {
        --background: var(--ion-tab-bar-background);
        --color: var(--ion-tab-bar-color);
        --color-selected: var(--ion-tab-bar-color-selected);
      }
    `,
  ],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  constructor() {
    addIcons({ homeOutline, calendarOutline, restaurantOutline, barbellOutline });
  }
}
