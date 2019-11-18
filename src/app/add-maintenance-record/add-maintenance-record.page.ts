import { Component, OnInit } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';

import { MaintenanceRecordStorageService } from '../services/maintenance-record-storage.service';

@Component({
  selector: 'app-add-maintenance-record',
  templateUrl: './add-maintenance-record.page.html',
  styleUrls: ['./add-maintenance-record.page.scss'],
})
export class AddMaintenanceRecordPage implements OnInit {

  type: string;
  dateString: string;
  cost: number;
  notes: string = "";

  constructor(private storageService: MaintenanceRecordStorageService,
              private navController: NavController,
              private toastController: ToastController) { }

  ngOnInit() {
  }

  //TODO: explore using forms/formbuilder, ask Norman about it
  addRecord(): void {
    if (this.type != "" && this.dateString != "" && this.cost != null) {
      this.storageService.addRecord({
        type: this.type,
        date: new Date(this.dateString),
        cost: this.cost,
        notes: this.notes,
        id: "4"
      });
      this.navController.navigateRoot("/maintenance-record");
    } else {
      this.toastController.create({
        message: 'Type, date, and cost fields required',
        duration: 3000,
        animated: true,
        position: "bottom"
      }).then((obj) => {
        obj.present();
      });
    }    
  }
}
