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
