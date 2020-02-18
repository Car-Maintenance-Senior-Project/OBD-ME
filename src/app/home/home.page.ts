import { Component } from '@angular/core';
import { OBDConnectorService } from '../services/obd-connector.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  //TODO: don't use this array, instead import/inject a service and use data from that
  public errors = [
    {
      name: "Error 1"
    },
    {
      name: "Error 2"
    }
  ];

  /**
   * Creates an instance of home page. Runs startup from OBD service
   * @param OBD
   */
  constructor(private OBD: OBDConnectorService) {
    this.OBD.onStartUp().then(resolve => {
      if (resolve) {
        //Device is connected
      } else {
        //Prompt to connect to bluetooth
      }
    }, reject => {
      //Already has been started so do nothing
    });
  }

}
