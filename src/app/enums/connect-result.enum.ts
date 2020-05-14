// enum that represents the various results that can occur during Bluetooth connect
// to the OBD device
export enum ConnectResult {
    Success = 0,
    Failure = 1,
    BluetoothDisabledFail = 2,
    DisconnectFail = 3,
    NoGivenOrStoredMAC = 4
}
