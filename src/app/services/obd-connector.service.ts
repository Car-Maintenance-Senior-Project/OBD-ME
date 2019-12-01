import { NgZone, Injectable } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { Storage } from '@ionic/storage';
import { LoadingController } from '@ionic/angular';
import { ToastMasterService } from '../services/toast-master.service';

import { Device } from '../interfaces/device-struct'; 

@Injectable({
  providedIn: 'root'
})
export class OBDConnectorService {

  constructor(private ngZone: NgZone, private blueSerial: BluetoothSerial, private store: Storage, private loader: LoadingController, private toast: ToastMasterService) { }

  private macAddress: string;
  private devices: Device[];
  public processing: boolean;
  private started: boolean = false;
  private loading: HTMLIonLoadingElement;


  onStartUp(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.started) {
        this.started = true;
        this.getPaired();
        this.store.get('storedMac').then(data => {
          if (data != null) {
            this.Connect(data).then(sucsess => {
              resolve(true);
            }, fail => {
              resolve(false);
            });
          } else {
            resolve(false);
          }
        });
      } else {
        reject(true);
      }
    });
  }

  Connect(MacAddress: string): Promise<string> {
    //disconnect
    //Connect and save the new mac
    //run useful AT codes
    return new Promise((resolve, reject) => {
      this.loader.create({
        message: 'Connecting to bluetooth'
      }).then(overlay => {
        this.loading = overlay;
        this.loading.present();
      });

        this.blueSerial.disconnect().then(suc => {
          this.store.set('storedMac', MacAddress);

          this.blueSerial.connect(MacAddress).subscribe(sucsess => {
            this.runATCodes();
            this.loading.dismiss();
            this.toast.connectedMessage();
            resolve('Was able to connect!');
          }, rejected => {
            this.loading.dismiss();
            this.toast.connectToBluetooth();
            reject('Wasnt able to connect!');
          });

        }, rej => {
          this.loading.dismiss();
          this.toast.disconnectFromBluetooth();
          reject('Couldnt disconnect from bluetooth!');
        });

    });
  }

  runATCodes(){
    //ATZ
  }

  getDeviceList(): Device[] {
    return this.devices;
  }

  getPaired() {
    this.devices = [];
    this.blueSerial.list().then(
      deviceList => {
        deviceList.forEach(device => {
          this.devices.push({"name" : device.name, "id" : device.id, "rssi" : device.class});
        });
        console.log(this.devices);
      }
    );
  }

  //Change to promise
  isConnected(): Promise<boolean> {
    return new Promise((resolve) => {
      this.blueSerial.isConnected().then(
        is => { resolve(true); },
        not => { resolve(false); }
      );
    });
  }

  read() {
    //Eh, may be useful later
  }

  write() {
    //Given data write it
  }

  writeThenRead(callData: string) {
    this.isConnected().then( isConnect => {
      if (isConnect) {
        this.blueSerial.write(callData).then(sucsess => {
          this.blueSerial.subscribe('01').subscribe( event => {
            this.blueSerial.read().then( data => {
              this.toast.errorMessage(data);
              this.blueSerial.readUntil('01').then(data => {
                this.toast.errorMessage(data);
              });
            });
          });
        }, failure => {
          this.toast.errorMessage('Couldnt write data!');
        })
      } else {
        this.toast.connectToBluetooth();
      }
    });
  }

  //Format data group code ammount of messages recieved \r
  //Parse data idk


}
