import { Component, OnInit, ViewChild } from '@angular/core';
import { AlertController, NavController } from '@ionic/angular';

import { MaintenanceRecordStorageService } from '../services/maintenance-record-storage.service';
import { IonList } from '@ionic/angular';

@Component({
  selector: 'app-maintenance-record',
  templateUrl: './maintenance-record.page.html',
  styleUrls: ['./maintenance-record.page.scss'],
})
export class MaintenanceRecordPage implements OnInit {

  @ViewChild(IonList, null) recordList: IonList;

  constructor(public recordStorage: MaintenanceRecordStorageService,
              private alertController: AlertController,
              private navController: NavController) {
  }
  
  ngOnInit() {
    this.recordStorage.loadRecords();
  }

  deleteRecord(record): void {
    this.alertController.create({
      header: 'Delete Record?',
      buttons: [
        {
          text: 'Cancel',
          handler: (data) => {
            this.recordList.closeSlidingItems();
          }
        },
        {
          text: 'Delete',
          handler: (data) => {
            this.recordList.closeSlidingItems().then(() => {
              this.recordStorage.deleteRecord(record);
            });
          }
        }
      ]
    }).then((prompt) => {
      prompt.present();
    });    
  }

  editRecord(id: string): void {
    this.recordList.closeSlidingItems().then(() => {
      this.navController.navigateForward("/maintenance-record/" + id);
    });
  }

}
