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
    let array = ['0', '2', '4', '6', '8', 'A', 'C'];
    let PIDs1String: string;
    let PIDs2String: string;

    array.forEach(element => {
      this.OBDConnector.writeThenRead('01' + element + '0').then(promSuccess => {
        PIDs1String += promSuccess;
      }, promReject => {
        // TODO: figure out what to do when it fails
        console.log(promReject);
      });

      this.OBDConnector.writeThenRead('02' + element + '0').then(promSuccess => {
        PIDs2String += promSuccess;
      }, promReject => {
        // TODO: figure out what to do when it fails
        console.log(promReject);
      });
    });

    for (let c = 0; c < PIDs1String.length; c++) {
      this.service1SupportedPIDs[c] = (PIDs1String[c] === '1');
      this.service2SupportedPIDs[c] = (PIDs2String[c] === '1');
    }

    this.OBDConnector.writeThenRead('0900').then(promSuccess => {
      for (let c = 0; c < promSuccess.length; c++) {
        this.service9SupportedPIDs[c] = (promSuccess[c] === '1');
      }
    }, promReject => {
      // TODO: figure out what to do when it fails
      console.log(promReject);
    });
  }
}
