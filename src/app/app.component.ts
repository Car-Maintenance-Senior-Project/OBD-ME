import { Component, OnInit } from '@angular/core';

import { DarkThemeSwitcherService } from './services/dark-theme-switcher.service';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit {

  public primaryPages = [
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
    }
  ];

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private darkThemeSwitcher: DarkThemeSwitcherService,
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  ngOnInit() {
    const darkPreferred = window.matchMedia("(prefers-color-scheme: dark)");
    this.darkThemeSwitcher.enableDarkTheme(darkPreferred.matches);

    darkPreferred.addListener(mediaQuery => this.darkThemeSwitcher.enableDarkTheme(mediaQuery.matches));
  }

}
