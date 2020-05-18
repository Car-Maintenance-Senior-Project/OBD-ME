/** This page handles getting and displaying Fuel Economy data. It uses the related
 * service to do this.
 */
import { Component, OnInit } from '@angular/core';
import { FuelEconomyService } from '../services/fuel-economy-service.service';

import { ViewChild, ElementRef } from '@angular/core';
import { NavController, Platform } from '@ionic/angular';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

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
  private lastTime: Date = null;
  private positionSubscription: Subscription;

  constructor(
    public mpg: FuelEconomyService,
    public navCtrl: NavController,
    private plt: Platform,
    private geolocation: Geolocation
  ) { }

  // when the platform is ready, initialize the map view and center its view on the current location
  ngOnInit() {
    this.plt.ready().then(() => {
      this.mpg.loadHistoricInfo();

      const mapOptions = {
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      };

      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

      this.geolocation
        .getCurrentPosition()
        .then((pos) => {
          const latLng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
          this.map.setCenter(latLng);
          this.map.setZoom(16);
        })
        .catch((error) => {
          // console.log('Error getting location', error);
        });
    });
  }

  deleteHistoricRoutes() {
    this.mpg.deleteHistoricRoutes();
    this.clearCurrentMapTrack();
  }

  // reset temporary tracking variables and set up position change subscription to draw polyline segments
  startTracking() {
    this.isTracking = true;
    this.trackedRoute = [];
    this.pathColors = [];
    this.lastCoords = null;
    this.lastTime = null;

    this.clearCurrentMapTrack();

    this.positionSubscription = this.geolocation
      .watchPosition()
      .pipe(
        filter((p) => p.coords !== undefined) // filter out errors
      )
      .subscribe((posData) => {
        this.trackedRoute.push({ lat: posData.coords.latitude, lng: posData.coords.longitude });
        this.drawSegment(this.trackedRoute[this.trackedRoute.length - 1]);
      });
  }

  // draw a polyline segment with the given coordinates; only do so if this is not the first set of
  // coordinates generated by the position subscription (b/c there wouldn't be a previous set of
  // coords to reference to generate distance)
  drawSegment(coords): void {
    let pathSeg;

    if (this.lastCoords != null) {
      this.mpg.calcMPG(this.lastCoords, coords, this.lastTime).then(
        (nextColor) => {
          pathSeg = new google.maps.Polyline({
            path: [this.lastCoords, coords],
            geodesic: true,
            strokeColor: nextColor,
            strokeOpacity: 1.0,
            strokeWeight: 3,
          });
          pathSeg.setMap(this.map);
          this.pathColors.push(nextColor);
          this.currentMapTrack.push(pathSeg);
        },
        (reject) => {
          this.stopTracking();
        }
      );
    }
    this.lastCoords = coords;
    this.lastTime = new Date();
  }

  // takes a previously recorded path and draws it on the map
  redrawPath(path, colors) {
    this.clearCurrentMapTrack();

    for (let i = 0; i < path.length - 1; i++) {
      let pathSeg = new google.maps.Polyline({
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

  // unsubscribe from the position change subscription and add the completed route info to the storage
  // for the current car profile
  stopTracking() {
    if (this.isTracking === false) {
      return;
    }
    this.isTracking = false;
    this.positionSubscription.unsubscribe();
    if (this.currentMapTrack) {
      this.clearCurrentMapTrack();

      if (this.trackedRoute.length > 1) {
        const newRoute = { finished: new Date().getTime(), path: this.trackedRoute, colors: this.pathColors };
        this.mpg.addRoute(newRoute);
      }
    }
  }

  showHistoryRoute(path, colors) {
    this.redrawPath(path, colors);
  }

  // clear the map display and reset the temp variable
  clearCurrentMapTrack() {
    this.currentMapTrack.forEach((seg) => {
      seg.setMap(null);
    });
    this.currentMapTrack = [];
  }
}
