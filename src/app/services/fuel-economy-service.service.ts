/** This service handles the fuel economy page functions.  It is used to calculate the fuel
 * econ during driving, and the saving and retrieving of old routes.
 */
import { Injectable } from '@angular/core';

import { OBDConnectorService } from '../services/obd-connector.service';

import { FuelEconomyInfo } from '../interfaces/fuel-economy-info';
import { PIDConstants } from '../classes/pidconstants';
import { PIDType } from '../enums/pidtype.enum';

@Injectable({
  providedIn: 'root',
})
export class FuelEconomyService {
  public mpgInfo: FuelEconomyInfo;
  private previousTracks = [];

  // constants for fuel economy calculations
  private readonly AIR_FUEL_RATIO: number = 14.7; // good A/F ratio is 14.7 grams air to 1 gram fuel
  private readonly GASOLINE_DENSITY: number = 6.17; // gasoline is typically 6.17 lb/gal
  private readonly GRAMS_PER_POUND: number = 454;
  private readonly MILES_PER_KM: number = 0.62137119;

  // colors for showing MPG comparison on map
  private readonly GREAT = '#00ff00';
  private readonly GOOD = '#00cc00';
  private readonly AVERAGE = '#ffff00';
  private readonly BAD = '#ff8000';
  private readonly TERRIBLE = '#ff0000';

  constructor(private obd: OBDConnectorService) { }

  // keeps running average of the fuel economy for the current car profile
  private updateAverage(newValue: number) {
    this.mpgInfo.count++;
    const diff = (newValue - this.mpgInfo.mpg) / this.mpgInfo.count;
    this.mpgInfo.mpg += diff;
  }

  /**
   * receives 2 coordinates and determines the fuel economy over the given distance
   * @param coords1 - the x coords
   * @param coords2 - the y coords
   * @param lastTime - last time it was called
   * @returns mpg in current duration
   */
  public calcMPG(coords1, coords2, lastTime): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const distTraveled = this.distance(coords1, coords2); // calculate distance between coordinates (miles)

      let maf: number;

      // retrieve MAF (Mass Air Flow - g/s)
      this.obd.callPID(PIDConstants.MAF, PIDType.MAF).then(
        (data) => {
          maf = parseFloat(data);

          const currentTime = new Date();
          const time = (currentTime.getTime() - lastTime.getTime()) / 1000; // get time since last calculation to determine total air flow

          const airMass = maf * time; // g/s * sec -> just grams of air

          let fuelGals = airMass / this.AIR_FUEL_RATIO / this.GASOLINE_DENSITY / this.GRAMS_PER_POUND;

          // Make sure you aren't div by 0
          if (fuelGals === 0) {
            fuelGals = 0.1;
          }

          const currentMPG = distTraveled / fuelGals;

          this.updateAverage(currentMPG);

          const x = currentMPG / this.mpgInfo.mpg;

          // arbitrary judgement system - can be refined if desired
          let colorString: string;
          if (x < 0.85) {
            colorString = this.GREAT;
          } else if (x >= 0.85 && x < 1.05) {
            colorString = this.GOOD;
          } else if (x >= 1.05 && x < 1.1) {
            colorString = this.AVERAGE;
          } else if (x >= 1.1 && x < 1.2) {
            colorString = this.BAD;
          } else if (x >= 1.2) {
            colorString = this.TERRIBLE;
          }

          resolve(colorString);
        },
        (rejectPid) => {
          reject(rejectPid);
        }
      );
    });
  }

  // determines distance between two coordinates on earth
  private distance(coords1, coords2): number {
    const lat1: number = coords1.lat;
    const lat2: number = coords2.lat;
    const lng1: number = coords1.lng;
    const lng2: number = coords2.lng;

    const p = 0.017453292519943295; // Math.PI / 180
    const x =
      0.5 -
      Math.cos((lat1 - lat2) * p) / 2 +
      (Math.cos(lat2 * p) * Math.cos(lat1 * p) * (1 - Math.cos((lng1 - lng2) * p))) / 2;
    const distance = 12742 * Math.asin(Math.sqrt(x)); // 2 * R; R = 6371 km
    return distance * this.MILES_PER_KM; // convert to miles
  }

  // load in the historic information from the current profile; if none is present, initialize it with default values
  public loadHistoricInfo() {
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
        count: 0,
      };
      this.obd.currentProfile.fuelEconomy = this.mpgInfo;
    }
    this.obd.saveProfiles();
  }

  public deleteHistoricRoutes() {
    this.previousTracks = [];
    this.obd.currentProfile.pastRoutes = [];
    this.obd.saveProfiles();
  }

  public addRoute(newRoute) {
    this.previousTracks.push(newRoute);
    this.obd.currentProfile.pastRoutes = this.previousTracks;
    this.obd.currentProfile.fuelEconomy = this.mpgInfo;
    this.obd.saveProfiles();
  }
}
