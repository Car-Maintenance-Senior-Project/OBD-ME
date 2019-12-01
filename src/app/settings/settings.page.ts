import { Component, OnInit } from '@angular/core';
import { Device } from '../interfaces/device-struct';

import { DarkThemeSwitcherService } from '../services/dark-theme-switcher.service';
import { OBDConnectorService } from '../services/obd-connector.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {

  public darkModeChecked: boolean;
  public bluetoothConnected: boolean = false;
  public bluetoothChipColor: string = this.bluetoothConnected ? "success" : "danger";
  private devices: Device[];
  private chosenMac: string;
  //TODO: link bluetoothConnected to the actual bluetooth service when it's working

  constructor(private darkThemeSwitcher: DarkThemeSwitcherService, 
              private OBD: OBDConnectorService) { }

  ngOnInit() {
    this.devices = this.OBD.getDeviceList();
  }

  onChangeOfMac() {
    this.OBD.Connect(this.chosenMac).then(sucsess => {
      this.OBD.isConnected().then(resolve => {
        this.bluetoothConnected = resolve;
      });
    }, failure => {
      // console.log('Couldnt connect to selected device');
    });
  }

  toggleDarkTheme(): void {
    this.darkThemeSwitcher.enableDarkTheme(this.darkModeChecked);
  }

}
