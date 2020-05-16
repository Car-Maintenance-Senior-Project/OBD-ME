// Interface for storing a maintenance record
export interface MaintenanceRecord {
    type: string;
    date: Date;
    cost: number;
    notes: string;
    id: string;
}
