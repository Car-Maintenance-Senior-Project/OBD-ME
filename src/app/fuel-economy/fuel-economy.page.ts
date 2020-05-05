import { Component, OnInit } from '@angular/core';
import { FuelEconomyService } from '../services/fuel-economy-service.service';

import { ViewChild, ElementRef } from '@angular/core';
import { NavController, Platform } from '@ionic/angular';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Storage } from '@ionic/storage';

import { OBDConnectorService } from '../services/obd-connector.service';

declare var google;

@Component({
  selector: 'app-fuel-economy',
  templateUrl: './fuel-economy.page.html',
  styleUrls: ['./fuel-economy.page.scss'],
})
export class FuelEconomyPage implements OnInit {
  @ViewChild('map', null) mapElement: ElementRef;
  private map: any;
  private currentMapTrack = [];

  private isTracking = false;
  private trackedRoute = [];
  private pathColors = [];
  private lastCoords = null;

  colors = ["#b35a55", "#7fe5f0", "#ff0000", "#ff80ed"];

  private positionSubscription: Subscription;

  constructor(
    private mpg: FuelEconomyService,
    public navCtrl: NavController,
    private plt: Platform,
    private geolocation: Geolocation) { }

  ngOnInit() {
    console.log('OBDMEDebug: Geolocation: start');
    this.plt.ready().then(() => {
      this.mpg.loadHistoricInfo();
      console.log('OBDMEDebug: Geolocation: start1');

      const mapOptions = {
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      };

      console.log('OBDMEDebug: Geolocation: start2');

      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

      console.log('OBDMEDebug: Geolocation: start3');

      this.geolocation.getCurrentPosition().then(pos => {
        let latLng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        this.map.setCenter(latLng);
        this.map.setZoom(16);
      }).catch((error) => {
        console.log('Error getting location', error);
      });
      console.log('OBDMEDebug: Geolocation: start4');
    });
  }

  deleteHistoricRoutes() {
    this.mpg.deleteHistoricRoutes();
    this.clearCurrentMapTrack();
  }

  startTracking() {
    this.isTracking = true;
    this.trackedRoute = [];
    this.pathColors = [];
    this.lastCoords = null;

    this.clearCurrentMapTrack();

    //TYLER: maybe have to change to manual time-based checking if subscription updates too fast
    this.positionSubscription = this.geolocation.watchPosition()
      .pipe(
        filter((p) => p.coords !== undefined) //Filter Out Errors
      )
      .subscribe(posData => {
        // TODO: get current MPG and use it to determine the color to use
        this.trackedRoute.push({ lat: posData.coords.latitude, lng: posData.coords.longitude });
        this.drawSegment(this.trackedRoute[this.trackedRoute.length - 1]);
      });
  }

  drawSegment(coords): any {
    let pathSeg;

    if (this.lastCoords != null) {
      let nextColor: string = this.mpg.calcMPG(this.lastCoords, coords);
      pathSeg = new google.maps.Polyline({
        path: [this.lastCoords, coords],
        geodesic: true,
        strokeColor: nextColor,
        strokeOpacity: 1.0,
        strokeWeight: 3,
      });
      pathSeg.setMap(this.map);
      this.currentMapTrack.push(pathSeg);
    }

    this.lastCoords = coords;
  }

  redrawPath(path, colors) {
    this.clearCurrentMapTrack();

    for (var i = 0; i < path.length - 1; i++) {
      var pathSeg = new google.maps.Polyline({
        path: [path[i], path[i + 1]],
        geodesic: true,
        strokeColor: colors[i + 1],
        strokeOpacity: 1.0,
        strokeWeight: 3,
      });
      pathSeg.setMap(this.map);
      this.currentMapTrack.push(pathSeg);
    }
  }

  stopTracking() {
    if (this.isTracking == false) {
      return
    }
    this.isTracking = false;
    this.positionSubscription.unsubscribe();
    if (this.currentMapTrack) {
      this.clearCurrentMapTrack()

      if (this.trackedRoute.length > 1) {
        let newRoute = { finished: new Date().getTime(), path: this.trackedRoute, colors: this.pathColors };
        this.mpg.addRoute(newRoute);
      }
    }
  }

  showHistoryRoute(path, colors) {
    this.redrawPath(path, colors);
  }

  clearCurrentMapTrack() {
    this.currentMapTrack.forEach(seg => {
      seg.setMap(null);
    });
    this.currentMapTrack = [];
  }
}