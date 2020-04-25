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
  private intervalTimerID;
  private lastOdometerReading = 1000;

  private TIMER_INTERVAL: number = 1000;
  private AIR_FUEL_RATIO: number = 14.7          // good A/F ratio is 14.7 grams air to 1 gram fuel
  private GASOLINE_DENSITY: number = 6.17        // gasoline is typically 6.17 lb/gal
  private GRAMS_PER_POUND: number = 454

  constructor(private obd: OBDConnectorService) {
    this.mpgInfo = this.obd.currentProfile.fuelEconomy; //TODO: figure out how to get this tied into the current car profile data
    this.mpgInfo = { mpg: 0, count: 0 };
    // this.lastOdometerReading = this.obd.callPID(PIDConstants.) //TODO: get reading from odometer - this requires 4 pieces of data...
  }

  updateAverage(newValue: number) {
    this.mpgInfo.count++;
    let diff = (newValue - this.mpgInfo.mpg) / this.mpgInfo.count;
    this.mpgInfo.mpg += diff;
  }

  startDataCollection() {
    this.intervalTimerID = setInterval(() => {
      // let maf = Number(this.obd.callPID(PIDConstants.MAF, PIDType.Number)); // TODO: get working eventually
      let maf = 10 + (Math.random() * 2)
      let currentOdometer;
      currentOdometer = this.lastOdometerReading + 0.05;
      // this.obd.callPID(PIDConstants.Odometer, PIDType.Number).then(odometerData => {
      //   currentOdometer = this.calculateOdometerReading(odometerData); // TODO: get working eventually
      // }, odometerError => {
      //   // TODO: throw error
      //   return 0
      // });
      let miles = currentOdometer - this.lastOdometerReading;
      this.lastOdometerReading = currentOdometer;
      let currentMPG = miles / (maf / this.AIR_FUEL_RATIO / this.GASOLINE_DENSITY / this.GRAMS_PER_POUND);
      this.updateAverage(currentMPG);
      console.log(this.mpgInfo.mpg);
    }, this.TIMER_INTERVAL);
  }

  stopDataCollection() {
    clearInterval(this.intervalTimerID);
  }

  calculateOdometerReading(obdData: string): number {
    return 0;
  }
}
