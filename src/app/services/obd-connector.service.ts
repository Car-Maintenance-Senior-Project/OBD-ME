/**
 * OBD connector service is a service that allows an app to connect, read, and write to and OBD scanner that is using
 * an ELM327 chip device (possibly others but havent tested).
 */

import { NgZone, Injectable } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { Storage } from '@ionic/storage';
import { LoadingController } from '@ionic/angular';
import { ToastMasterService } from '../services/toast-master.service';
import { VINParserService } from '../services/vinparser.service';

import { Device } from '../interfaces/device-struct';

import { ConnectResult } from '../enums/connect-result.enum';
import { PIDType } from '../enums/pidtype.enum';
import { StorageKeys } from '../classes/storage-keys';
import { PIDConstants } from '../classes/pidconstants';
import { CarProfile } from '../interfaces/car-profile';

// example of long hex 09023\r014 \r0: 49 02 01 57 42 41 \r1: 33 4E 35 43 35 35 46 \r2: 4B 34 38 34 35 34 39 \r\r
// example of short hex 09001\r49 00 55 40 00 00 \r\r

@Injectable({
  providedIn: 'root'
})

export class OBDConnectorService {

  /**
   * Creates an instance of obdconnector service.
   * @param ngZone - Imports NGZone
   * @param blueSerial - Imports the bluetooth serial class
   * @param store - Imports storage controller
   * @param loader - Imports loading screen controller
   * @param toast - Imports toast class
   */
  constructor(
    private ngZone: NgZone,
    private blueSerial: BluetoothSerial,
    private store: Storage,
    private loader: LoadingController,
    private toast: ToastMasterService,
    // private pids: PidsServiceService
    private vinParser: VINParserService
  ) { }


  private macAddress: string;
  private devices: Device[];
  public processing: boolean;
  private started = false;
  private loading: HTMLIonLoadingElement;
  public isConnected: boolean;
  private bluetoothEnabled: boolean;
  public currentProfile: CarProfile;

  // for now we're only supporting services 01, 02, 03, and 09
  private service1and2SupportedPIDs: boolean[];
  private service9SupportedPIDs: boolean[];


