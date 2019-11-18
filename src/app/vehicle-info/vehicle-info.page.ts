import { Component, OnInit, NgZone } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';

@Component({
  selector: 'app-vehicle-info',
  templateUrl: './vehicle-info.page.html',
  styleUrls: ['./vehicle-info.page.scss'],
})
export class VehicleInfoPage implements OnInit {

  // public year: string;
  // public make: string;
  // public model: string;  

  devices: any[] = [];

  chosenOne:string = 'DC:0D:30:4F:49:FD';
  displayString1: any = "";
  displayString2: any = "";
  displaySub: any = "";

  constructor(private ngZone: NgZone, private bs: BluetoothSerial) {

  }

  ngOnInit() {
  }

  //TODO: get this pulling from the OBD service and retrieving real data
  // getVehicleInfo() {
  //   this.year = "2006";
  //   this.make = "Honda";
  //   this.model = "CRV";
  // }

  getPaired(){
    this.devices = [];
    this.bs.list().then(
      device => {this.onDeviceDiscovered(device);}
    );
  }
  onDeviceDiscovered(devices) {
    // console.log('Discovered' + JSON.stringify(device, null, 2));
    console.log(devices)
    devices.forEach(device => {
      this.devices.push({"name":device.name, "id":device.id, "rssi":device.class});
    });
  }

  BSconnect() {

    this.bs.connect(this.chosenOne).subscribe(peripheralData => {
      this.displayString2 += "Can connect\n";
      this.displaySub = JSON.stringify(peripheralData, null, 2);
      // this.bs.isConnected().then(
      //   () => {
      //     // console.log('connected');
      //     this.displayString2 += 'connected\n';
      //   },
      //   () => {
      //     // console.log('not connected');
      //     this.displayString2 += 'not connected\n';
      //   }
      // );
      this.bs.write(0x7DF0209015555555555).then(sucsess => {
        this.displayString2 += 'write sucsess\n';
        this.bs.read().then(data => {
          this.displayString2 += 'read sucsess\n';
          this.displayString1 = data + ' ||\\|| ' + JSON.stringify(data);
          this.displaySub = JSON.stringify(peripheralData, null, 2);
        }, fail => {
          this.displayString2 += 'read fail\n';
        });
      }, failure => {
        this.displayString2 += 'write fail\n';
      });
    },
      peripheralData => {
        console.log('disconnected');
        this.displayString2 += "Cant connect\n";
      });
    }

}
