/** Page is used to edit maintenance records */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';

import { MaintenanceRecordStorageService } from '../services/maintenance-record-storage.service';
import { MaintenanceRecord } from '../interfaces/maintenance-record';

@Component({
  selector: 'app-edit-maintenance-record',
  templateUrl: './edit-maintenance-record.page.html',
  styleUrls: ['./edit-maintenance-record.page.scss'],
})
export class EditMaintenanceRecordPage implements OnInit {
  private id: string;
  private record: MaintenanceRecord;

  constructor(
    private route: ActivatedRoute,
    private storage: MaintenanceRecordStorageService,
    private navController: NavController
  ) { }

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    this.loadRecord();
  }

  // load all records from storage and select the desired one to edit
  loadRecord(): void {
    this.storage.loadRecords();
    this.record = Object.assign({}, this.storage.getRecord(this.id));
  }

  // update a given record, save it, and return to the main maintenance record page
  updateRecord(): void {
    this.storage.setRecord(this.record);
    this.navController.navigateRoot('/maintenance-record');
  }
}
