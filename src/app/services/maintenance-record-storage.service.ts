import { Injectable } from '@angular/core';

import { Storage } from '@ionic/storage';

import { MaintenanceRecord } from '../interfaces/maintenance-record';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceRecordStorageService {

  public records: MaintenanceRecord[] = [];
  public loaded: boolean = false;

  constructor(private storage: Storage) { }

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
      id: this.generateSlug(record.type),  //TODO: figure out how to get better ids for the record entries
    });
    this.saveRecords();
  }

  saveRecords(): void {
    //TODO: this sorts by descending date by default, eventually add other sort options
    this.records.sort((a,b) => {
      let date1 = a.date;
      let date2 = b.date;
      return date1 > date2 ? -1 : 1;
    });
    this.storage.set('maintenance-records', this.records);
  }

  loadRecords(): Promise<boolean> {
    return new Promise((resolve) => {
      this.storage.get('maintenance-records').then((records) => {
        if (records != null) {
          this.records = records;
        }
        this.loaded = true;
        resolve(true);
      });
    });
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
