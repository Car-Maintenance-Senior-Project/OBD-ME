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
import { Router } from '@angular/router';

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
    private vinParser: VINParserService,
    private route: Router
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


      this.store.get(StorageKeys.CARPROFILES).then(allProfiles => {
        console.log('OBDMEDebug: allProfiles: ' + JSON.stringify(allProfiles));
        if (allProfiles === null) {
          console.log('OBDMEDebug: null');
          this.currentProfile = {
            vin: '',
            vinData: null,
            nickname: '-1',
            fuelEconomy: null,
            pastRoutes: null,
            maintenanceRecords: null,
            lastProfile: true
          };
        } else {
          const lastProfile: CarProfile = allProfiles.find(profiles => profiles.lastProfile === true);
          console.log('OBDMEDebug: lastProfile: ' + JSON.stringify(lastProfile));
          if (lastProfile === undefined) {
            this.currentProfile = {
              vin: '',
              vinData: null,
              nickname: '-1',
              fuelEconomy: null,
              pastRoutes: null,
              maintenanceRecords: null,
              lastProfile: true
            };
          } else {
            this.currentProfile = lastProfile;
          }
        }
        console.log('OBDMEDebug: this.currentProfile: ' + JSON.stringify(this.currentProfile));
      }).then(initConnect => {
        this.connect().then(result1 => {
          console.log('OBDMEDebug: ResultSuc: ' + ConnectResult[result1]);
        }, result2 => {
          console.log('OBDMEDebug: ResultRej: ' + ConnectResult[result2]);
          this.route.navigate(['settings']);
        });
      });
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
        // this.currentProfile = {
        //   vin: '',
        //   vinData: null,
        //   nickname: '-1',
        //   fuelEconomy: null,
        //   pastRoutes: null,
        //   maintenanceRecords: null,
        //   lastProfile: false
        // };

        this.blueSerial.isEnabled().then(enabled => {

          this.bluetoothEnabled = true;
          this.store.get(StorageKeys.LASTMAC).then(value => {
            console.log('OBDMEDebug: LASTMAC: ' + value);
            if (MACAddress === undefined) {
              if (value !== null) {
                MACAddress = value;
              } else {
                console.log('OBDMEDebug: LASTMAC: No Value saved/given');
                this.loading.dismiss();
                this.toast.notConnectedMessage();
                reject(ConnectResult.NoGivenOrStoredMAC);
                return;
              }
            }
            console.log('OBDMEDebug: MACAddress: ' + MACAddress);
            this.blueSerial.isConnected().then(async data => {
              console.log('OBDMEDebug: isConnected1: BT is connected');
              // for (let i = 0; i < 4; i++) {
              await this.blueSerial.disconnect().then(sucsess => {
                console.log('OBDMEDebug: isConnected1: BT got disconnected');
                this.connectToBT(MACAddress).then(returnSuc => {
                  console.log('OBDMEDebug: isConnected1: BT Suc');
                  resolve(returnSuc);
                  return;
                }, returnRej => {
                  console.log('OBDMEDebug: isConnected1: BT failed');
                  reject(returnRej);
                  return;
                });
                console.log('OBDMEDebug: isConnected1: BT ??????????');
              }, fail => {
                console.log('OBDMEDebug: isConnected1: BT failed Dis');
                this.isConnected = false;
                this.loading.dismiss();
                this.toast.notDisconnectedMessage();
                reject(ConnectResult.DisconnectFail);
                return;
              });
              // }

            }, data2 => {
              console.log('OBDMEDebug: isConnected2: BT is disconnected');
              // for (let i = 0; i < 4; i++) {
              this.connectToBT(MACAddress).then(returnSuc => {
                console.log('OBDMEDebug: isConnected2: BT suc');
                resolve(returnSuc);
                return;
              }, returnRej => {
                console.log('OBDMEDebug: isConnected2: BT fail');
                reject(returnRej);
                return;
              });
              console.log('OBDMEDebug: isConnected2: BT ?????????');
              // }
              // this.loading.dismiss();
              // this.toast.notDisconnectedMessage();
              // reject(ConnectResult.DisconnectFail);
              // return;
            });
          }, error => {
            console.log('OBDMEDebug: LASTMAC: GetFail');
            this.isConnected = false;
            // TODO: show error connect failed or let caller handle that
            this.loading.dismiss();
            this.toast.notConnectedMessage();
            reject(ConnectResult.Failure);
            return;
          });
        }, disabled => {
          console.log('OBDMEDebug: BlueNotEnabled');
          this.bluetoothEnabled = false;
          this.isConnected = false;
          // TODO: show error Bluetooth disabled or let caller handle that
          this.loading.dismiss();
          this.toast.errorMessage('Please turn on Bluetooth');
          reject(ConnectResult.BluetoothDisabledFail);
          return;
        });
        // this.loading.dismiss();
        // this.toast.errorMessage('Total Failure: This should not happen');
        // reject(ConnectResult.Failure);
      });
    });
  }

  private connectToBT(MACAddress: string): Promise<ConnectResult> {
    return new Promise<ConnectResult>((resolve, reject) => {
      console.log('OBDMEDebug: connectProcess: Start: ' + MACAddress);
      this.blueSerial.disconnect().then(disconnected => {
        this.blueSerial.connect(MACAddress).subscribe(success => {
          console.log('OBDMEDebug: connectProcess: Connected');
          this.isConnected = true;
          this.callPID(PIDConstants.VIN, PIDType.String).then(vinRaw => {
            console.log('OBDMEDebug: connectProcess: Got Vin: ' + vinRaw);
            this.vinParser.ParseVIN(vinRaw).then(parsedVin => {
              console.log('OBDMEDebug: connectProcess: Parsed Vin: ' + JSON.stringify(parsedVin));
              this.store.get(StorageKeys.CARPROFILES).then(allProfiles => {
                console.log('OBDMEDebug: connectProcess: allProfiles: ' + JSON.stringify(allProfiles));
                if (allProfiles === null) {
                  allProfiles = [];
                }
                allProfiles.forEach(profile => {
                  profile.lastProfile = false;
                });
                const profileSearch: CarProfile = allProfiles.find(profile => profile.vin === vinRaw);
                console.log('OBDMEDebug: connectProcess: profileSearch: ' + JSON.stringify(profileSearch));
                if (profileSearch !== undefined) {
                  profileSearch.lastProfile = true;
                  this.currentProfile = profileSearch;
                } else {
                  if (allProfiles.length === 0) {
                    this.currentProfile = {
                      vin: vinRaw,
                      vinData: parsedVin,
                      nickname: '1',
                      fuelEconomy: null,
                      pastRoutes: null,
                      maintenanceRecords: null,
                      lastProfile: true
                    };
                  } else {
                    let newNick = '-1';
                    for (let i = 1; i < 1000; i++) {
                      if (allProfiles[i - 1].nickname !== i.toString()) {
                        newNick = i.toString();
                        break;
                      }
                    }
                    this.currentProfile = {
                      vin: vinRaw,
                      vinData: parsedVin,
                      nickname: newNick,
                      fuelEconomy: null,
                      pastRoutes: null,
                      maintenanceRecords: null,
                      lastProfile: true
                    };
                  }
                  allProfiles.push(this.currentProfile);
                  console.log('OBDMEDebug: connectProcess: Profiles Done: ' + JSON.stringify(allProfiles));
                  this.store.set(StorageKeys.CARPROFILES, allProfiles);
                }
                this.store.set(StorageKeys.LASTMAC, MACAddress);
                this.loading.dismiss();
                this.toast.connectedMessage();
                console.log('OBDMEDebug: connectProcess: Suc');
                resolve(ConnectResult.Success);
                return;
              });
            });
          });
        }, reject1 => {
          console.log('OBDMEDebug: connectProcess: Fail');
          this.isConnected = false;
          // TODO: show error connect failed or let caller handle that
          this.loading.dismiss();
          this.toast.notConnectedMessage();
          reject(ConnectResult.Failure);
          return;
        });
      }, notDis => {
        console.log('OBDMEDebug: connectProcess: Fail');
        this.isConnected = false;
        // TODO: show error connect failed or let caller handle that
        this.loading.dismiss();
        this.toast.notConnectedMessage();
        reject(ConnectResult.Failure);
        return;
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
    console.log('OBDMEDebug: saveProfiles: NewNick: ' + newName);
    this.currentProfile.nickname = newName;
    this.saveProfiles();
  }

  public saveProfiles(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.store.get(StorageKeys.CARPROFILES).then(allProfiles => {
        console.log('OBDMEDebug: saveProfiles: initProfiles' + JSON.stringify(allProfiles));
        const splicedProfile = allProfiles.splice(allProfiles.findIndex(profile => profile.vin === this.currentProfile.vin), 1);
        console.log('OBDMEDebug: saveProfiles: splicedProfile' + JSON.stringify(splicedProfile));
        console.log('OBDMEDebug: saveProfiles: currentProfile' + JSON.stringify(this.currentProfile));
        allProfiles.push(this.currentProfile);
        console.log('OBDMEDebug: saveProfiles: saveProfiles' + JSON.stringify(allProfiles));
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

  /**
   * Writes the given request to the OBD and then subscribes for a response from the OBD
   * @param callData - Data to be written to the OBD
   * @param type - What it should be parsed as
   * @returns Promise with the response or rejection
   * TODO: Mannage duplicats that also are more than one message long or set the OBD device to only listen to the main responder
   */
  writeThenRead(callData: string): Promise<string> {
    console.log('OBDMEDebug: Connector: start');
    return new Promise((promSuccess, promReject) => {
      this.isConnectedFun().then(isConnect => {
        if (isConnect) {
          console.log('OBDMEDebug: Connector: isconnected');
          this.blueSerial.write(callData).then(success => {
            console.log('OBDMEDebug: Connector: write data');
            this.blueSerial.subscribe('\r\r').subscribe(data => {
              console.log('OBDMEDebug: Connector: EVENT: ' + data);
              if (data !== '') {
                console.log(data);
                // if (data === 'NO DATA\r\r') {
                if (data.includes('NO DATA')) {
                  console.log('OBDMEDebug: Connector: NO DATA');
                  // promReject('NO DATA');
                  promSuccess('NO DATA');
                } else if (data.includes('OK')) {
                  promSuccess('OK');
                } else if (data.includes('?')) {
                  console.log('OBDMEDebug: Connector: Needs Rerun');
                  this.writeThenRead(callData).then(yes => {
                    promSuccess(yes);
                  }, no => {
                    promReject(no);
                  });
                } else {
                  console.log('OBDMEDebug: Connector: HAS DATA');
                  const hexCall = '4' + callData[1] + ' ' + callData.slice(2, 4) + ' ';
                  if (data.includes(hexCall)) {
                    data = data.slice(data.indexOf(hexCall) + 6);
                    if (data.includes(hexCall)) {
                      data = data.slice(0, data.indexOf(hexCall));
                    }
                    console.log('OBDMEDebug: Connector: return: ' + data);
                    promSuccess(data);
                  }
                }
              }
            });

          }, failure => {
            this.toast.errorMessage('Couldnt write data!');
            promReject('Couldnt write');
          });
        } else {
          console.log('OBDMEDebug: Connector: not connected');
          this.toast.notConnectedMessage();
          promReject('Not connected to bluetooth');
        }
      });
    });
  }

  // private writeThenRead(pid: string): Promise<string> {
  //   return new Promise<string>((resolve, reject) => {
  //     console.log('OBDMEDebug: writeThenRead: start');
  //     if (this.bluetoothEnabled && this.isConnected) {
  //       console.log('OBDMEDebug: writeThenRead: writeStart');
  //       this.blueSerial.write(pid).then(success => {
  //         this.blueSerial.readUntil('\r\r').then(receivedData => {
  //           resolve(receivedData);
  //         }, error => {
  //           // TODO: error message
  //           reject('Error on data read');
  //         });
  //       }, error => {
  //         // TODO: error message
  //         reject('Error on data write');
  //       });
  //     } else {
  //       // TODO: show error that call can't happen yet because connection isn't established
  //       reject('Proper connection not established');
  //     }
  //   });
  // }

  callPID(pid: string, type: PIDType): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      // TODO: Get the supported pids to work.  Currently parsing seems to work fine, just doesnt check for them correctly
      // if (this.pidSupported(parseInt(pid.charAt(1), 10), parseInt(pid.slice(2, 4), 10))) {
      this.writeThenRead(pid).then(data => {
        console.log('OBDMEDebug: callPid: dataBack: ' + data);
        console.log('OBDMEDebug: callPid: parsedData: ' + JSON.stringify(this.parseData(data, type)));
        resolve(this.parseData(data, type));
      }, error => {
        reject(error);
      });
      // } else {
      //   reject('PID not supported');
      // }
    });
  }

  //private parseData(data: string, type: PIDType): Promise<string> {
  parseData(data: string, type: PIDType): Promise<string> {
    return new Promise<string>((resolve) => {
      console.log(data);
      const split = data.split('\r');
      console.log(split);
      split.forEach((section, index) => {
        if (section.indexOf(':') === 1) {
          split[index] = section.slice(3);
        }
      });
      console.log(split);
      const hexArray = split.join('').trim().split(' ');
      console.log(hexArray);
      const finalArray = [];
      let nextChar: string;

      hexArray.forEach((splitData, index) => {
        switch (type) {
          case PIDType.String: {
            nextChar = String.fromCharCode(parseInt(splitData, 16));
            break;
          }
          case PIDType.Binary: {
            nextChar = (parseInt(splitData, 16).toString(2)).padStart(8, '0');
            break;
          }
          case PIDType.Number: {
            nextChar = parseInt(splitData, 16).toString();
            break;
          }
          case PIDType.MAF: {
            nextChar = parseInt(splitData, 16).toString();
            break;
          }
        }
        console.log(nextChar);
        if (nextChar === '\u0001') {
          nextChar = '';
        }
        finalArray[index] = nextChar;
      });

      console.log(JSON.stringify(finalArray));
      if (PIDType.MAF !== type) {
        resolve(finalArray.join(''));
      } else {
        resolve((((256 * parseFloat(finalArray[0])) + parseFloat(finalArray[1])) / 100).toString());
      }

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
