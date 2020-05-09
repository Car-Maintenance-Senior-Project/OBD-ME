import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

import { OBDConnectorService } from '../services/obd-connector.service';
import { MaintenanceRecord } from '../interfaces/maintenance-record';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceRecordStorageService {

  public records: MaintenanceRecord[] = [];
  public loaded: boolean = false;

  constructor(private storage: Storage, private obd: OBDConnectorService) { }

  deleteRecord(record: MaintenanceRecord): void {
    let index = this.records.indexOf(record);

    if (index > -1) {
      this.records.splice(index, 1);
      this.saveRecords();
    }
  }

  addRecord(record: MaintenanceRecord): void {
    this.records.push({
      type: record.type,
      date: record.date,
      cost: record.cost,
      notes: record.notes,
      id: this.generateSlug(record.type)
    });
    this.saveRecords();
  }

  saveRecords(): void {
    this.records.sort((a,b) => {
      let date1 = a.date;
      let date2 = b.date;
      return date1 > date2 ? -1 : 1;
    });
    this.obd.currentProfile.maintenanceRecords = this.records;
    this.obd.saveProfiles();
  }

  loadRecords() {
    if (this.obd.currentProfile.maintenanceRecords != null) {
      this.records = this.obd.currentProfile.maintenanceRecords
    }
    else {
      this.records = [];
      this.obd.currentProfile.maintenanceRecords = this.records;
      this.obd.saveProfiles();
    }
  }

  getRecord(id: string): MaintenanceRecord {
    return this.records.find(record => record.id === id);
  }

  setRecord(updatedRecord: MaintenanceRecord) {
    let index = this.records.indexOf(this.records.find(record => record.id === updatedRecord.id));
    this.records[index] = updatedRecord;
    this.saveRecords();
  }

  generateSlug(title: string): string {
    // NOTE: This is a simplistic slug generator and will
    // not handle things like special characters
    let slug = title.toLowerCase().replace(/\s+/g, '-');

    // Check if the slug already exists
    let exists = this.records.filter((record) => {
      return record.id.substring(0, slug.length) === slug;
    })

    // If the title is already being used, add a number to make the slug unique
    if (exists.length > 0) {
      slug = slug + exists.length.toString();
    }

    return slug;
  }

}
