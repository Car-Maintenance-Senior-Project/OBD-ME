import { Component, OnInit } from '@angular/core';

import { DarkThemeSwitcherService } from '../services/dark-theme-switcher.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {

  public darkModeChecked: boolean;
  public bluetoothConnected: boolean = false;
  public bluetoothChipColor: string = this.bluetoothConnected ? "success" : "danger";
  //TODO: link bluetoothConnected to the actual bluetooth service when it's working

  constructor(private darkThemeSwitcher: DarkThemeSwitcherService) { }

  ngOnInit() {
  }

  toggleDarkTheme(): void {
    this.darkThemeSwitcher.enableDarkTheme(this.darkModeChecked);
  }

}
