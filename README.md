# OBD & ME

This app was created by Tjv37 and QuenMBar for our senior project at Calvin University. To learn more about the app and why and what it does, go to our website at [https://car-maintenance-senior-project.github.io/OBD-ME/](https://car-maintenance-senior-project.github.io/OBD-ME/). This readme will take you through how to set up the app yourself and how to navigate the code.

## Setting up your machine

To prepare your machine to build this app, you will need a few pieces of software. First you will need to install NodeJs and NPM. A quick guide for doing this can be found at [here](https://www.npmjs.com/get-npm).

After that you will need to install ionic, and a quick guide for that can be found [here](https://ionicframework.com/docs/intro/cli).

Lastly you will need either Android Studio or Xcode. Currently this app is only officially supported for android, and you may need to tweak some of the bluetooth functions for it to work on IOS. To download Android Studio, a quick guide for that can be found [here](https://developer.android.com/studio/install).

Now that npm, ionic, and Android Studio are installed, you can clone the git repository to your computer or download it via the zip file. While I wont go into how this can actually be accomplished, there are many guides for how to use git on the internet.

## Updating APIs

This app also uses 3 APIs to work and while it, at the time of writing, has working API keys, this may not always be the case. I will quickly walk you through how to remake these API keys if it is needed.

### Google maps

The first API key is the google maps API key that allows you to use geolocation and google maps. To remake this key, follow the guide [here](https://developers.google.com/maps/documentation/embed/get-api-key). Once you have your Google Maps Javascript Api Key, you will want to go to the file at `src/index.html` and look for the line that looks like

```html
<script src="https://maps.google.com/maps/api/js?key=[YourKey]"></script>
```

and insert your key where it says `[YourKey]`.

### IBM Cloud

The second API key you will need is from IBM Cloud for their Car Diagnostic API. For a guide on how to do this, follow the guide [here](https://cloud.ibm.com/docs/services/HellaVentures?topic=HellaVentures-gettingstarted_HellaVentures). Once you have the key, it will be used at `src/app/home/home.page.ts` twice for parsing the trouble codes that the car produces. Find the http calls that look like

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

and replace `[YourID]` and `[YourSecret]` with the id and secret that you generated respectively.

### CarMD

This last api is used for parsing the Vin for the year, make, and model, and for getting a picture of what the car looks like. To get the key, you will need to go to [here](https://www.carmd.com/api/) and make an account. Once you do, on the dashboard, you can add a new key. Once you add this key, you will need to go to `src/app/home/home.page.ts` and `src/app/services/obd-connector.service.ts` and find

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

and replace `[YourAuth]` and `[YourPartner]` with your newly generated authorization and partner tokens. The code will look slightly diffentent on the home page than this.

Now that you have remade the APIs, you can now run the code.

## Running the code

To run this code, you should open up the terminal that NPM is installed on, and run the following commands.

First you should run `npm install`. This will install all the npm packages used in the program.

After that run `ionic build`.

Now the next steps may change depending on the device you're building for. Wherever your see `[device]`, replace it with `android` or `ios` depending on which platform you're looking to build for.

You now should run `npx cap update [device]` and then `npx cap sync [device]`. If you ever build this app again, all you will need to run is `npx cap copy [device]` for this step.

The final step for this is `npx cap open [device]`, which should open the app in either Android Studio or XCode for you to run it.

This is where I should note that we had a dependency issue at one point that was fixed by running `npx npm-force-resolutions` and then following all the steps again. I should also note here that you can run a version of the app in the browser that only looks correct but doesn't actually have many of the functions of the app with `ionic serve`.

## App Overview

This last section will give a brief overview of how the app functions, and what the different pages and services are capable of. This does not go over the classes, enums, and interfaces that provide a lot of the structure for this project.

### Pages

---

| Page                | Description                                                                                                                                                                                                                                                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home                | This page has two main functions. First it will get a photo of the car, either from the local storage of the car or from the API car md. THen it will display it. The second function is that it will get error codes from the car that is connected and show those too. If you click on an error code, it will create a pop up with more info about the error. |
| Settings            | The settings page has three functions. First, it is where the user connects to the bluetooth device. Second, it allows the user to toggle dark mode. Lastly, it is also where the user can delete all of their saved data.                                                                                                                                      |
| Vehicle Info        | This page has 3 functions. First it displays all the data about the loaded car profile. Second, it allows the user to input a vin if the OBD is unable to get the vin. Lastly, it allows the user to change the name of the currently loaded profile.                                                                                                           |
| Maintenance Records | This page is actually three pages, each with their own functions. The maintenance records page displays a list of all the saved records for the loaded profile. The add maintenance records page allows the user to save a new record to the device, and the edit maintenance records page allows the user to edit a saved record.                              |
| Fuel Economy        | The fuel economy page has three functions. First it shows a google map and handles geolocation. Second, it handles drawing and redrawing paths on the map with colors based on the given fuel economy. Lastly it displays a list of saved routes that if clicked on will redraw the path on the map.                                                            |

### Services

This is not an exhaustive list of all the functions in these services, but should be a good overview of what you can do with these services.

---

#### OBD Connector Service

This service handles the phone connecting and communicating to the OBD device, and it also handles managing the car profiles.

---

`onStartUp(): Promise<boolean>`

This function should be run every time that app is started. It connects to the bluetooth device if one is connected, and either grabs the last connected profile or the profile for the car that is connected. If it cant get either of those profiles, it creates a default profile. At the end, it will navigate you to the settings page if the phone didn't connect.

---

`connect(MACAddress?: string): Promise<ConnectResult>`

You can pass a MAC address for a bluetooth device. If you don't pass one, it will attempt to get the last connected MAC address. It then try's to connect to that MAC address, and if it does, it will try and get the vin number from the OBD. If it cant get the OBD it creates a mock one. Then it will parse the vin number and save it to the phone. It then returns a promise that resolves if it connects, and reject if it doesn't, and also resolves and rejects with a connection result.

---

`getPaired(): Promise<string>`

Gets the paired bluetooth devices for the phone, and returns a promise that resolves when the devices have been loaded in.

---

`callPID(pid: string, type: PIDType): Promise<string>`

Pass a pid that the OBD should requesting the info for. And example would be `'0902\r'` and they can be found [here](https://en.wikipedia.org/wiki/OBD-II_PIDs). You also pass a pid type that will be used to parse the hex that is returned. The function then writes the pid to the OBD and then reads the data that is returned. If the data doesn't exist, the promise it returns will be rejected. If it does have data, it will then parse it given what PID type was passed, and then the promise it returns will be resolved with the parsed data.

---

`changeCurrentName(newName: string): void`

Pass a new name for the profile, and it will change the name of the profile and save it.

---

`saveProfiles(): Promise<boolean>`

When called, it saves the profiles by using the current vin to find the profile to update.

---

`saveProfilesChangeVin(newVin: string): Promise<boolean>`

Pass a new vin for the current profile, and it will save the profiles using the old vin to find the profile to update. Once found, it will update the vin and save it.

---

`checkAndChangeVin(vinToCheck: string): Promise<boolean>`

Pass a vin to find, and it will check to see if the vin is in a profile that is saved to the phone. If it is, it will change it to be that vin that is loaded. It returns a promise that resolves with if it found and changed the vin to the one passed.

---

#### Fuel Economy Service

This service handles the fuel economy page functions. It is used to calculate the fuel economy during driving, and the saving and retrieving of old routes.

---

`calcMPG(coords1, coords2, lastTime): Promise<string>`

Pass a pair of coordinates and the last time that the MPG was calculated and then it calculates the current mpg, and updates the average mpg. It returns a promise that resolves to the color that corresponds to how good the current mpg is. It also rejects the promise when the pid returns an error.

---

`loadHistoricInfo()`

When called, it loads in the historic information from the current profile, if none is present, initialize it with default values.

---

`deleteHistoricRoutes()`

When called, it deletes the routes that are saved to the phone.

---

`addRoute(newRoute)`

Pass a new route and then adds it from the routes that are saved to the phone.

---

#### Maintenance Record Service

This service handles adding, getting, deleting, and saving records.

---

`deleteRecord(record: MaintenanceRecord): void`

Pass a MaintenanceRecord and then delete it from the records that are saved to the phone.

---

`addRecord(record: MaintenanceRecord): void`

Pass a MaintenanceRecord and then add it from the records that are saved to the phone.

---

`loadRecords()`

Loads the records that are saved to the phone.

---

`getRecord(id: string): MaintenanceRecord`

Pass a record id and then it will return the record that has that id.

---

`setRecord(updatedRecord: MaintenanceRecord)`

Pass a MaintenanceRecord that is updated from an old record and then it saves it to the phone.

---

#### Dark Theme and Toast service

These last two services are very simple services. THe dark theme service is handles switching to dark theme, and the toast service is only for making long toast messages in to single line commands that can easily be imported anywhere.
