import { Component } from '@angular/core';
import { FuelEconomyService } from '../services/fuel-economy-service.service';
import { OBDConnectorService } from '../services/obdconnector.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(private mpg: FuelEconomyService) {
    this.mpg.startDataCollection();
    setTimeout(() => this.mpg.stopDataCollection(), 10000);
  }

}
