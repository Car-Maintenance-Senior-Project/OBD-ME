import { Injectable } from '@angular/core';

import { OBDConnectorService } from '../services/obd-connector.service';

import { FuelEconomyInfo } from '../interfaces/fuel-economy-info';
import { PIDConstants } from '../classes/pidconstants';
import { PIDType } from '../enums/pidtype.enum';

@Injectable({
  providedIn: 'root'
})
export class FuelEconomyService {
  public mpgInfo: FuelEconomyInfo;
  private previousTracks = [];

  private readonly AIR_FUEL_RATIO: number = 14.7;          // good A/F ratio is 14.7 grams air to 1 gram fuel
  private readonly GASOLINE_DENSITY: number = 6.17;        // gasoline is typically 6.17 lb/gal
  private readonly GRAMS_PER_POUND: number = 454;

  private readonly MILES_PER_KM: number = 0.62137119;

  // colors for showing MPG comparison on map
  private readonly GREAT = "#00ff00";
  private readonly GOOD = "#00cc00";
  private readonly AVERAGE = "#ffff00";
  private readonly BAD = "#ff8000";
  private readonly TERRIBLE = "#ff0000";

  constructor(private obd: OBDConnectorService) { }

  updateAverage(newValue: number) {
    this.mpgInfo.count++;
    let diff = (newValue - this.mpgInfo.mpg) / this.mpgInfo.count;
    this.mpgInfo.mpg += diff;
  }

  calcMPG(coords1, coords2): string {
    let distTraveled = this.distance(coords1, coords2);

    var maf: number;
    this.obd.callPID(PIDConstants.MAF, PIDType.MAF).then(data => {
      maf = parseFloat(data);
    });

    let fuelGals = maf / this.AIR_FUEL_RATIO / this.GASOLINE_DENSITY / this.GRAMS_PER_POUND;
    let currentMPG = distTraveled / fuelGals;

    this.updateAverage(currentMPG);

    let x = currentMPG / this.mpgInfo.mpg;

    var colorString: string;
    if (x < 0.85) {
      colorString = this.GREAT;
    } else if (x >= 0.85 && x < 1.05) {
      colorString = this.GOOD;
    } else if (x >= 1.05 && x < 1.10) {
      colorString = this.AVERAGE;
    } else if (x >= 1.10 && x < 1.20) {
      colorString = this.BAD;
    } else if (x >= 1.20) {
      colorString = this.TERRIBLE;
    }

    return colorString;
  }

  distance(coords1, coords2): number {
    let lat1: number = coords1.lat;
    let lat2: number = coords2.lat;
    let lng1: number = coords1.lng;
    let lng2: number = coords2.lng;

    let p = 0.017453292519943295;    // Math.PI / 180
    let x = 0.5 - Math.cos((lat1 - lat2) * p) / 2 + Math.cos(lat2 * p) * Math.cos((lat1) * p) * (1 - Math.cos(((lng1 - lng2) * p))) / 2;
    let distance = (12742 * Math.asin(Math.sqrt(x))); // 2 * R; R = 6371 km
    return distance * this.MILES_PER_KM; // convert to miles
  }

  loadHistoricInfo() {
    if (this.obd.currentProfile.pastRoutes != null) {
      this.previousTracks = this.obd.currentProfile.pastRoutes;
    } else {
      this.previousTracks = [];
      this.obd.currentProfile.pastRoutes = this.previousTracks;
    }

    if (this.obd.currentProfile.fuelEconomy != null) {
      this.mpgInfo = this.obd.currentProfile.fuelEconomy;
    } else {
      this.mpgInfo = {
        mpg: 0,
        count: 0
      };
      this.obd.currentProfile.fuelEconomy = this.mpgInfo;
    }
    // TYLER: save profiles
  }

  deleteHistoricRoutes() {
    this.previousTracks = [];
    this.obd.currentProfile.pastRoutes = [];
    // TYLER: save profiles
  }

  addRoute(newRoute) {
    this.previousTracks.push(newRoute);
    this.obd.currentProfile.pastRoutes = this.previousTracks;
    this.obd.currentProfile.fuelEconomy = this.mpgInfo;
    // TYLER: save profiles
  }
}
