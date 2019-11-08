import { Injectable } from '@angular/core';
import 'cap-bluetooth-low-energy-client';
import {Plugins} from '@capacitor/core';

const {BluetoothLEClient} = Plugins;

@Injectable({
  providedIn: 'root'
})
export class OBDParserService {

  constructor() { }

  attemptVin(){
    
  }

}
