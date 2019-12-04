import { Component, OnInit, NgZone } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';

import { OBDConnectorService } from '../services/obd-connector.service';

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
  // private testVin = 'WBA3N5C55FK484549';
  // private vinNum: string;

  constructor(private ngZone: NgZone, private bs: BluetoothSerial, private obd: OBDConnectorService) {
  }

  ngOnInit() {
  }

  /**
   * Gets vehicle info
   */
  getVehicleInfo() {
    this.obd.writeThenRead('09023\r').then(response => {
      this.vin = response;
      this.model = "CRV";
      this.year = "2006";
      this.make = "Honda";
    }, rejection => {
      this.vin = rejection;
      this.model = "CRV";
      this.year = "2006";
      this.make = "Honda";
    });
  }
}
