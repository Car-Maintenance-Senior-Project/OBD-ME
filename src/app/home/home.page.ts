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
    public modalCon: ModalController) {
  }

  ionViewDidEnter() {
    this.errors = [];
    if (!this.OBD.isLoading) {
      console.log('OBDMEDebug: Loading Home Page 1');
      this.parsePhotos(this.OBD.currentProfile);
      if (this.OBD.isConnected) {
        this.updateErrorCodes();
      }
    } else {
      console.log('OBDMEDebug: Loading Home Page 2');
      this.store.get(StorageKeys.CARPROFILES).then(allProfilesTemp => {
        if (allProfilesTemp === null) {
          allProfilesTemp = [];
        }
        const tempActiveProfile: CarProfile = allProfilesTemp.find(profile => profile.lastProfile === true);
        if (tempActiveProfile !== undefined) {
          this.parsePhotos(tempActiveProfile);
          this.errors = tempActiveProfile.errorCodes;
        } else {
          this.image = '../../assets/2006-honda-crv.jpg';
          this.errors = [];
        }
      });
    }
    console.log('OBDMEDebug: errors: ' + JSON.stringify(this.errors));
  }

  parsePhotos(activeProfile: CarProfile) {
    console.log('OBDMEDebug: Starting Photos: ' + activeProfile.vin.toString().includes('CantGetVin'));
    if (activeProfile.pictureSaved === false &&
      activeProfile.nickname !== '-1' &&
      !activeProfile.vin.toString().includes('CantGetVin')) {
      console.log('OBDMEDebug: Command: ' + 'https://api.carmd.com/v3.0/image?vin=' + activeProfile.vin);
      this.httpNative.get('https://api.carmd.com/v3.0/image?vin=' + activeProfile.vin, {}, {
        'content-type': 'application/json',
        'authorization': 'Basic NTgyMjhmZGUtNGE1Yi00OWZkLThlMzAtNTlhNTU1NzYxYWNi',
        'partner-token': 'dc22f0426ac94a48b7779458ab235e54'
      }).then(data => {
        console.log('OBDMEDebug: Return: ' + JSON.stringify(data) + 'and: ' + JSON.stringify(JSON.parse(data.data).data.image));
        this.httpNative.downloadFile(JSON.parse(data.data).data.image,
          {}, {}, this.file.cacheDirectory + '/tempProfilePhoto.jpg').then(suc => {
            this.base64.encodeFile(this.file.cacheDirectory + '/tempProfilePhoto.jpg').then(newData => {
              console.log('OBDMEDebug: PictureJSON: ' + JSON.stringify(newData));
              this.store.set('img:' + activeProfile.vin, newData).then(next => {
                activeProfile.pictureSaved = true;
                console.log('OBDMEDebug: SavingPhoto: ' + JSON.stringify(activeProfile));
                this.OBD.saveProfiles();
                this.displayPhoto(activeProfile);
              });
              this.file.removeFile(this.file.cacheDirectory, 'tempProfilePhoto.jpg');
            }).catch(error => {
              console.log('OBDMEDebug: ' + error);
              this.image = '../../assets/2006-honda-crv.jpg';
            });
          }, rej => {
            this.image = '../../assets/2006-honda-crv.jpg';
          });
      }, reject => {
        console.log('OMDMEDebug: error: ' + reject);
        this.image = '../../assets/2006-honda-crv.jpg';
      }).catch(error => {
        this.image = '../../assets/2006-honda-crv.jpg';
      });
    } else if (activeProfile.nickname === '-1' || activeProfile.vin.toString().includes('CantGetVin')) {
      this.image = '../../assets/2006-honda-crv.jpg';
    } else {
      console.log('OBDMEDebug: KILL IT');
      this.displayPhoto(activeProfile);
    }
  }

  displayPhoto(activeProfile: CarProfile) {
    this.store.get('img:' + activeProfile.vin).then(photo => {
      this.image = photo;
    });
  }

  async popUp(code: string) {
    const errorToSend: ErrorCode = this.errors.find(error => error.code === code);
    const modalToBeShown = await this.modalCon.create({
      component: ErrorModalPage,
      componentProps: {
        errorCodeSelect: errorToSend
      }
    });
    return await modalToBeShown.present();
  }

  updateErrorCodes() {
    this.errors = this.OBD.currentProfile.errorCodes;
    this.OBD.callPID(PIDConstants.errors, PIDType.errors).then(newErrors => {
      if (newErrors.length === 0) {
        return;
      }
      const newErrorsList = newErrors.split(',');
      console.log('OBDMEDebug: newErrorsList: ' + newErrors.length + JSON.stringify(newErrorsList));
      newErrorsList.forEach(newError => {
        if (this.OBD.currentProfile.errorCodes.find(error => error.code === newError) === undefined) {
          // get error and add it
          console.log('OBDMEDebug: itStart: ' + newError);
          if (newError !== 'p0000') {
            this.httpNative.get('https://api.eu.apiconnect.ibmcloud.com/hella-ventures-car-diagnostic-api/api/v1/dtc', {
              client_id: '1ca669fe-9fc7-45a5-aec9-8bfad4f7eee4',
              client_secret: 'jR1fA2cF0wT5jW3pU4gI7nB8dD4eT1cU3pH1yF6jP4lO1sR5tW',
              code_id: newError,
              vin: 'WBA3N5C55FK',
              language: 'EN'
            }, {
              accept: 'application/json'
            }).then(data => {
              console.log('OBDMEDebug: it: ' + JSON.stringify(JSON.parse(data.data).dtc_data));
              this.errors.push({
                code: newError,
                techDiscription: JSON.parse(data.data).dtc_data.system,
                severity: 1,
                longDescription: JSON.parse(data.data).dtc_data.fault
              });
              this.OBD.currentProfile.errorCodes = this.errors;
              this.OBD.saveProfiles();
            }, reject => {
              console.log('OBDMEDebug: it2: ' + JSON.stringify(reject));
            });
          }

        }
      });
    }, rejected => {
      // Pid call rejected
    });
  }


  /**
   * Updates error codes sim.  Used to simulate an error code being given
   */
  updateErrorCodesSim() {
    this.errors = this.OBD.currentProfile.errorCodes;
    // this.OBD.callPID(PIDConstants.errors, PIDType.errors).then(newErrors => {
    const newErrors = 'p0128,p0300,p0440';
    const newErrorsList = newErrors.split(',');
    newErrorsList.forEach(newError => {
      if (this.OBD.currentProfile.errorCodes.find(error => error.code === newError) === undefined) {
        // get error and add it
        console.log('OBDMEDebug: itStart: ');
        this.httpNative.get('https://api.eu.apiconnect.ibmcloud.com/hella-ventures-car-diagnostic-api/api/v1/dtc', {
          client_id: '1ca669fe-9fc7-45a5-aec9-8bfad4f7eee4',
          client_secret: 'jR1fA2cF0wT5jW3pU4gI7nB8dD4eT1cU3pH1yF6jP4lO1sR5tW',
          code_id: newError,
          vin: 'WBA3N5C55FK',
          language: 'EN'
        }, {
          accept: 'application/json'
        }).then(data => {
          console.log('OBDMEDebug: it: ' + JSON.stringify(JSON.parse(data.data).dtc_data));
          this.errors.push({
            code: newError,
            techDiscription: JSON.parse(data.data).dtc_data.system,
            severity: 1,
            longDescription: JSON.parse(data.data).dtc_data.fault
          });
          this.OBD.currentProfile.errorCodes = this.errors;
          this.OBD.saveProfiles();
        }, reject => {
          console.log('OBDMEDebug: it2: ' + JSON.stringify(reject));
        });
      }
    });
    // }, rejected => {
    //   // Pid call rejected
    // });
  }

}
