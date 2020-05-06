import { VINData } from '../interfaces/vindata';
import { FuelEconomyInfo } from '../interfaces/fuel-economy-info';
import { MaintenanceRecord } from '../interfaces/maintenance-record';

export interface CarProfile {
    vin: string;
    vinData: VINData;
    nickname: string;
    fuelEconomy: FuelEconomyInfo;
    pastRoutes: any;
    maintenanceRecords: MaintenanceRecord[];
    lastProfile: boolean;
}
