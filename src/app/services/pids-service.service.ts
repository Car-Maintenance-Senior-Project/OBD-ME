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

  getSupportedPIDs(): void {
    const array = ['0', '2', '4', '6', '8', 'A', 'C'];
    let PIDs1String: string;
    let PIDs2String: string;

    array.forEach(element => {
      this.OBDConnector.writeThenRead('01' + element + '0', 'binary').then(promSuccess => {
        PIDs1String += promSuccess;
        this.OBDConnector.writeThenRead('02' + element + '0', 'binary').then(promSuccess => {
          PIDs2String += promSuccess;

          for (let c = 0; c < PIDs1String.length; c++) {
            this.service1SupportedPIDs[c] = (PIDs1String[c] === '1');
            this.service2SupportedPIDs[c] = (PIDs2String[c] === '1');
          }

          this.OBDConnector.writeThenRead('0900', 'binary').then(promSuccess => {
            for (let c = 0; c < promSuccess.length; c++) {
              this.service9SupportedPIDs[c] = (promSuccess[c] === '1');
            }
          }, promReject => {
            // TODO: figure out what to do when it fails
            console.log(promReject);
          });
        }, promReject => {
          // TODO: figure out what to do when it fails
          console.log(promReject);
        });
      });
    }, promReject => {
      // TODO: figure out what to do when it fails
      console.log(promReject);
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
      return this.service2SupportedPIDs[call];
    } else if (group === 9) {
      return this.service9SupportedPIDs[call];
    } else {
      return false;
    }
  }

  callOBDPid(call: string, type: string): Promise<string> {
    return new Promise((promSuccess, promReject) => {
      if (this.pidSupported(parseInt(call.charAt(1), 10), parseInt(call.slice(2, 4), 10))) {
        this.OBDConnector.writeThenRead(call, type).then(sucsess => {
          promSuccess(sucsess);
        }, reject => {
          promReject(reject);
        });
      } else {
        promReject('Pid not supported');
      }
    });
  }
}
