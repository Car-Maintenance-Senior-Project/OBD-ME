import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { FuelEconomyPage } from './fuel-economy.page';

const routes: Routes = [
  {
    path: '',
    component: FuelEconomyPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [FuelEconomyPage]
})
export class FuelEconomyPageModule {}
