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

    });
  }

  runATCodes() {
    //ATZ
  }

  getDeviceList(): Device[] {
    return this.devices;
  }

  getPaired(): Promise<string> {
    return new Promise((resolve) => {
      this.devices = [];
      this.blueSerial.list().then(
        deviceList => {
          deviceList.forEach(device => {
            this.devices.push({ "name": device.name, "id": device.id, "rssi": device.class });
          });
          // console.log(this.devices);
          resolve('Ok');
        }
      );
    });
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

  writeThenRead(callData: string): Promise<string> {
    return new Promise((promSucsess, promReject) => {
      this.isConnected().then(isConnect => {
        if (isConnect) {
          this.blueSerial.write(callData).then(sucsess => {
            this.blueSerial.subscribe('49 01 ').subscribe(event => {
              this.blueSerial.readUntil('\r\r').then(data => {
                // this.toast.errorMessage(data);
                // this.blueSerial.readUntil('01').then(data => {
                //   // this.toast.errorMessage(data);
                // });
                promSucsess(this.parseHex(data, 'string'));
              });
            });
            // this.blueSerial.subscribeRawData().subscribe(event2 => {
            //   this.blueSerial.read().then(data2 => {
            //     console.log(data2);
            //   });
            // });

            this.blueSerial.subscribe('NO DATA\r\r').subscribe(event => {
              promReject('NO DATA');
            });

          }, failure => {
            this.toast.errorMessage('Couldnt write data!');
            promReject('Couldnt write');
          });
        } else {
          this.toast.connectToBluetooth();
          promReject('Not connected to bluetooth');
        }
      });
    });
  }

  //Format data group code ammount of messages recieved \r
  //Parse data idk
    //Parse to string
    //parse to number
    //parse bitwise
  parseHex(data: string, type: string): string {
    let split = data.split('\r');
    split.forEach((section, index) => {
      if (section.indexOf(':') === 1) {
        split[index] = section.slice(3);
      }
    });
    let hexArray = split.join('').trim().split(' ');
    if (type === 'string') {
      return this.hexToString(hexArray);
    }
  }

  hexToString(hexArray: string[]): string {
    let finalArray = [];
    hexArray.forEach((data, index) => {
      finalArray[index] = String.fromCharCode(parseInt(data, 16));
      if (finalArray[index] === '\u0001') {
        finalArray[index] = '';
      }
    });
    return finalArray.join('');
  }

}
