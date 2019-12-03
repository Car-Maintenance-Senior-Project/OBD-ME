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
  private testVin = 'WBA3N5C55FK484549';
  // private vinNum: string;

  constructor(private ngZone: NgZone, private bs: BluetoothSerial, private obd: OBDConnectorService) {

  }

  ngOnInit() {
    // this.getPaired();
    // this.obd.onStartUp();
  }

  // TODO: get this pulling from the OBD service and retrieving real data
  getVehicleInfo() {
    this.year = "2006";
    this.make = "Honda";
    this.obd.writeThenRead('09023\r').then(response => {
      this.model = "CRV";
      this.vin = response;
    }, rejection => {
      this.model = "CRV";
      this.vin = this.testVin;
    });
  }

  // getPaired() {
  //   this.devices = [];
  //   this.bs.list().then(
  //     deviceList => {
  //       deviceList.forEach(device => {
  //         this.devices.push({"name" : device.name, "id" : device.id, "rssi" : device.class});
  //       });
  //       console.log(this.devices);
  //     }
  //   );
  // }

  // onDeviceDiscovered(devices) {
  //   // console.log('Discovered' + JSON.stringify(device, null, 2));
  //   // console.log(devices);
  //   devices.forEach(device => {
  //     this.devices.push({"name":device.name, "id":device.id, "rssi":device.class});
  //   });
  // }

//   readAgain() {
//     this.bs.read().then(sucsess2 => {
//       console.log('read suc: ' + sucsess2);
//     }, failure2 => {
//       console.log(failure2);
//     });
//   }

//   BSdisconnect() {
//     this.bs.disconnect().then(sucsess => {
//       console.log('Disconnected: ' + sucsess);
//       this.isConnected = false;
//     }, failure => {
//       console.log('Still connected: ' + failure);
//     });
//   }

//   BSconnect() {

//     this.BSdisconnect();

//     // this.bs.connect(this.chosenOne).subscribe(peripheralData => {
//     //   this.displayString2 += "Can connect\n";
//     //   this.displaySub = JSON.stringify(peripheralData, null, 2);
//     //   // this.bs.isConnected().then(
//     //   //   () => {
//     //   //     // console.log('connected');
//     //   //     this.displayString2 += 'connected\n';
//     //   //   },
//     //   //   () => {
//     //   //     // console.log('not connected');
//     //   //     this.displayString2 += 'not connected\n';
//     //   //   }
//     //   // );
//     //   this.bs.write(0x7DF0209015555555555).then(sucsess => {
//     //     this.displayString2 += 'write sucsess\n';
//     //     this.bs.read().then(data => {
//     //       this.displayString2 += 'read sucsess\n';
//     //       this.displayString1 = data + ' ||\\|| ' + JSON.stringify(data);
//     //       this.displaySub = JSON.stringify(peripheralData, null, 2);
//     //     }, fail => {
//     //       this.displayString2 += 'read fail\n';
//     //     });
//     //   }, failure => {
//     //     this.displayString2 += 'write fail\n';
//     //   });
//     // },
//     //   peripheralData => {
//     //     console.log('disconnected');
//     //     this.displayString2 += "Cant connect\n";
//     //   });
//     // }

//     if (this.chosenOne === '') {
//       this.displayStatus = 'Please choose a device to connect to';
//     } else if (this.isConnected === true) {
//       console.log('All ready connected');
//     } else {
//       this.displayStatus = 'Trying to connect!';
//       this.displayIsWorking = 'True';
//       this.bs.connect(this.chosenOne).subscribe(connectionSucsess => {
//         console.log(connectionSucsess);
//         this.displayConnectionStatus = JSON.stringify(connectionSucsess, null, 2);
//         this.displayIsWorking = 'False';
//         this.isConnected = true;
//         this.bs.subscribeRawData().subscribe(data => {
//           console.log('Data: ' + JSON.stringify(data, null, 2));
//           console.log(data);
//           this.bs.read().then(sucsess2 => {
//             console.log('read suc: ' + sucsess2);
//           }, failure2 => {
//             console.log(failure2);
//           });
//         });
//       },
//       connectionFailure => {
//         console.log(connectionFailure);
//         this.displayConnectionStatus = JSON.stringify(connectionFailure, null, 2);
//         this.isConnected = false;
//         this.displayIsWorking = 'False';
//       });
//     }
//   }

//   windowUpdate() {
//     // console.log("HELP");
//     this.update = 'UPDATE';
//   }

//   attemptToWriteData() {
//     if (this.isConnected) {
//       this.bs.write('0902\r').then(sucsess => {
//         console.log('Write sucsess: ' + sucsess);
//         this.displayWriteStatus = 'Did write';
//       }, failure => {
//         console.log('Write failure: ' + failure);
//         this.displayWriteStatus = 'Write failed';
//       });
//     } else {
//       console.log('Not connected yet');
//       this.displayStatus = 'Couldnt write';
//     }
//   }
}
