<<<<<<< HEAD
// Constants for PIDs that are called for OBD
=======
// PIDs needed for various pieces of data - used to avoid confusing strings in code, easier to read
>>>>>>> 3824bed87b4a74024696005681edfc8d8d02b27a
export class PIDConstants {
    public static Group1SupportedPIDs1: string = '01001\r';
    public static Group1SupportedPIDs2: string = '01021\r';
    public static Group1SupportedPIDs3: string = '01041\r';
    public static Group1SupportedPIDs4: string = '01061\r';
    public static Group9SupportedPIDs: string = '09001\r';
    public static VIN: string = '09023\r';
    public static MAF: string = '01101\r';
    public static errors: string = '03\r';
}
