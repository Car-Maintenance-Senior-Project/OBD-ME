import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  //TODO: don't use this array, instead import/inject a service and use data from that
  public errors = [
    {
      name: "test1"
    },
    {
      name: "test2"
    }
  ];

  constructor() {}

}
