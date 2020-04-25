import { VINData } from '../interfaces/vindata';
import { FuelEconomyInfo } from '../interfaces/fuel-economy-info';

export interface CarProfile {
    vin: string,
    vinData: VINData,
    nickname: string
    fuelEconomy: FuelEconomyInfo
    // TODO: add maintenance records, etc. as needed
}
