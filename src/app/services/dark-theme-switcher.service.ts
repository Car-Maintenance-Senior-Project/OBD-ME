/** This service handles switching to dark theme */
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DarkThemeSwitcherService {
  public enabled: boolean;

  constructor() { }

  // toggles on/off dark mode depending on the desired theme; takes advantage
  // of native device preferences if possible
  enableDarkTheme(enable: boolean): void {
    document.body.classList.toggle('dark', enable);
    this.enabled = enable;
  }
}
