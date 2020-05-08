import { Component, OnInit, NgZone } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';

import { OBDConnectorService } from '../services/obd-connector.service';
import { PIDConstants } from '../classes/pidconstants';
import { PIDType } from '../enums/pidtype.enum';
import { ToastMasterService } from '../services/toast-master.service';

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

  constructor(private ngZone: NgZone, private bs: BluetoothSerial, private obd: OBDConnectorService, private toast: ToastMasterService) {
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
    var regEx = RegExp(/^[0-9]*$/);
    if (this.obd.currentProfile.nickname !== '-1') {
      if (!regEx.test(this.name)) {
        this.obd.changeCurrentName(this.name);
      } else {
        this.toast.errorMessage('Username must have more than numbers');
      }

    }
  }
}
