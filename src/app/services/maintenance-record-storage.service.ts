import { Injectable } from '@angular/core';

import { MaintenanceRecord } from '../interfaces/maintenance-record';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceRecordStorageService {

  public records: MaintenanceRecord[] = [];

  constructor() { 
    this.records = [{
      type: "testType",
      date: new Date(),
      cost: 34,
      notes: "notes",
      id: "1"
    }];
  }

  deleteRecord(record: MaintenanceRecord): void {
    let index = this.records.indexOf(record);

    if (index > -1) {
      this.records.splice(index, 1);
      //TODO: save the new record array in storage
    }
  }

  addRecord(record: MaintenanceRecord): void {
    console.log(record);
    this.records.push({
      type: record.type,
      date: record.date,
      cost: record.cost,
      notes: record.notes,
      id: record.id,  //TODO: figure out how to get consistent ids for the record entries
    });
    //TODO: save the new record in storage
  }
}
