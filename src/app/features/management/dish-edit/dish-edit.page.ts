import { Component } from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-dish-edit',
  templateUrl: './dish-edit.page.html',
  styleUrl: './dish-edit.page.scss',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonBackButton],
})
export default class DishEditPage {}
