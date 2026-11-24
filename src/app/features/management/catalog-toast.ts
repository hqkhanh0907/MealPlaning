import type { ToastController } from '@ionic/angular/standalone';

export async function presentCatalogToast(
  controller: ToastController,
  message: string,
): Promise<void> {
  const toast = await controller.create({
    message,
    duration: 2400,
    position: 'bottom',
    color: 'medium',
  });
  await toast.present();
}
