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
  public bluetoothConnected = false;
  public bluetoothChipColor: string = this.bluetoothConnected ? "success" : "danger";
  private devices: Device[];
  private chosenMac: string;

  constructor(
    private darkThemeSwitcher: DarkThemeSwitcherService,
    private OBD: OBDConnectorService) { }

  /**
   * on init - checks dark mode, bluetooth status, and get device list
   */
  ngOnInit() {
    this.darkModeChecked = this.darkThemeSwitcher.enabled;
    this.OBD.getPaired().then(resolve => {
      this.devices = this.OBD.getDeviceList();
<<<<<<< HEAD
      this.bluetoothConnected = this.OBD.isConnected;
=======
    });
    this.OBD.isConnectedFun().then(resolve => {
      this.bluetoothConnected = resolve;
>>>>>>> e51663c65a76ce9bc16770dd9749b1a3897be4d5
    });
  }

  /**
   * Runs everytime a user choses a new mac to connect to.
   * Tries to connect to that mac.
   */
  onChangeOfMac() {
    this.OBD.connect(this.chosenMac).then(sucsess => {
<<<<<<< HEAD
      this.bluetoothConnected = this.OBD.isConnected;
=======
      this.OBD.isConnectedFun().then(resolve => {
        this.bluetoothConnected = resolve;
      });
>>>>>>> e51663c65a76ce9bc16770dd9749b1a3897be4d5
    }, failure => {
      this.bluetoothConnected = this.OBD.isConnected;
      this.chosenMac = '';
    });
  }

  toggleDarkTheme(): void {
    this.darkThemeSwitcher.enableDarkTheme(this.darkModeChecked);
  }

}
