import { Component, OnInit } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { DarkThemeSwitcherService } from './services/dark-theme-switcher.service';
import { OBDConnectorService } from './services/obd-connector.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  public selectedIndex = 0; // default to home page as selected for when app starts up with '/' default path
  public appPages = [
    {
      title: 'Home',
      url: '/home',
      icon: 'home'
    },
    {
      title: 'Vehicle Info',
      url: '/vehicle-info',
      icon: 'car'
    },
    {
      title: 'Maintenance Record',
      url: '/maintenance-record',
      icon: 'clipboard'
    },
    {
      title: 'Fuel Economy',
      url: '/fuel-economy',
      icon: 'speedometer'
    }
  ];

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private OBD: OBDConnectorService,
    private darkTheme: DarkThemeSwitcherService
  ) { }

  ngOnInit() {
    const path = window.location.pathname;
    if (path !== undefined) {
      this.selectedIndex = this.appPages.findIndex(page => page.url === path);
    }
    // default route is '/', so we default the selected index to the home page in this case
    if (path === '/') {
      this.selectedIndex = 0;
    }

    // set up auto dark mode tracking, but still allow settings page
    // to handle manual toggling
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)');
    this.darkTheme.enableDarkTheme(prefersDarkMode.matches);
    prefersDarkMode.addListener((mediaQuery) => this.darkTheme.enableDarkTheme(mediaQuery.matches));

    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.OBD.onStartUp();
      this.splashScreen.hide();
    });
  }

}
