import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DarkThemeSwitcherService {

  public enabled: boolean;

  constructor() { }

  enableDarkTheme(enable: boolean): void {
    document.body.classList.toggle("dark", enable);
    this.enabled = enable;
  }
  
}
