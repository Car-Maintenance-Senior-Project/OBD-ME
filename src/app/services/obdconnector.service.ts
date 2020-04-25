import { Injectable } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { Storage } from '@ionic/storage';

import { VINParserService } from '../services/vinparser.service';

import { ConnectResult } from '../enums/connect-result.enum';
import { PIDType } from '../enums/pidtype.enum';
import { StorageKeys } from '../classes/storage-keys';
import { PIDConstants } from '../classes/pidconstants';
import { CarProfile } from '../interfaces/car-profile';

@Injectable({
  providedIn: 'root'
})
export class OBDConnectorService {
  private isConnected: boolean;
  private bluetoothEnabled: boolean;
  public currentProfile: CarProfile;

  // for now we're only supporting services 01, 02, 03, and 09
  private service1and2SupportedPIDs: boolean[];
  private service9SupportedPIDs: boolean[];

  constructor(private btSerial: BluetoothSerial, private storage: Storage, private vinParser: VINParserService) {
    try {
      this.service1and2SupportedPIDs = [true];
      this.service9SupportedPIDs = [true];
      this.getSupportedPIDs().then(resolve => {
        // TODO: handle something here
      }, reject => {
        // TODO: handle something here
      });
    } catch (e) {
      // TODO: error message
    }
  }

  connect(MACAddress?: string): Promise<ConnectResult> {
    return new Promise<ConnectResult>((resolve, reject) => {
      // initialize conditions to false when a connection is attempted
      this.bluetoothEnabled = false;
      this.isConnected = false;
      this.currentProfile = {
        vin: '',
        vinData: null,
        nickname: '',
        fuelEconomy: null
      };

      this.btSerial.isEnabled().then(enabled => {

        var connect = function () {
          if (MACAddress === '') {
            this.storage.get(StorageKeys.LASTMAC).then(value => {
              if (value != '') {
                MACAddress = value;
              } else {
                reject(ConnectResult.NoGivenOrStoredMAC);
              }
            });
          }

          // TODO: no idea how this works....
          this.btSerial.connect(MACAddress).subscribe(success => {
            this.isConnected = true;
            this.callPID(PIDConstants.VIN, PIDType.String).then(vin => {
              let parsedVin = this.vinParser.ParseVin(vin);
              let allProfiles = this.storage.get(StorageKeys.CARPROFILES);
              let profileSearch: CarProfile = allProfiles.find(profile => profile.vin === parsedVin);
              if (profileSearch) {
                this.currentProfile = profileSearch
              } else {
                this.currentProfile = {
                  vin: vin,
                  vinData: parsedVin,
                  nickname: '',
                  fuelEconomy: null
                };
              }
            });
            this.storage.set(StorageKeys.LASTMAC, MACAddress);
            resolve(ConnectResult.Success);
          }, error => {
            this.isConnected = false;
            // TODO: show error connect failed or let caller handle that
            reject(ConnectResult.Failure);
          });
        }

        var disconnect = function () {
          this.btSerial.disconnect().then(connect, fail => {
            this.isConnected = false;
            // TODO: show error disconnect failed or let caller handle that
            reject(ConnectResult.DisconnectFail);
          });
        }

        this.bluetoothEnabled = true;
        this.btSerial.isConnected().then(disconnect, connect);

      }, disabled => {
        this.bluetoothEnabled = false;
        this.isConnected = false;
        // TODO: show error Bluetooth disabled or let caller handle that
        reject(ConnectResult.BluetoothDisabledFail);
      });
    });
  }

  private readData(pid: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (this.bluetoothEnabled && this.isConnected) {
        this.btSerial.write(pid).then(success => {
          this.btSerial.readUntil('\r\r').then(receivedData => {
            resolve(receivedData);
          }, error => {
            // TODO: error message
            reject("Error on data read");
          });
        }, error => {
          // TODO: error message
          reject("Error on data write");
        });
      } else {
        // TODO: show error that call can't happen yet because connection isn't established
        reject("Proper connection not established");
      }
    });
  }

  callPID(pid: string, type: PIDType): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (this.pidSupported(parseInt(pid.charAt(1), 10), parseInt(pid.slice(2, 4), 10))) {
        this.readData(pid).then(data => {
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

  // getSupportedPids1(): Promise<>

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

}
