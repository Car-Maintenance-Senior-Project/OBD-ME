# OBD & ME

This app was created by tjv37 and QuenMBar for our senior project at Calvin University. To learn more about the app, what it does, and why, go to our website at [https://car-maintenance-senior-project.github.io/OBD-ME/](https://car-maintenance-senior-project.github.io/OBD-ME/). This readme will take you through how to set up the app yourself and how to navigate the code.

## Setting Up Your Machine

To prepare your machine to build this app, you will need a few pieces of software. First, you will need to install Node.js and NPM. A quick guide for doing this can be found [here](https://www.npmjs.com/get-npm).

After those are installed, you will need to install the Ionic Framework. A quick guide for that can be found [here](https://ionicframework.com/docs/intro/cli).

Lastly, you will need to download either Android Studio or Xcode. Currently, this app is only officially supported for Android. Some of the Bluetooth functions may need tweaking in order for it to work on iOS devices. A quick guide for downloading Android Studio can be found [here](https://developer.android.com/studio/install).

Now that NPM, Ionic, and Android Studio are installed, you can clone the git repository to your computer or download it via the zip file.

## Updating APIs

This app uses 3 APIs. At the time of writing, the app has working API keys, but this may not always be the case. I will quickly walk you through how to remake these API keys if it is needed.

### Google Maps

The first API key is the Google Maps key that allows you to use the JavaScript Google Maps API. To remake this key, follow the guide [here](https://developers.google.com/maps/documentation/embed/get-api-key). Once you have your key, you will want to go to the file at `src/index.html` and look for this line:

```html
<script src="https://maps.google.com/maps/api/js?key=[YourKey]"></script>
```

Insert your key where it says `[YourKey]`.

### IBM Cloud

The second API key you will need is from IBM Cloud for their Car Diagnostic API. To do this, follow the guide [here](https://cloud.ibm.com/docs/services/HellaVentures?topic=HellaVentures-gettingstarted_HellaVentures). Once you have the key, it will be used at `src/app/home/home.page.ts` twice for parsing any error codes the car produces. Find the http calls that look like this:

```typescript
this.httpNative.get(
  "https://api.eu.apiconnect.ibmcloud.com/hella-ventures-car-diagnostic-api/api/v1/dtc",
  {
    client_id: "[YourID]",
    client_secret: "[YourSecret]",
    code_id: newError,
    vin: "WBA3N5C55FK",
    language: "EN",
  },
  {
    accept: "application/json",
  }
);
```

and replace `[YourID]` and `[YourSecret]` with the ID and secret that you generated respectively.

### CarMD

This last API is used for parsing the VIN for the year, make, and model of the connected vehicle. It also retrieves a picture of the car for display on the home page. To generate the key, you will need to go [here](https://www.carmd.com/api/) and make an account. Once you do, you can add a new key on the dashboard. Once you add this key, you will need to go to `src/app/home/home.page.ts` and `src/app/services/obd-connector.service.ts` and find

```typescript
this.http.get(
  "https://api.carmd.com/v3.0/decode?vin=" + vinRaw,
  {},
  {
    "content-type": "application/json",
    "authorization": "[YourAuth]",
    "partner-token": "[YourPartner]",
  }
);
```

and replace `[YourAuth]` and `[YourPartner]` with your newly generated authorization and partner tokens. The code on the home page will look slightly different than this.

Having regenerated the API keys, you can now run the code and build the application.

## Running the Code

To run this code, you should open up the terminal that NPM is installed on, and run the following commands.

First, you should run `npm install`. This will install all the NPM packages used in the program.

After that run is finished, run `ionic build`.

The next steps may change depending on the device you're building for. Wherever your see `[device]`, replace it with `android` or `ios` depending on the platform you're looking to build for.

You now should run `npx cap update [device]` and then `npx cap sync [device]`. If you ever build this app again, all you will need to run is `npx cap copy [device]` for this step.

The final command is `npx cap open [device]`, which should open the app in either Android Studio or XCode for you to run and test it.

This is where we should note that we had a dependency issue at one point that was fixed by running `npx npm-force-resolutions` and then following all the steps again. We should also note here that you can run a version of the app in the browser that looks correct but doesn't have many of the functions of the app by using the command `ionic serve`.

## App Overview

This last section will give a brief overview of how the app functions and what the different pages and services are capable of. This does not go over the classes, enums, and interfaces that provide a lot of the structure for this project.

### Pages

---

| Page                | Description                                                                                                                                                                                                                                                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home                | This page has two main functions. First, it will retrieve and display a photo of the car, either from the local storage of the phone or from the CarMD API. Second, it retrieves error codes from the car that is connected and displays them. If you click on an error code, it will create a pop-up with more info about the error. |
| Settings            | The settings page has three functions. First, it is where the user connects to the Bluetooth device. Second, it allows the user to toggle dark mode. Lastly, it is where the user can delete all of their saved data.                                                                                                                                      |
| Vehicle Info        | This page has 3 functions. First, it displays data about the loaded car profile. Second, it allows the user to input a VIN if the OBD is unable to get the VIN. Lastly, it allows the user to change the nickname of the currently loaded profile.                                                                                                           |
| Maintenance Records | This is actually three pages, each with their own functions. The maintenance records page displays a list of all the saved records for the loaded profile and allows for deletion of records with swipe functionality. The add maintenance records page allows the user to save a new record to the device, and the edit maintenance records page allows the user to edit a saved record.                              |
| Fuel Economy        | The fuel economy page has three functions. First, it shows a map using Google Maps and handles geolocation. Second, it handles drawing and redrawing paths on the map with colors based on the fuel economy at various locations on the path. Lastly, it displays a list of saved routes that, if clicked on, will redraw that path on the map.                                                            |

### Services

This is not an exhaustive list of all the functions in these services, but it should be a good overview of what you can do with these services.

---

#### OBD Connector Service

This service handles the phone connecting and communicating to the OBD device, and it also handles managing the car profiles.

---

`onStartUp(): Promise<boolean>`

This function should be run every time the app is started. It connects to the Bluetooth device if one is connected and either grabs the last connected profile or the profile for the car that is connected. If it can't get either of those profiles, it creates a default profile. At the end, it will navigate you to the settings page if the phone didn't connect.

---

`connect(MACAddress?: string): Promise<ConnectResult>`

You can pass a MAC address for a Bluetooth device. If you don't pass one, it will attempt to get the last connected MAC address. It then tries to connect to that MAC address. If it does, it will try and get the VIN number from the OBD. If it can't get the OBD, it creates a fake/mock one. Then, it will parse the VIN number and save it to the phone. It then returns a promise that resolves if it connects, and rejects if it doesn't, and it also resolves and rejects with a connection result.

---

`getPaired(): Promise<string>`

Gets the paired Bluetooth devices for the phone and returns a promise that resolves when the devices have been loaded in.

---

`callPID(pid: string, type: PIDType): Promise<string>`

Pass a PID that the OBD should be requesting the info for. An example would be `'0902\r'` and a full list can be found [here](https://en.wikipedia.org/wiki/OBD-II_PIDs). You also pass a PID type that will be used to parse the hex characters that are returned. The function writes the PID to the OBD and then reads the data that is returned. If the data doesn't exist, the promise it returns will be rejected. If it does have data, it will then parse it given what PID type was passed, and then the promise it returns will be resolved with the parsed data.

---

`changeCurrentName(newName: string): void`

Pass a new name for the profile, change the name of the profile, and save it.

---

`saveProfiles(): Promise<boolean>`

When called, it saves the profiles by using the current VIN to find the profile to update.

---

`saveProfilesChangeVin(newVin: string): Promise<boolean>`

Pass a new VIN for the current profile and save the profiles using the old VIN to find the profile to update. Once found, it will update the VIN and save it.

---

`checkAndChangeVin(vinToCheck: string): Promise<boolean>`

Pass a VIN to find and check to see if the VIN is in a profile that is saved to the phone. If it is, it will change it to be the VIN that is loaded. It returns a promise that resolves if it found and changed the VIN to the one passed.

---

#### Fuel Economy Service

This service handles the fuel economy page functions. It is used to calculate the fuel economy during driving, and the saving and retrieving of old routes.

---

`calcMPG(coords1, coords2, lastTime): Promise<string>`

Pass a pair of coordinates and the last time that the MPG was calculated. It then calculates the current MPG and updates the average MPG. It returns a promise that resolves to the color that corresponds to how good the current MPG is. It also rejects the promise when the PID returns an error.

---

`loadHistoricInfo()`

When called, it loads in the historic information from the current profile. If none is present, initialize it with default values.

---

`deleteHistoricRoutes()`

When called, it deletes the routes that are saved to the phone.

---

`addRoute(newRoute)`

Pass a new route and add it to the routes that are saved to the phone.

---

#### Maintenance Record Service

This service handles adding, getting, deleting, and saving maintenance records.

---

`deleteRecord(record: MaintenanceRecord): void`

Pass a MaintenanceRecord and delete it from the records that are saved to the phone.

---

`addRecord(record: MaintenanceRecord): void`

Pass a MaintenanceRecord and add it to the records that are saved to the phone.

---

`loadRecords()`

Loads the records that are saved to the phone.

---

`getRecord(id: string): MaintenanceRecord`

Pass a record ID and retrieve the record that has that ID.

---

`setRecord(updatedRecord: MaintenanceRecord)`

Pass a MaintenanceRecord that is updated from an old record and save it to the phone.

---

#### Dark Theme and Toast service

These last two services are very simple services. The dark theme service handles switching to dark theme, and the toast service is only for making long toast messages into single line commands that can easily be imported anywhere.
