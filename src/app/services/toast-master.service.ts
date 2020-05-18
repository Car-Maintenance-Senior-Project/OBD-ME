/** Simple toast service to keep these blocks of code from cluttering all the other code. */
import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class ToastMasterService {
  constructor(public toastController: ToastController) { }

  private defaultTime = 4000;

  /**
   * Connected message
   */
  async connectedMessage() {
    const toast = await this.toastController.create({
      message: 'You have connected to bluetooth.',
      duration: this.defaultTime,
    });
    toast.present();
  }

  /**
   * Connects to Bluetooth
   */
  async notConnectedMessage() {
    const toast = await this.toastController.create({
      message: 'Please connect to bluetooth in settings.',
      duration: this.defaultTime,
    });
    toast.present();
  }

  /**
   * Disconnects from Bluetooth
   */
  async notDisconnectedMessage() {
    const toast = await this.toastController.create({
      message: 'Can\'t disconnect from bluetooth.',
      duration: this.defaultTime,
    });
    toast.present();
  }

  /**
   * Errors message
   * @param msg - Message to be displayed
   */
  async errorMessage(msg: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: this.defaultTime,
    });
    toast.present();
  }

  /**
   * Fields not filled
   */
  async fieldsNotFilled() {
    const toast = await this.toastController.create({
      message: 'Type, date, and cost fields required',
      duration: 3000,
      animated: true,
      position: 'bottom',
    });
    toast.present();
  }
}
