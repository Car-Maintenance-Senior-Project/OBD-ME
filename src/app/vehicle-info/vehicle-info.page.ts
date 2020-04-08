import { Component, OnInit, NgZone } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';

import { PidsServiceService } from '../services/pids-service.service';

@Component({
  selector: 'app-vehicle-info',
  templateUrl: './vehicle-info.page.html',
  styleUrls: ['./vehicle-info.page.scss'],
})
export class VehicleInfoPage implements OnInit {

  public year: string;
  public make: string;
  public model: string;
  private vin: string;
  private name: string;
  // private testVin = 'WBA3N5C55FK484549';
  // private vinNum: string;

  constructor(private ngZone: NgZone, private bs: BluetoothSerial, private obd: PidsServiceService) {
  }

  ngOnInit() {
    this.name = this.obd.getProfileName();
  }

  /**
   * Gets vehicle info
   */
  getVehicleInfo() {
    console.log('OBDMEDebug: START of call');
    // this.obd.getSupportedPIDs().then(sucsess => {
    //   const supportedArray = this.obd.getAllPidsSupported();
    //   console.log('OBDMEDebug: gotPids');
    //   this.obd.callOBDPid('09023\r', 'string').then(response => {
    //     console.log('OBDMEDebug: response back: ' + response);
    //     this.vin = response;
    //     this.model = "CRV";
    //     this.year = "2006";
    //     this.make = "Honda";
    //   }, rejection => {
    //     console.log('OBDMEDebug: rejection back: ' + rejection);
    //     this.vin = rejection;
    //     this.model = "CRV";
    //     this.year = "2006";
    //     this.make = "Honda";
    //   });
    //   console.log('OBDMEDebug: finalArray: ' + supportedArray);
    // }, failure => {
    //   console.log('OBDMEDebug: didnt get pids');
    // });
    this.obd.callOBDPid('0300\r', 'number').then(resp => {
      // Make a list of all the things it could be for easy lookup
      this.make = resp;
      // this.obd.callOBDPid('0103\r', 'number').then(resp => {
      //   this.obd.callOBDPid('0102\r', 'number').then(resp => {

      //   }, reje => {
      //     //nothing
      //   });
      // }, reje => {
      //   //nothing
      // });
    }, reje => {
      //nothing
    });
  }
}
