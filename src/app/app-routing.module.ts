import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)},
  { path: 'settings', loadChildren: './settings/settings.module#SettingsPageModule' },
  { path: 'vehicle-info', loadChildren: './vehicle-info/vehicle-info.module#VehicleInfoPageModule' },
  { path: 'maintenance-schedule', loadChildren: './maintenance-schedule/maintenance-schedule.module#MaintenanceSchedulePageModule' },
  { path: 'maps', loadChildren: './maps/maps.module#MapsPageModule' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
