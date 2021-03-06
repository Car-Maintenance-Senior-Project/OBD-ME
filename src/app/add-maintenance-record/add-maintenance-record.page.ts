/** This page is used for adding maintenance records */
import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

import { MaintenanceRecordStorageService } from '../services/maintenance-record-storage.service';
import { ToastMasterService } from '../services/toast-master.service';

@Component({
  selector: 'app-add-maintenance-record',
  templateUrl: './add-maintenance-record.page.html',
  styleUrls: ['./add-maintenance-record.page.scss'],
})
export class AddMaintenanceRecordPage implements OnInit {
  type: string;
  date: any;
  cost: number;
  notes = '';

  constructor(
    private storageService: MaintenanceRecordStorageService,
    private navController: NavController,
    private toastMaster: ToastMasterService
  ) { }

  ngOnInit() { }

  // create, initialize, and add record with given parameters
  addRecord(): void {
    if (this.type !== '' && this.date != null && this.cost != null) {
      this.storageService.addRecord({
        type: this.type,
        date: this.date,
        cost: this.cost,
        notes: this.notes,
        id: '',
      });
      this.navController.navigateRoot('/maintenance-record');
    } else {
      this.toastMaster.fieldsNotFilled();
    }
  }
}
