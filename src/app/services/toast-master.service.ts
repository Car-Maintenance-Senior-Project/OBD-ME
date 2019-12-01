import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ToastMasterService {

  constructor(public toastController: ToastController) { }

  private defaultTime: number = 4000;

  async connectedMessage() {
    const toast = await this.toastController.create({
      message: 'You have connected to bluetooth.',
      duration: this.defaultTime
    });
    toast.present();
  }

  async connectToBluetooth() {
    const toast = await this.toastController.create({
      message: 'Please connect to bluetooth in settings.',
      duration: this.defaultTime
    });
    toast.present();
  }

  async disconnectFromBluetooth() {
    const toast = await this.toastController.create({
      message: 'Cant disconnect from bluetooth.',
      duration: this.defaultTime
    });
    toast.present();
  }

  async errorMessage(msg: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: this.defaultTime
    });
    toast.present();
  }
}
