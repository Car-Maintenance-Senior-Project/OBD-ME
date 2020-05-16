/** This settings page handles dark made and connecting */
import { Component, OnInit } from '@angular/core';
import { Device } from '../interfaces/device-struct';

import { DarkThemeSwitcherService } from '../services/dark-theme-switcher.service';
import { OBDConnectorService } from '../services/obd-connector.service';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  public darkModeChecked: boolean;
  public bluetoothConnected = false;
  public bluetoothChipColor: string = this.bluetoothConnected ? 'success' : 'danger';
  private devices: Device[];
  private chosenMac: string;

  constructor(private darkThemeSwitcher: DarkThemeSwitcherService, private OBD: OBDConnectorService, private store: Storage) { }

  /**
   * on init - checks dark mode, bluetooth status, and get device list
   */
  ngOnInit() {
    this.darkModeChecked = this.darkThemeSwitcher.enabled;
    this.OBD.getPaired().then((resolve) => {
      this.devices = this.OBD.getDeviceList();
      this.bluetoothConnected = this.OBD.isConnected;
    });
  }

  /**
   * Runs everytime a user choses a new mac to connect to.
   * Tries to connect to that mac.
   */
  onChangeOfMac() {
    if (this.chosenMac !== '') {
      this.OBD.connect(this.chosenMac).then(
        (sucsess) => {
          this.bluetoothConnected = this.OBD.isConnected;
        },
        (failure) => {
          this.bluetoothConnected = this.OBD.isConnected;
          this.chosenMac = '';
        }
      );
    }
  }

  deleteAll() {
    this.store.clear();
  }

  // enables dark mode if disabled, or disables it if enabled
  toggleDarkTheme(): void {
    this.darkThemeSwitcher.enableDarkTheme(this.darkModeChecked);
  }
}
