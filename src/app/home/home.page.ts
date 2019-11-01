import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  vin;
  data2;
  data3;

  constructor() {}

  callGetVINFromParserService() {}
  callGet2FromParserService() {}
  callGet3FromParserService() {}

}
