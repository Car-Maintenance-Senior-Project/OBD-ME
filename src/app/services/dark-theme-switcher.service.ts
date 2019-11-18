import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DarkThemeSwitcherService {

  constructor() { }

  enableDarkTheme(enable: boolean): void {
    document.body.classList.toggle("dark", enable);
  }
  
}
