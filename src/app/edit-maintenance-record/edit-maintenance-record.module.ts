import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { EditMaintenanceRecordPage } from './edit-maintenance-record.page';

const routes: Routes = [
  {
    path: '',
    component: EditMaintenanceRecordPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [EditMaintenanceRecordPage]
})
export class EditMaintenanceRecordPageModule {}
