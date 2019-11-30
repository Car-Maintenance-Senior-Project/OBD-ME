import { Component, NgZone, Injectable } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';

@Injectable({
  providedIn: 'root'
})
export class OBDConnectorService {

  constructor(private ngZone: NgZone, private blueSerial: BluetoothSerial) { }

  private macAddress: string;
  private devices: string[];
  public processing: boolean;


  onStartUp() {
    this.getPaired();
    //Pull saved device if there is one, and connect to it
    //Run useful AT codes
  }

  newConnect(newMacAddress) {
    //disconnect
    //Connect and save the new mac
  }

  getPaired() {
    this.devices = [];
    this.bs.list().then(
      deviceList => {
        deviceList.forEach(device => {
          this.devices.push({"name" : device.name, "id" : device.id, "rssi" : device.class});
        });
        console.log(this.devices);
      }
    );
  }

  isConnected() {
    //return a bool if connected
  }

  read() {
    //Eh, may be useful later
  }

  write() {
    //Given data write it
  }

  writeThenRead() {
    //write and then subscribe for reads
  }

  //Format data
  //Parse data


}
