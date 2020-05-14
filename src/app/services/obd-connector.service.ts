/**
 * OBD connector service is a service that allows an app to connect, read, and write to and OBD scanner that is using
 * an ELM327 chip device (possibly others but havent tested).
 */

import { NgZone, Injectable } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { Storage } from '@ionic/storage';
import { LoadingController } from '@ionic/angular';
import { HTTP } from '@ionic-native/http/ngx';
import { Router } from '@angular/router';

import { ToastMasterService } from '../services/toast-master.service';

import { Device } from '../interfaces/device-struct';
import { ConnectResult } from '../enums/connect-result.enum';
import { PIDType } from '../enums/pidtype.enum';
import { StorageKeys } from '../classes/storage-keys';
import { PIDConstants } from '../classes/pidconstants';
import { CarProfile } from '../interfaces/car-profile';
import { VINData } from '../interfaces/vindata';

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
    private route: Router,
    private http: HTTP
  ) { }


  private macAddress: string;
  private devices: Device[];
  public processing: boolean;
  private started = false;
  private loading: HTMLIonLoadingElement;
  public isConnected: boolean;
  private bluetoothEnabled: boolean;
  public currentProfile: CarProfile;
  public isLoading = true;

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
      // Get all the paired BT devices
      this.getPaired();

      // Load in the save profiles and check if any of them are the correct ones
      this.store.get(StorageKeys.CARPROFILES).then(allProfiles => {

        // If there are no profiles, set a default one
        if (allProfiles === null) {
          this.currentProfile = {
            vin: '',
            vinData: null,
            nickname: '-1',
            fuelEconomy: null,
            pastRoutes: null,
            maintenanceRecords: null,
            lastProfile: true,
            pictureSaved: false,
            errorCodes: []
          };
        } else {
          // If there are profiles, find which one was the last profile if applicable
          const lastProfile: CarProfile = allProfiles.find(profiles => profiles.lastProfile === true);
          if (lastProfile === undefined) {
            this.currentProfile = {
              vin: '',
              vinData: null,
              nickname: '-1',
              fuelEconomy: null,
              pastRoutes: null,
              maintenanceRecords: null,
              lastProfile: true,
              pictureSaved: false,
              errorCodes: []
            };
          } else {
            this.currentProfile = lastProfile;
          }
        }
        this.isLoading = false;

        // After the profile is loaded, try to connect to the bluetooth
      }).then(initConnect => {
        this.connect().then(result1 => {
          this.isLoading = false;
        }, result2 => {
          this.route.navigate(['settings']);
          this.isLoading = false;
        });
      });
    });
  }

  /**
   * Attempts to connect via bluetooth to the OBD.  Uses the last connect MAC if none
   * is given when its called.
   * TODO: Run usefull AT codes
   * TODO: Get the PIDs that are supported
   * @param [MacAddress] - Optional mac address of the OBD to connect to, defaults to the last used MAC
   * @returns Promise of the connection result of the BT
   */
  connect(MACAddress?: string): Promise<ConnectResult> {
    return new Promise<ConnectResult>((resolve, reject) => {
      this.loader.create({
        message: 'Connecting to bluetooth'
      }).then(overlay => { // Creates a overlay so the user cant do anything while its connecting
        this.loading = overlay;
        this.loading.present();
        // initialize conditions to false when a connection is attempted
        this.bluetoothEnabled = false;
        this.isConnected = false;

        // Check to see if BT is enabled
        this.blueSerial.isEnabled().then(enabled => {
          this.bluetoothEnabled = true;

          // Decide which MAC to use
          this.store.get(StorageKeys.LASTMAC).then(value => {
            if (MACAddress === undefined) {
              if (value !== null) {
                MACAddress = value;
              } else {
                this.loading.dismiss();
                this.toast.notConnectedMessage();
                reject(ConnectResult.NoGivenOrStoredMAC);
                return;
              }
            }

            // Check to see if the BT is connected already
            this.blueSerial.isConnected().then(async data => {

              // If it is, disconnect first, then attempt to connect
              await this.blueSerial.disconnect().then(sucsess => {
                this.connectToBT(MACAddress).then(returnSuc => {
                  resolve(returnSuc);
                  return;
                }, returnRej => {
                  reject(returnRej);
                  return;
                });
              }, fail => {
                this.isConnected = false;
                this.loading.dismiss();
                this.toast.notDisconnectedMessage();
                reject(ConnectResult.DisconnectFail);
                return;
              });

            }, data2 => {
              // If not connected, just connect
              this.connectToBT(MACAddress).then(returnSuc => {
                resolve(returnSuc);
                return;
              }, returnRej => {
                reject(returnRej);
                return;
              });
            });

            // Reject if errors occur, or Bluetooth is disabled
          }, error => {
            this.isConnected = false;
            // TODO: show error connect failed or let caller handle that
            this.loading.dismiss();
            this.toast.notConnectedMessage();
            reject(ConnectResult.Failure);
            return;
          });
        }, disabled => {
          this.bluetoothEnabled = false;
          this.isConnected = false;
          // TODO: show error Bluetooth disabled or let caller handle that
          this.loading.dismiss();
          this.toast.errorMessage('Please turn on Bluetooth');
          reject(ConnectResult.BluetoothDisabledFail);
          return;
        });
      });
    });
  }


  /**
   * Connects to bluetooth and depending on what happens, sets the profile accordingly
   * @param MACAddress - MAC of the bluetooth to connect to
   * @returns Promise of the connection result of the BT
   */
  private connectToBT(MACAddress: string): Promise<ConnectResult> {
    return new Promise<ConnectResult>((resolve, reject) => {
      this.blueSerial.disconnect().then(disconnected => {
        // Attempt to connect to the MAC given
        this.blueSerial.connect(MACAddress).subscribe(success => {
          this.isConnected = true;

          // If connected, attempt to get the vin from the car
          this.callPID(PIDConstants.VIN, PIDType.String).then(vinRaw => {

            // Use the vin to either grab a profile from storage or parse a new profile
            this.store.get(StorageKeys.CARPROFILES).then(allProfiles => {
              if (allProfiles === null) {
                allProfiles = [];
              }
              allProfiles.forEach(profile => { // Set all profiles to not be the last one
                profile.lastProfile = false;
              });
              const profileSearch: CarProfile = allProfiles.find(profile => profile.vin === vinRaw);
              if (profileSearch !== undefined) { // If is in storage, set the profile accordingly
                profileSearch.lastProfile = true;
                this.currentProfile = profileSearch;
                this.store.set(StorageKeys.LASTMAC, MACAddress);
                this.loading.dismiss();
                this.toast.connectedMessage();
                resolve(ConnectResult.Success);
                return;
              } else { // Else use an API request to get the VIN data and create and set a new profile
                this.http.get('https://api.carmd.com/v3.0/decode?vin=' + vinRaw, {}, {
                  'content-type': 'application/json',
                  'authorization': 'Basic NTgyMjhmZGUtNGE1Yi00OWZkLThlMzAtNTlhNTU1NzYxYWNi',
                  'partner-token': 'dc22f0426ac94a48b7779458ab235e54'
                }).then(dataBack => {
                  const parsedVin: VINData = {
                    year: JSON.parse(dataBack.data).data.year,
                    make: JSON.parse(dataBack.data).data.make,
                    model: JSON.parse(dataBack.data).data.model
                  };
                  this.currentProfile = {
                    vin: vinRaw,
                    vinData: parsedVin,
                    nickname: (allProfiles.length + 1).toString(),
                    fuelEconomy: null,
                    pastRoutes: null,
                    maintenanceRecords: null,
                    lastProfile: true,
                    pictureSaved: false,
                    errorCodes: []
                  };

                  // Store profiles and last mac to be used when needed
                  allProfiles.push(this.currentProfile);
                  this.store.set(StorageKeys.CARPROFILES, allProfiles);
                  this.store.set(StorageKeys.LASTMAC, MACAddress);

                  // Return that we connected and dismiss the loading screen
                  this.loading.dismiss();
                  this.toast.connectedMessage();
                  resolve(ConnectResult.Success);
                  return;

                }, webError => {
                  // TODO: Have this still save the vin, and get the data later in vehicle info
                  this.isConnected = false;
                  this.loading.dismiss();
                  this.toast.notConnectedMessage();
                  reject(ConnectResult.Failure);
                  return;
                });
              }
            });
          }, reject3 => {
            // If you cant grab the vin from the car, then create a dummy vin and tell the user to input the vin manually on the info page
            this.store.get(StorageKeys.CARPROFILES).then(allProfiles => {
              if (allProfiles === null) {
                allProfiles = [];
              }
              allProfiles.forEach(profile => {
                profile.lastProfile = false;
              });
              this.currentProfile = {
                vin: 'CantGetVin' + (allProfiles.length + 1).toString(),
                vinData: { year: '', make: '', model: '' },
                nickname: (allProfiles.length + 1).toString(),
                fuelEconomy: null,
                pastRoutes: null,
                maintenanceRecords: null,
                lastProfile: true,
                pictureSaved: false,
                errorCodes: []
              };
              this.store.set(StorageKeys.LASTMAC, MACAddress);
              this.loading.dismiss();
              this.toast.errorMessage('Please input your vin on the Vehicle info page');
              resolve(ConnectResult.Success);
              return;
            });
          });

        }, reject1 => {
          // If you can't connect, reject with a failure status
          this.isConnected = false;
          this.loading.dismiss();
          this.toast.notConnectedMessage();
          reject(ConnectResult.Failure);
          return;
        });
      }, notDis => {
        // If you can't disconnect, reject with a failure status
        this.isConnected = false;
        this.loading.dismiss();
        this.toast.notConnectedMessage();
        reject(ConnectResult.Failure);
        return;
      });
    });
  }

  /**
   * Changes current name of the profile and saves it
   * @param newName - New name for profile
   */
  changeCurrentName(newName: string): void {
    this.currentProfile.nickname = newName;
    this.saveProfiles();
  }

  /**
   * Saves profiles and update the current loaded one
   * @returns profiles
   */
  public saveProfiles(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.store.get(StorageKeys.CARPROFILES).then(allProfiles => {
        const splicedProfile = allProfiles.splice(allProfiles.findIndex(profile => profile.vin === this.currentProfile.vin), 1);
        allProfiles.push(this.currentProfile);
        this.store.set(StorageKeys.CARPROFILES, allProfiles);
      });
    });
  }

  /**
   * TODO: Change how this works so it looks for the vin first
   * Saves profiles and change the vin on the current profile
   * @param newVin - New vin to be updated
   * @returns profiles change vin
   */
  public saveProfilesChangeVin(newVin: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.store.get(StorageKeys.CARPROFILES).then(allProfiles => {
        const splicedProfile = allProfiles.splice(allProfiles.findIndex(profile => profile.vin === this.currentProfile.vin), 1);
        this.currentProfile.vin = newVin;
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

  /**
   * Writes the given request to the OBD and then subscribes for a response from the OBD
   * @param callData - Data to be written to the OBD
   * @param type - What it should be parsed as
   * @returns Promise with the response or rejection
   * TODO: Manage duplicates that also are more than one message long or set the OBD device to only listen to the main responder
   */
  writeThenRead(callData: string, type: PIDType): Promise<string> {
    return new Promise((promSuccess, promReject) => {
      this.isConnectedFun().then(isConnect => {
        if (isConnect) {
          this.blueSerial.write(callData).then(success => {
            this.blueSerial.subscribe('\r\r').subscribe(data => {
              if (data !== '') {
                console.log(data);
                if (data.includes('NO DATA')) {
                  promReject('NO DATA');
                } else if (data.includes('OK')) {
                  promSuccess('OK');
                } else if (data.includes('?')) {
                  this.writeThenRead(callData, type).then(yes => {
                    promSuccess(yes);
                  }, no => {
                    promReject(no);
                  });
                } else {
                  if (type !== PIDType.errors) {
                    const hexCall = '4' + callData[1] + ' ' + callData.slice(2, 4) + ' ';
                    if (data.includes(hexCall)) {
                      data = data.slice(data.indexOf(hexCall) + 6);
                      if (data.includes(hexCall)) {
                        data = data.slice(0, data.indexOf(hexCall));
                      }
                      // console.log('OBDMEDebug: Connector: return: ' + data);
                      promSuccess(data);
                    }
                  } else {
                    const hexCall = '4' + callData[1];
                    if (data.includes(hexCall)) {
                      data = data.slice(data.indexOf(hexCall) + 6);
                      if (data.includes(hexCall)) {
                        data = data.slice(0, data.indexOf(hexCall));
                      }
                      // console.log('OBDMEDebug: Connector: return: ' + data);
                      promSuccess(data);
                    }
                  }

                }
              }
            });

          }, failure => {
            this.toast.errorMessage('Couldnt write data!');
            promReject('Couldnt write');
          });
        } else {
          // console.log('OBDMEDebug: Connector: not connected');
          this.toast.notConnectedMessage();
          promReject('Not connected to bluetooth');
        }
      });
    });
  }

  // !!TODO: Needs to deal with nodata
  // Create own car call type that is the only one that can respond be reponded to by no data/ok
  callPID(pid: string, type: PIDType): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      // TODO: Get the supported pids to work.  Currently parsing seems to work fine, just doesnt check for them correctly
      // if (this.pidSupported(parseInt(pid.charAt(1), 10), parseInt(pid.slice(2, 4), 10))) {
      this.writeThenRead(pid, type).then(data => {
        // console.log('OBDMEDebug: callPid: dataBack:' + data + 'ehhf');
        if (!data.includes('NO DATA')) {
          // console.log('OBDMEDebug: callPid: parsedData: ' + JSON.stringify(this.parseData(data, type)));
          resolve(this.parseData(data, type));
        } else {
          // console.log('OBDMEDebug: callPid: RejectNoData');
          reject('NO DATA');
        }

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
      // console.log('OBDMEDebug: parseData: data: ' + data);
      if (data.length === 1) {
        resolve('');
        return;
      }
      const split = data.split('\r');
      // console.log(split);
      split.forEach((section, index) => {
        if (section.indexOf(':') === 1) {
          split[index] = section.slice(3);
        }
      });
      // console.log('OBDMEDebug: parseData: split: ' + split);
      const hexArray = split.join('').trim().split(' ');
      console.log(hexArray);
      const finalArray = [];
      let nextChar: string;
      let currentPlace = 0;
      let nextError = '';

      hexArray.forEach((splitData, index) => {
        if (type !== PIDType.errors) {
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
          // console.log(nextChar);
          if (nextChar === '\u0001') {
            nextChar = '';
          }
          finalArray[index] = nextChar;
        } else {
          switch (currentPlace) {
            case 0: {
              const binary = (parseInt(splitData, 16).toString(2)).padStart(8, '0');
              switch (binary.substr(0, 2)) {
                case '00': {
                  nextError += 'p';
                  break;
                }
                case '01': {
                  nextError += 'c';
                  break;
                }
                case '10': {
                  nextError += 'b';
                  break;
                }
                case '11': {
                  nextError += 'u';
                  break;
                }
              }
              nextError += parseInt(binary.substr(2, 2), 2).toString();
              nextError += splitData.substr(1, 1);
              currentPlace = 1;
              // console.log('OBDMEDebug: parseData: halfError: ' + nextError);
              break;
            } case 1: {
              nextError += splitData;
              finalArray.push(nextError);
              // console.log('OBDMEDebug: parseData: nextError: ' + nextError);
              nextError = '';
              currentPlace = 0;
              break;
            }
          }
        }

      });

      // console.log('OBDMEDebug: parseData: finalArray: ' + JSON.stringify(finalArray));
      if (PIDType.MAF === type) {
        resolve((((256 * parseFloat(finalArray[0])) + parseFloat(finalArray[1])) / 100).toString());
      } else if (type === PIDType.errors) {
        resolve(finalArray.join(','));
      } else {
        resolve(finalArray.join(''));
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
