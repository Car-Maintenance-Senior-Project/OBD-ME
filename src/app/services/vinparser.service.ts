import { Injectable } from '@angular/core';

import { NHTSA } from '@shaggytools/nhtsa-api-wrapper';

import { VINData } from '../interfaces/vindata';

@Injectable({
  providedIn: 'root'
})
export class VINParserService {
  private nhtsaParser: NHTSA;

  constructor() {
    this.nhtsaParser = new NHTSA();
  }

  async ParseVIN(vin: string): Promise<VINData> {
    const response = await this.nhtsaParser.DecodeVin(vin);

    let vinData: VINData = {
      year: response.Results[9].Value,
      make: response.Results[6].Value.trim(),
      model: response.Results[8].Value.trim()
    };

    return vinData;
  }

}
