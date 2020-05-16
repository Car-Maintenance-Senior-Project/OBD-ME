/**This page shows data about the current car profile.  It shows the vin, make, year,
 * and model along with name of the cars profile.  It also allows you to input a vin if
 * there isnt one, and change the name of the profile.
 */
import { Component, OnInit, NgZone } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';

import { OBDConnectorService } from '../services/obd-connector.service';
import { ToastMasterService } from '../services/toast-master.service';
import { VINData } from '../interfaces/vindata';
import { HTTP } from '@ionic-native/http/ngx';

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
  private vinMock: string;
  private name: string;

  constructor(
    private ngZone: NgZone,
    private bs: BluetoothSerial,
    private obd: OBDConnectorService,
    private toast: ToastMasterService,
    private http: HTTP
  ) { }

  /**
   * On init, set the variables if there is a valid profile
   */
  ngOnInit() {
    if (this.obd.currentProfile.nickname !== '-1') {
      this.name = this.obd.currentProfile.nickname;
      this.year = this.obd.currentProfile.vinData.year;
      this.model = this.obd.currentProfile.vinData.model;
      this.make = this.obd.currentProfile.vinData.make;
      this.vin = this.obd.currentProfile.vin;
      this.vinMock = this.obd.currentProfile.vin;
    }
  }

  /**
   * Changes name of current profile as long as its valid
   */
  changeName() {
    const regEx = RegExp(/^[0-9]*$/);
    if (this.obd.currentProfile.nickname !== '-1') {
      if (!regEx.test(this.name)) {
        this.obd.changeCurrentName(this.name);
      } else {
        this.toast.errorMessage('Username must have more than numbers');
      }
    }
  }

  /**
   * Changes vin, parses it, and then saves the new profile to the current profile
   * TODO: If the vin matches a saved profile, switch to that instead and make it the active profile
   */
  changeVin() {
    this.obd.checkAndChangeVin(this.vin).then(isChanged => {
      if (!isChanged) {
        this.http
          .get(
            'https://api.carmd.com/v3.0/decode?vin=' + this.vin,
            {},
            {
              'content-type': 'application/json',
              'authorization': 'Basic NTgyMjhmZGUtNGE1Yi00OWZkLThlMzAtNTlhNTU1NzYxYWNi',
              'partner-token': 'dc22f0426ac94a48b7779458ab235e54',
            }
          )
          .then(
            (dataBack) => {
              console.log('OBDMEDebug: connectProcess: dataBack: ' + JSON.stringify(dataBack));
              const parsedVin: VINData = {
                year: JSON.parse(dataBack.data).data.year,
                make: JSON.parse(dataBack.data).data.make,
                model: JSON.parse(dataBack.data).data.model,
              };
              console.log('OBDMEDebug: connectProcess: Parsed Vin: ' + JSON.stringify(parsedVin));
              this.obd.saveProfilesChangeVin(this.vin);
              this.obd.currentProfile.vinData = parsedVin;
              this.obd.saveProfiles();
              this.name = this.obd.currentProfile.nickname;
              this.year = this.obd.currentProfile.vinData.year;
              this.model = this.obd.currentProfile.vinData.model;
              this.make = this.obd.currentProfile.vinData.make;
              this.vinMock = this.obd.currentProfile.vin;
              return;
            },
            (webError) => {
              this.toast.errorMessage('Invalid Vin');
              return;
            }
          );
      } else {
        this.name = this.obd.currentProfile.nickname;
        this.year = this.obd.currentProfile.vinData.year;
        this.model = this.obd.currentProfile.vinData.model;
        this.make = this.obd.currentProfile.vinData.make;
        this.vinMock = this.obd.currentProfile.vin;
      }
    });
  }
}
