import { VINData } from '../interfaces/vindata';
import { FuelEconomyInfo } from '../interfaces/fuel-economy-info';
import { MaintenanceRecord } from '../interfaces/maintenance-record';
import { ErrorCode } from './errorCode';

export interface CarProfile {
    vin: string;
    vinData: VINData;
    nickname: string;
    fuelEconomy: FuelEconomyInfo;
    pastRoutes: any;
    errorCodes: ErrorCode[];
    maintenanceRecords: MaintenanceRecord[];
    lastProfile: boolean;
    pictureSaved: boolean;
}
