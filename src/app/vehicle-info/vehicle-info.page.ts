import { Component, OnInit, NgZone } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';

import { OBDConnectorService } from '../services/obd-connector.service';
import { PIDConstants } from '../classes/pidconstants';
import { PIDType } from '../enums/pidtype.enum';

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

  constructor(private ngZone: NgZone, private bs: BluetoothSerial, private obd: OBDConnectorService) {
  }

  ngOnInit() {
    if (this.obd.currentProfile.nickname !== '-1') {
      this.name = this.obd.currentProfile.nickname;
      this.year = this.obd.currentProfile.vinData.year;
      this.model = this.obd.currentProfile.vinData.model;
      this.make = this.obd.currentProfile.vinData.make;
      this.vin = this.obd.currentProfile.vin;

    }
  }

  changeName() {
    if (this.obd.currentProfile.nickname !== '-1') {
      this.obd.changeCurrentName(this.name);
      this.obd.callPID(PIDConstants.MAF, PIDType.Number).then(data => {
        console.log('OBDMEDebug: numberMAF: ' + data);
      });
    }
  }
}
