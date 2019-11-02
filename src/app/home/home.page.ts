import { Component } from '@angular/core';
import { OBDParserService } from '../services/obdparser.service'

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  vin: string = "";
  data2: string = "";
  data3: string = "";

  constructor(private obdService: OBDParserService) {}

  callGetVINFromParserService() {
    this.vin = "test";
  }
  callGet2FromParserService() {}
  callGet3FromParserService() {}

}
