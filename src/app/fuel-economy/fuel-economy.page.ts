import { Component, OnInit } from '@angular/core';
import { FuelEconomyService } from '../services/fuel-economy-service.service';

import { ViewChild, ElementRef } from '@angular/core';
import { NavController, Platform } from '@ionic/angular';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import {
  GoogleMaps,
  GoogleMap,
  LatLng,
  GoogleMapsEvent,
  GoogleMapOptions,
  GoogleMapsMapTypeId,
  CameraPosition,
  MarkerOptions,
  Marker,
  Environment,
  PolylineOptions
} from '@ionic-native/google-maps';

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

  constructor(public mpg: FuelEconomyService, 
              public navCtrl: NavController, 
              private plt: Platform, 
              private geolocation: Geolocation,
              public googleMaps: GoogleMaps) { }

  ngOnInit() {
    this.plt.ready().then(() => {
      this.mpg.loadHistoricInfo();
      
      this.map = GoogleMaps.create('map_canvas');
      this.map.one(GoogleMapsEvent.MAP_READY).then(() => {
        this.geolocation.getCurrentPosition().then(pos => {
          let latLng = new LatLng(pos.coords.latitude, pos.coords.longitude);
          this.map.setCameraTarget(latLng);
          this.map.setCameraZoom(16);
          this.map.setMapTypeId(GoogleMapsMapTypeId.ROADMAP);
        }).catch((error) => {
          console.log('Error getting location', error);
        });
      });      
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
        this.trackedRoute.push({ lat: posData.coords.latitude, lng: posData.coords.longitude });
        this.drawSegment(this.trackedRoute[this.trackedRoute.length - 1]);
      });
  }

  drawSegment(coords): any {
    let pathSeg: PolylineOptions;

    if (this.lastCoords != null) {
      let nextColor: string = this.mpg.calcMPG(this.lastCoords, coords);
      pathSeg = {
        points: [this.lastCoords, coords],
        geodesic: true,
        color: nextColor,
      };
      this.map.addPolyline(pathSeg).then(() => {
        this.currentMapTrack.push(pathSeg);
        this.map.setCameraTarget(coords);
      });      
    }

    this.lastCoords = coords;
  }

  redrawPath(path, colors) {
    this.clearCurrentMapTrack();

    for (var i = 0; i < path.length - 1; i++) {
      var pathSeg: PolylineOptions = {
        points: [path[i], path[i + 1]],
        geodesic: true,
        color: colors[i + 1],
      };
      this.map.addPolyline(pathSeg).then(() => {
        this.currentMapTrack.push(pathSeg);
      });      
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
    this.map.clear();
    this.currentMapTrack = [];
  }
}
