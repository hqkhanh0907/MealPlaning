import { Component, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-onboarding',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Chào mừng</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding ion-text-center">
      <h1>HealthMate AI</h1>
      <p>Ứng dụng quản lý dinh dưỡng & tập luyện thông minh</p>
      <ion-button expand="block" (click)="completeOnboarding()"> Bắt đầu </ion-button>
    </ion-content>
  `,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
})
export default class OnboardingPage {
  private readonly router = inject(Router);

  completeOnboarding(): void {
    // TODO: Save onboarding complete status to database
    void this.router.navigate(['/']);
  }
}
