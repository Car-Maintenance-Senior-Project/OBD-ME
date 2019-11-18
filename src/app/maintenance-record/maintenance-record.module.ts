import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { MaintenanceRecordPage } from './maintenance-record.page';

const routes: Routes = [
  {
    path: '',
    component: MaintenanceRecordPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [MaintenanceRecordPage]
})
export class MaintenanceRecordPageModule {}