  /**
   * To be run when the app is started.
   * Connects to the bluetooth device if one is connected.
   * @returns Promise<boolean> when it finishes
   *    -Resolve if running for the first time and boolean if it connected or not
   *    -Reject if not running for the first time
   */
  onStartUp(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.getPaired();

      this.currentProfile = {
        vin: '',
        vinData: null,
        nickname: '-1',
        fuelEconomy: null
      };

      this.connect();
      // this.store.get('storedMac').then(data => {
      //   if (data != null) {
      //     this.connect(data).then(success => {
      //       resolve(true);
      //     }, fail => {
      //       resolve(false);
      //     });
      //   } else {
      //     resolve(false);
      //   }
      // });
      // });
    });
  }

  /**
   * Attempts to connect via bluetooth to the OBD
   * TODO: Run usefull AT codes
   * TODO: Get the PIDs that are supported
   * @param MacAddress - Mac address of the OBD to connect to
   * @returns Promise when it has tried to connect
   */
  connect(MACAddress?: string): Promise<ConnectResult> {
    return new Promise<ConnectResult>((resolve, reject) => {
      this.loader.create({
        message: 'Connecting to bluetooth'
      }).then(overlay => {
        this.loading = overlay;
        this.loading.present();
        // initialize conditions to false when a connection is attempted
        this.bluetoothEnabled = false;
        this.isConnected = false;
        this.currentProfile = {
          vin: '',
          vinData: null,
          nickname: '-1',
          fuelEconomy: null
        };

        this.blueSerial.isEnabled().then(enabled => {

          const connect = function () {
            if (MACAddress === '') {
              this.store.get(StorageKeys.LASTMAC).then(value => {
                if (value != null) {
                  MACAddress = value;
                } else {
                  this.loading.dismiss();
                  this.toast.notConnectedMessage();
                  reject(ConnectResult.NoGivenOrStoredMAC);
                }
              });
            }

            // TODO: no idea how this works....
            this.btSerial.connect(MACAddress).subscribe(success => {
              this.isConnected = true;
              this.callPID(PIDConstants.VIN, PIDType.String).then(vinRaw => {
                const parsedVin = this.vinParser.ParseVin(vinRaw);
                const allProfiles: CarProfile[] = this.store.get(StorageKeys.CARPROFILES);
                const profileSearch: CarProfile = allProfiles.find(profile => profile.vin === parsedVin);
                if (profileSearch) {
                  this.currentProfile = profileSearch;
                } else {
                  if (allProfiles.length === 0) {
                    this.currentProfile = {
                      vin: vinRaw,
                      vinData: parsedVin,
                      nickname: '1',
                      fuelEconomy: null
                    };
                  } else {
                    let newNick = '-1';
                    for (let i = 1; i < 1000; i++) {
                      if (allProfiles[i - 1].nickname !== i.toString()) {
                        newNick = i.toString();
                        break;
                      }
                      this.currentProfile = {
                        vin: vinRaw,
                        vinData: parsedVin,
                        nickname: newNick,
                        fuelEconomy: null
                      };
                    }
                  }
                  allProfiles.push(this.currentProfile);
                  this.store.set(StorageKeys.CARPROFILES, allProfiles);
                }
              });
              this.store.set(StorageKeys.LASTMAC, MACAddress);
              this.loading.dismiss();
              this.toast.connectedMessage();
              resolve(ConnectResult.Success);
            }, error => {
              this.isConnected = false;
              // TODO: show error connect failed or let caller handle that
              this.loading.dismiss();
              this.toast.notConnectedMessage();
              reject(ConnectResult.Failure);
            });
          };

          const disconnect = function () {
            this.btSerial.disconnect().then(connect, fail => {
              this.isConnected = false;
              // TODO: show error disconnect failed or let caller handle that
              this.loading.dismiss();
              this.toast.notDisconnectedMessage();
              reject(ConnectResult.DisconnectFail);
            });
          };

          this.bluetoothEnabled = true;
          this.blueSerial.isConnected().then(disconnect, connect);

        }, disabled => {
          this.bluetoothEnabled = false;
          this.isConnected = false;
          // TODO: show error Bluetooth disabled or let caller handle that
          this.loading.dismiss();
          this.toast.notConnectedMessage();
          reject(ConnectResult.BluetoothDisabledFail);
        });
        this.loading.dismiss();
        this.toast.errorMessage('Total Failure');
        reject(ConnectResult.Failure);
      });
    });
  }

  // runATCodes(): Promise<string> {
  //   return new Promise((promSuccess, promReject) => {
  //     this.isConnected().then(isConnect => {
  //       if (isConnect) {
  //         console.log('OBDMEDebug: Connector: isconnected');
  //         this.blueSerial.write('Z').then(success => {
  //           console.log('OBDMEDebug: Connector: write data');
  //           this.blueSerial.subscribe('\r\r').subscribe(data => {
  //             console.log('OBDMEDebug: Connector: EVENT: ' + data);
  //             if (data !== '') {
  //               console.log(data);
  //               // if (data === 'NO DATA\r\r') {
  //               if (data.includes('NO DATA')) {
  //                 console.log('OBDMEDebug: Connector: NO DATA');
  //                 // promReject('NO DATA');
  //                 promSuccess('NO DATA');
  //               } else if (data.includes('ELM327')) {
  //                 this.blueSerial.write('SP0').then(success => {
  //                   this.blueSerial.write('0100').then(success => {
  //                     console.log('OBDMEDebug: Connector: write data');
  //                     this.blueSerial.subscribe('\r\r').subscribe(data => {
  //                       console.log('OBDMEDebug: Connector: EVENT: ' + data);
  //                       if (data !== '') {
  //                         console.log(data);
  //                         // if (data === 'NO DATA\r\r') {
  //                         if (data.includes('NO DATA')) {
  //                           console.log('OBDMEDebug: Connector: NO DATA');
  //                           // promReject('NO DATA');
  //                           promSuccess('NO DATA');
  //                           // } else if (data.includes('ELM327')) {

  //                           //   promSuccess('OK');
  //                         } else {
  //                           promSuccess(data);
  //                         }
  //                       }
  //                     });
  //                   }, failure => {
  //                     this.toast.errorMessage('Couldnt write data!');
  //                     promReject('Couldnt write');
  //                   });
  //                 }, failure => {
  //                   this.toast.errorMessage('Couldnt write data!');
  //                   promReject('Couldnt write');
  //                 });
  //                 promSuccess('OK');
  //               } else {
  //                 promReject('No Response');
  //               }
  //             }
  //           });

  //         }, failure => {
  //           this.toast.errorMessage('Couldnt write data!');
  //           promReject('Couldnt write');
  //         });
  //       } else {
  //         console.log('OBDMEDebug: Connector: not connected');
  //         this.toast.connectToBluetooth();
  //         promReject('Not connected to bluetooth');
  //       }
  //     });
  //   });
  // }

  changeCurrentName(newName: string): void {
    this.currentProfile.nickname = newName;
    this.saveProfiles();
  }

  private saveProfiles(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.store.get(StorageKeys.CARPROFILES).then(allProfiles => {
        allProfiles.splice(allProfiles.findIndex(profile => profile.vin === this.currentProfile.vin), 1);
        allProfiles.push(this.currentProfile);
        this.store.set(StorageKeys.CARPROFILES, allProfiles);
      });
    });
  }


  /**
   * Gets device list
   * getPaired() to be run first
   * @returns device list - list of devices paired to device
   */
  getDeviceList(): Device[] {
    return this.devices;
  }

  /**
   * Gets paired devices on phone
   * @returns Promise when it has gotten all the devices
   */
  getPaired(): Promise<string> {
    return new Promise((resolve) => {
      this.devices = [];
      this.blueSerial.list().then(
        deviceList => {
          deviceList.forEach(device => {
            // tslint:disable-next-line: object-literal-key-quotes tslint:disable-next-line: quotemark
            this.devices.push({ "name": device.name, "id": device.id, "rssi": device.class });
          });
          resolve('Ok');
        }
      );
    });
  }


  /**
   * Returns if phone is connected.  For use outside of class for data hiding
   * @returns Promise with boolean if the phone is connected
   */
  isConnectedFun(): Promise<boolean> {
    return new Promise((resolve) => {
      this.blueSerial.isConnected().then(
        is => { resolve(true); },
        not => { resolve(false); }
      );
    });
  }

  // /**
  //  * Writes the given request to the OBD and then subscribes for a response from the OBD
  //  * @param callData - Data to be written to the OBD
  //  * @param type - What it should be parsed as
  //  * @returns Promise with the response or rejection
  //  * TODO: Mannage duplicats that also are more than one message long or set the OBD device to only listen to the main responder
  //  */
  // writeThenRead(callData: string, type: string): Promise<string> {
  //   console.log('OBDMEDebug: Connector: start');
  //   return new Promise((promSuccess, promReject) => {
  //     this.isConnected().then(isConnect => {
  //       if (isConnect) {
  //         console.log('OBDMEDebug: Connector: isconnected');
  //         this.blueSerial.write(callData).then(success => {
  //           console.log('OBDMEDebug: Connector: write data');
  //           this.blueSerial.subscribe('\r\r').subscribe(data => {
  //             console.log('OBDMEDebug: Connector: EVENT: ' + data);
  //             if (data !== '') {
  //               console.log(data);
  //               // if (data === 'NO DATA\r\r') {
  //               if (data.includes('NO DATA')) {
  //                 console.log('OBDMEDebug: Connector: NO DATA');
  //                 // promReject('NO DATA');
  //                 promSuccess('NO DATA');
  //               } else if (data.includes('OK')) {
  //                 promSuccess('OK');
  //               } else {
  //                 console.log('OBDMEDebug: Connector: HAS DATA');
  //                 const hexCall = '4' + callData[1] + ' ' + callData.slice(2, 4) + ' ';
  //                 if (data.includes(hexCall)) {
  //                   data = data.slice(data.indexOf(hexCall) + 6);
  //                   if (data.includes(hexCall)) {
  //                     data = data.slice(0, data.indexOf(hexCall));
  //                   }
  //                   console.log('OBDMEDebug: Connector: return: ' + data + 'and: ' + this.parseHex(data, type));
  //                   promSuccess(this.parseHex(data, type));
  //                 }
  //               }
  //             }
  //           });

  //         }, failure => {
  //           this.toast.errorMessage('Couldnt write data!');
  //           promReject('Couldnt write');
  //         });
  //       } else {
  //         console.log('OBDMEDebug: Connector: not connected');
  //         this.toast.connectToBluetooth();
  //         promReject('Not connected to bluetooth');
  //       }
  //     });
  //   });
  // }

  private writeThenRead(pid: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (this.bluetoothEnabled && this.isConnected) {
        this.blueSerial.write(pid).then(success => {
          this.blueSerial.readUntil('\r\r').then(receivedData => {
            resolve(receivedData);
          }, error => {
            // TODO: error message
            reject('Error on data read');
          });
        }, error => {
          // TODO: error message
          reject('Error on data write');
        });
      } else {
        // TODO: show error that call can't happen yet because connection isn't established
        reject('Proper connection not established');
      }
    });
  }

  callPID(pid: string, type: PIDType): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      // TODO: Get the supported pids to work.  Currently parsing seems to work fine, just doesnt check for them correctly
      if (this.pidSupported(parseInt(pid.charAt(1), 10), parseInt(pid.slice(2, 4), 10))) {
        this.writeThenRead(pid).then(data => {
          resolve(this.parseData(data, type));
        }, error => {
          reject(error);
        });
      } else {
        reject('PID not supported');
      }
    });
  }

  private parseData(data: string, type: PIDType): Promise<string> {
    return new Promise<string>((resolve) => {
      const split = data.split('\r');
      split.forEach((section, index) => {
        if (section.indexOf(':') === 1) {
          split[index] = section.slice(3);
        }
      });
      const hexArray = split.join('').trim().split(' ');

      const finalArray = [];
      let nextChar: string;

      hexArray.forEach((data, index) => {
        switch (type) {
          case PIDType.String: {
            nextChar = String.fromCharCode(parseInt(data, 16));
            if (nextChar === '\u0001') {
              nextChar = '';
            }
          }
          case PIDType.Binary: {
            nextChar = (parseInt(data, 16).toString(2)).padStart(8, '0');
          }
          case PIDType.Number: {
            nextChar = parseInt(data, 16).toString();
          }
        }
        finalArray[index] = nextChar;
      });
      resolve(finalArray.join(''));
    });
  }

  private getSupportedPIDs(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      let PIDs1and2String: string;

      this.callPID(PIDConstants.Group1SupportedPIDs1, PIDType.Binary).then(group1Data1 => {
        PIDs1and2String += group1Data1;
        if (PIDs1and2String.charAt(PIDs1and2String.length - 1) === '1') {
          this.callPID(PIDConstants.Group1SupportedPIDs2, PIDType.Binary).then(group1Data2 => {
            PIDs1and2String += group1Data2;
            if (PIDs1and2String.charAt(PIDs1and2String.length - 1) === '1') {
              this.callPID(PIDConstants.Group1SupportedPIDs3, PIDType.Binary).then(group1Data3 => {
                PIDs1and2String += group1Data3;
                if (PIDs1and2String.charAt(PIDs1and2String.length - 1) === '1') {
                  this.callPID(PIDConstants.Group1SupportedPIDs4, PIDType.Binary).then(group1Data4 => {
                    PIDs1and2String += group1Data4;
                  }, group1Error4 => {
                    // TODO: figure out what to do when it fails
                    reject(group1Error4);
                  });
                }
              }, group1Error3 => {
                // TODO: figure out what to do when it fails
                reject(group1Error3);
              });
            }
          }, group1Error2 => {
            // TODO: figure out what to do when it fails
            reject(group1Error2);
          });
        }
      }, group1Error1 => {
        // TODO: figure out what to do when it fails
        reject(group1Error1);
      }).then(ehhhhhh => {
        for (let c = 0; c < PIDs1and2String.length; c++) {
          this.service1and2SupportedPIDs[c] = (PIDs1and2String[c] === '1');
        }

        this.callPID(PIDConstants.Group9SupportedPIDs, PIDType.Binary).then(group9Data => {
          for (let c = 0; c < group9Data.length; c++) {
            this.service9SupportedPIDs[c] = (group9Data[c] === '1');
          }
          resolve('success');

        }, group9Error => {
          // TODO: figure out what to do when it fails
          reject(group9Error);
        });
      });
    });
  }

  private pidSupported(group: number, call: number): boolean {
    if (group === 1) {
      return this.service1and2SupportedPIDs[call];
    } else if (group === 2) {
      return this.service1and2SupportedPIDs[call];
    } else if (group === 9) {
      return this.service9SupportedPIDs[call];
    } else {
      return false;
    }
  }

  // Format data group code ammount of messages recieved \r
  // Parse data idk
  // Parse to string
  // parse to number
  // parse bitwise


  /**
   * Parses OBD data to just the useful hex
   * @param data - Raw data gotten from OBD
   * @param type - What were supposed to be parsing it into
   * @returns The parsed data
   */
  parseHex(data: string, type: string): string {
    const split = data.split('\r');
    split.forEach((section, index) => {
      if (section.indexOf(':') === 1) {
        split[index] = section.slice(3);
      }
    });
    const hexArray = split.join('').trim().split(' ');
    if (type === 'string') {
      return this.hexToString(hexArray);
    } else if (type === 'binary') {
      return this.hexToBinary(hexArray);
    } else if (type === 'number') {
      return this.hexToDecimal(hexArray);
    }
  }

  /**
   * Turns hex to string
   * @param hexArray - Array of hex codes
   * @returns Decoded string
   */
  hexToString(hexArray: string[]): string {
    const finalArray = [];
    hexArray.forEach((data, index) => {
      finalArray[index] = String.fromCharCode(parseInt(data, 16));
      if (finalArray[index] === '\u0001') {
        finalArray[index] = '';
      }
    });
    return finalArray.join('');
  }

  hexToBinary(hexArray: string[]): string {
    const finalArray = [];
    hexArray.forEach((data, index) => {
      finalArray[index] = (parseInt(data, 16).toString(2)).padStart(8, '0');
      if (finalArray[index] === '\u0001') {
        finalArray[index] = '';
      }
    });
    return finalArray.join('');
  }

  hexToDecimal(hexArray: string[]): string {
    const finalArray = [];
    hexArray.forEach((data, index) => {
      finalArray[index] = parseInt(data, 16).toString();
      if (finalArray[index] === '\u0001') {
        finalArray[index] = '';
      }
    });
    return finalArray.join('');
  }

}
