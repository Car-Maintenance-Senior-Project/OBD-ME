import { Component, OnInit } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

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
    private OBD: OBDConnectorService
  ) {
    this.initializeApp();
    console.log(window.matchMedia('(prefers-color-scheme: dark)'));
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.OBD.onStartUp();
      this.splashScreen.hide();
    });
  }

}
