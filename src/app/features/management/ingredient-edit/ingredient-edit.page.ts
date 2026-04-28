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
  selector: 'app-ingredient-edit',
  templateUrl: './ingredient-edit.page.html',
  styleUrl: './ingredient-edit.page.scss',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonBackButton],
})
export default class IngredientEditPage {}
