/** This page handles the home screen along with getting and showing errors, getting and
 * showing a stock photo of the car, and it uses 2 APIs to do this.  It also allows the user to
 * click on an error code and another page will display more info about the error.
 */
import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';

import { OBDConnectorService } from '../services/obd-connector.service';

import { HTTP } from '@ionic-native/http/ngx';
import { File } from '@ionic-native/file/ngx';
import { Storage } from '@ionic/storage';
import { Base64 } from '@ionic-native/base64/ngx';

import { SafeUrl } from '@angular/platform-browser';
import { StorageKeys } from '../classes/storage-keys';
import { CarProfile } from '../interfaces/car-profile';
import { ErrorCode } from '../interfaces/errorCode';

import { ErrorModalPage } from '../error-modal/error-modal.page';
import { PIDConstants } from '../classes/pidconstants';
import { PIDType } from '../enums/pidtype.enum';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  public image: SafeUrl;
  public errors: ErrorCode[] = [];
  private firstTime = true;

  /**
   * Creates an instance of home page. Runs startup from OBD service
   * @param OBD - The obd connector service
   */
  constructor(
    private OBD: OBDConnectorService,
    private httpNative: HTTP,
    private file: File,
    private store: Storage,
    private base64: Base64,
    public modalCon: ModalController
  ) { }

  /**
   * This function runs whenever the page is viewed.  It either loads in the
   * last used profile or the current one if available.  It then will load pictures
   * and error codes for the profile.
   */
  ionViewDidEnter() {
    // Re init errors to empty
    this.errors = [];
    if (!this.OBD.isLoading) {
      // If profiles are loaded, then parse photos and update errors if its connected
      this.parsePhotos(this.OBD.currentProfile);
      if (this.OBD.isConnected) {
        this.updateErrorCodes();
      } else {
        this.errors = this.OBD.currentProfile.errorCodes;
      }
    } else {
      // If profiles are still loading, load them in yourself
      this.store.get(StorageKeys.CARPROFILES).then((allProfilesTemp) => {
        if (allProfilesTemp === null) {
          allProfilesTemp = [];
        }
        const tempActiveProfile: CarProfile = allProfilesTemp.find((profile) => profile.lastProfile === true);
        if (tempActiveProfile !== undefined) {
          this.parsePhotos(tempActiveProfile);
          this.errors = tempActiveProfile.errorCodes;
        } else {
          this.image = '../../assets/2006-honda-crv.jpg';
          this.errors = [];
        }
      });
    }
  }

  /**
   * Try to grab a photo from the api, download and save it.  If its not in the API
   * then just show a stock photo.
   * @param activeProfile - The car profile to be used when showing a photo
   *
   * API used is https://www.carmd.com/api/ and its used to get the photo of the car
   */
  parsePhotos(activeProfile: CarProfile) {
    // If its a valid profile with no photo saved, then try to get one from the API
    if (
      activeProfile.pictureSaved === false &&
      activeProfile.nickname !== '-1' &&
      !activeProfile.vin.toString().includes('CantGetVin')
    ) {
      this.httpNative
        .get(
          'https://api.carmd.com/v3.0/image?vin=' + activeProfile.vin,
          {},
          {
            'content-type': 'application/json',
            'authorization': 'Basic NTgyMjhmZGUtNGE1Yi00OWZkLThlMzAtNTlhNTU1NzYxYWNi',
            'partner-token': 'dc22f0426ac94a48b7779458ab235e54',
          }
        )
        .then(
          (data) => {
            // If you can get the photo, then download it and change it to Base 64
            this.httpNative
              .downloadFile(
                JSON.parse(data.data).data.image,
                {},
                {},
                this.file.cacheDirectory + '/tempProfilePhoto.jpg'
              )
              .then(
                (suc) => {
                  this.base64
                    .encodeFile(this.file.cacheDirectory + '/tempProfilePhoto.jpg')
                    .then((newData) => {
                      // Then save the image to phone and attach it to the profile.  And display it
                      this.store.set('img:' + activeProfile.vin, newData).then((next) => {
                        activeProfile.pictureSaved = true;
                        this.OBD.saveProfiles();
                        this.displayPhoto(activeProfile);
                      });
                      // Remove temporary downloaded photo
                      this.file.removeFile(this.file.cacheDirectory, 'tempProfilePhoto.jpg');

                      // Catch errors and rejections and just set the photo to be the stock photo
                    })
                    .catch((error) => {
                      console.log('OBDMEDebug: ' + error);
                      this.image = '../../assets/2006-honda-crv.jpg';
                    });
                },
                (rej) => {
                  this.image = '../../assets/2006-honda-crv.jpg';
                }
              );
          },
          (reject) => {
            console.log('OMDMEDebug: error: ' + reject);
            this.image = '../../assets/2006-honda-crv.jpg';
          }
        )
        .catch((error) => {
          this.image = '../../assets/2006-honda-crv.jpg';
        });

      // else if the profile is not valid, set it to the stock img
    } else if (activeProfile.nickname === '-1' || activeProfile.vin.toString().includes('CantGetVin')) {
      this.image = '../../assets/2006-honda-crv.jpg';

      // Else it has to have a saved img, so set it
    } else {
      this.displayPhoto(activeProfile);
    }
  }

  /**
   * Displays photo saved in the given profile
   * @param activeProfile - Car profile with a saved photo
   */
  displayPhoto(activeProfile: CarProfile) {
    this.store.get('img:' + activeProfile.vin).then((photo) => {
      this.image = photo;
    });
  }

  /**
   * Called when an error code is clicked, and uses the provided error code to
   * create a pop up page that displays the error code info.
   * @param code - Error code to show more info about.  Should be from the current profiles errors
   * @returns When the modal is being shown
   */
  async popUp(code: string) {
    const errorToSend: ErrorCode = this.errors.find((error) => error.code === code);
    const modalToBeShown = await this.modalCon.create({
      component: ErrorModalPage,
      componentProps: {
        errorCodeSelect: errorToSend,
      },
    });
    return await modalToBeShown.present();
  }

  /**
   * Updates error codes when there is a car connected, and loads the error codes into page.
   *
   * API used is https://cloud.ibm.com/docs/services/HellaVentures?topic=HellaVentures-gettingstarted_HellaVentures.
   * This api is used to parse error codes
   */
  updateErrorCodes() {
    // Set the local errors to match the current profiles errors
    this.errors = this.OBD.currentProfile.errorCodes;

    // Call the OBD for error codes
    this.OBD.callPID(PIDConstants.errors, PIDType.errors).then(
      (newErrors) => {
        if (newErrors.length === 0) {
          // If there are not error codes get out
          return;
        }
        const newErrorsList = newErrors.split(',');

        // For each error gotten back, see if its already saved, and if not parse it and save it
        // Also a default vin is used due to a bug
        newErrorsList.forEach((newError) => {
          if (this.OBD.currentProfile.errorCodes.find((error) => error.code === newError) === undefined) {
            if (newError !== 'p0000') {
              this.httpNative
                .get(
                  'https://api.eu.apiconnect.ibmcloud.com/hella-ventures-car-diagnostic-api/api/v1/dtc',
                  {
                    client_id: '1ca669fe-9fc7-45a5-aec9-8bfad4f7eee4',
                    client_secret: 'jR1fA2cF0wT5jW3pU4gI7nB8dD4eT1cU3pH1yF6jP4lO1sR5tW',
                    code_id: newError,
                    vin: 'WBA3N5C55FK',
                    language: 'EN',
                  },
                  {
                    accept: 'application/json',
                  }
                )
                .then(
                  (data) => {
                    this.errors.push({
                      code: newError,
                      techDiscription: JSON.parse(data.data).dtc_data.system,
                      severity: 1,
                      longDescription: JSON.parse(data.data).dtc_data.fault,
                    });
                    this.OBD.currentProfile.errorCodes = this.errors;
                    this.OBD.saveProfiles();
                  },
                  (reject) => {
                    console.log('OBDMEDebug: Error: ' + JSON.stringify(reject));
                  }
                );
            }
          }
        });
      },
      (rejected) => {
        // Pid call rejected
      }
    );
  }

  /**
   * Updates error codes sim.  Used to simulate an error code being given from the car
   * and then uses the API to parse it
   */
  updateErrorCodesSim() {
    // Set the local errors to match the current profiles errors
    this.errors = this.OBD.currentProfile.errorCodes;

    // Simulate: Call the OBD for error codes
    const newErrors = 'p0128,p0300,p0440';
    const newErrorsList = newErrors.split(',');

    // For each error gotten back, see if its already saved, and if not parse it and save it
    // Also a default vin is used due to a bug
    newErrorsList.forEach((newError) => {
      if (this.OBD.currentProfile.errorCodes.find((error) => error.code === newError) === undefined) {
        if (newError !== 'p0000') {
          this.httpNative
            .get(
              'https://api.eu.apiconnect.ibmcloud.com/hella-ventures-car-diagnostic-api/api/v1/dtc',
              {
                client_id: '1ca669fe-9fc7-45a5-aec9-8bfad4f7eee4',
                client_secret: 'jR1fA2cF0wT5jW3pU4gI7nB8dD4eT1cU3pH1yF6jP4lO1sR5tW',
                code_id: newError,
                vin: 'WBA3N5C55FK',
                language: 'EN',
              },
              {
                accept: 'application/json',
              }
            )
            .then(
              (data) => {
                this.errors.push({
                  code: newError,
                  techDiscription: JSON.parse(data.data).dtc_data.system,
                  severity: 1,
                  longDescription: JSON.parse(data.data).dtc_data.fault,
                });
                this.OBD.currentProfile.errorCodes = this.errors;
                this.OBD.saveProfiles();
              },
              (reject) => {
                console.log('OBDMEDebug: Error: ' + JSON.stringify(reject));
              }
            );
        }
      }
    });
  }
}
