import { Injectable } from '@angular/core';
import { OBDConnectorService } from '../services/obd-connector.service';

@Injectable({
  providedIn: 'root'
})
export class PidsServiceService {

  constructor(private OBDConnector: OBDConnectorService) { }

  // for now we're only supporting services 01, 02, 03, and 09

  public service1SupportedPIDs: boolean[];
  public service2SupportedPIDs: boolean[];
  public service9SupportedPIDs: boolean[];

  initialize(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        this.service1SupportedPIDs = [];
        this.service2SupportedPIDs = [];
        this.service9SupportedPIDs = [];
        this.getSupportedPIDs();
        resolve(true);
      } catch (e) {
        reject(true);
      }
    });
  }

  getProfileName(): string {
    return this.OBDConnector.getProfileName();
  }

  //Todo: could be longer than 6 so figure out how to do dynamic based on last digit of previous call
  getSupportedPIDs(): Promise<boolean> {
    return new Promise(async (gotPids, didntGetPids) => {
      // const array = ['0', '2', '4', '6', '8', 'A', 'C'];
      let PIDs1String: string;
      let PIDs2String: string;
      this.OBDConnector.writeThenRead('01' + '0' + '01\r', 'binary').then(promSuccess => {
        PIDs1String += promSuccess;
        this.OBDConnector.writeThenRead('01' + '2' + '01\r', 'binary').then(promSuccess => {
          PIDs1String += promSuccess;
          this.OBDConnector.writeThenRead('01' + '4' + '01\r', 'binary').then(promSuccess => {
            PIDs1String += promSuccess;
            this.OBDConnector.writeThenRead('01' + '6' + '01\r', 'binary').then(promSuccess => {
              PIDs1String += promSuccess;
              for (let c = 0; c < PIDs1String.length; c++) {
                this.service1SupportedPIDs[c] = (PIDs1String[c] === '1');
              }
              this.OBDConnector.writeThenRead('09001\r', 'binary').then(promSuccess => {
                for (let c = 0; c < promSuccess.length; c++) {
                  this.service9SupportedPIDs[c] = (promSuccess[c] === '1');
                }
                gotPids(true);
              }, promReject => {
                // TODO: figure out what to do when it fails
                console.log('OBDMEDebug: Reject: ' + promReject);
                didntGetPids(true);
              });
            }, promReject => {
              // TODO: figure out what to do when it fails
              console.log('OBDMEDebug: Reject: ' + promReject);
              didntGetPids(true);
            });
          }, promReject => {
            // TODO: figure out what to do when it fails
            console.log('OBDMEDebug: Reject: ' + promReject);
            didntGetPids(true);
          });
        }, promReject => {
          // TODO: figure out what to do when it fails
          console.log('OBDMEDebug: Reject: ' + promReject);
          didntGetPids(true);
        });

      }, promReject => {
        // TODO: figure out what to do when it fails
        console.log('OBDMEDebug: Reject: ' + promReject);
        didntGetPids(true);
      });

    });
  }

  getAllPidsSupported(): string[] {
    let pids1, pids2, pids9: string;
    for (let i = 0; i < this.service1SupportedPIDs.length; i++) {
      if (this.service1SupportedPIDs[i]) {
        pids1 += '1, ';
      } else {
        pids1 += '0, ';
      }
      if (this.service2SupportedPIDs[i]) {
        pids2 += '1, ';
      } else {
        pids2 += '0, ';
      }
    }
    for (let i = 0; i < this.service9SupportedPIDs.length; i++) {
      if (this.service9SupportedPIDs[i]) {
        pids9 += '1, ';
      } else {
        pids9 += '0, ';
      }
    }
    return [pids1, pids2, pids9];
  }

  pidSupported(group: number, call: number): boolean {
    if (group === 1) {
      return this.service1SupportedPIDs[call];
    } else if (group === 2) {
      return this.service1SupportedPIDs[call];
    } else if (group === 9) {
      return this.service9SupportedPIDs[call];
    } else {
      return false;
    }
  }

  callOBDPid(call: string, type: any): Promise<string> {
    console.log('OBDMEDebug: start of callPID');
    return new Promise((promSuccess, promReject) => {
      console.log('OBDMEDebug: start Prom');
      // if (this.pidSupported(parseInt(call.charAt(1), 10), parseInt(call.slice(2, 4), 10))) {
      console.log('OBDMEDebug: callPid: iftrue');
      this.OBDConnector.callPID(call, type).then(sucsess => {
        console.log('OBDMEDebug: callPid: sucsess: ' + sucsess);
        promSuccess(sucsess);
      }, reject => {
        console.log('OBDMEDebug: callPid: reject: ' + reject);
        promReject(reject);
      });
      // } else {
      //   console.log('OBDMEDebug: callPid: iffalse');
      //   promReject('Pid not supported');
      // }
    });
  }
}
