import { Component, OnInit } from '@angular/core';
import { FuelEconomyService } from '../services/fuel-economy-service.service';

import { ViewChild, ElementRef } from '@angular/core';
import { NavController, Platform } from '@ionic/angular';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Storage } from '@ionic/storage';

import { StorageKeys } from '../classes/storage-keys';

declare var google;

@Component({
  selector: 'app-fuel-economy',
  templateUrl: './fuel-economy.page.html',
  styleUrls: ['./fuel-economy.page.scss'],
})
export class FuelEconomyPage implements OnInit {
  @ViewChild('map', null) mapElement: ElementRef;
  map: any;
  currentMapTrack = [];

  isTracking = false;
  trackedRoute = [];
  pathColors = [];
  lastCoords = null;
  colors = ["#b35a55", "#7fe5f0", "#ff0000", "#ff80ed"];
  previousTracks = [];

  positionSubscription: Subscription;

  constructor(private mpg: FuelEconomyService, public navCtrl: NavController, private plt: Platform, private geolocation: Geolocation, private storage: Storage) {
    // this.mpg.startDataCollection();
    // setTimeout(() => this.mpg.stopDataCollection(), 10000);
  }

  ngOnInit  () {
    this.plt.ready().then(() => {
      this.loadHistoricRoutes();

      let mapOptions = {
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      }

      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

      this.geolocation.getCurrentPosition().then(pos => {
        let latLng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        this.map.setCenter(latLng);
        this.map.setZoom(16);
      }).catch((error) => {
        console.log('Error getting location', error);
      });
    });
  }

  loadHistoricRoutes() {
    this.storage.get('routes').then(data => {
      if (data) {
        this.previousTracks = data;
      }
    });
  }

  deleteHistoricRoutes() {
    this.storage.set('routes', null);
    this.previousTracks = [];
    this.clearCurrentMapTrack();
  }

  startTracking() {
    this.isTracking = true;
    this.trackedRoute = [];
    this.pathColors = [];
    this.lastCoords = null;

    // TODO: initialize fuel economy tracker w/ first odometer point

    this.clearCurrentMapTrack();

    this.positionSubscription = this.geolocation.watchPosition()
      .pipe(
        filter((p) => p.coords !== undefined) //Filter Out Errors
      )
      .subscribe(posData => {
        // setTimeout(() => {
          // TODO: get current MPG and use it to determine the color to use
          this.trackedRoute.push({lat: posData.coords.latitude, lng: posData.coords.longitude});
          this.pathColors.push(this.colors[Math.floor(Math.random() * this.colors.length)]);
          this.drawSegment(this.trackedRoute[this.trackedRoute.length - 1], this.pathColors[this.pathColors.length - 1])       
        // }, 0);
      });
  }

  drawSegment(coords, color): any {
    let pathSeg;

    if (this.lastCoords != null) {
      pathSeg = new google.maps.Polyline({
        path: [this.lastCoords, coords],
        geodesic: true,
        strokeColor: color,
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
        path: [path[i], path[i+1]],
        geodesic: true,
        strokeColor: colors[i+1],
        strokeOpacity: 1.0,
        strokeWeight: 3,
      });
      pathSeg.setMap(this.map);
      this.currentMapTrack.push(pathSeg);
    }
  }

  stopTracking() {
    this.isTracking = false;
    this.positionSubscription.unsubscribe();
    if (this.currentMapTrack) {
      this.clearCurrentMapTrack()

      if (this.trackedRoute.length > 1) {
        let newRoute = { finished: new Date().getTime(), path: this.trackedRoute, colors: this.pathColors };
        this.previousTracks.push(newRoute);
        this.storage.set('routes', this.previousTracks);
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
