import { Component, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { settingsOutline } from 'ionicons/icons';

@Component({
  selector: 'app-fitness',
  templateUrl: './fitness.page.html',
  styleUrl: './fitness.page.scss',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon],
})
export default class FitnessPage {
  private readonly router = inject(Router);

  constructor() {
    addIcons({ settingsOutline });
  }

  openSettings(): void {
    void this.router.navigate(['/settings']);
  }
}
