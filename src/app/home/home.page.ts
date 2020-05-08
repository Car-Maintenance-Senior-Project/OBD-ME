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

  // TODO: don't use this array, instead import/inject a service and use data from that
  // public errors: ErrorCode[] = [
  //   {
  //     code: 'C0300',
  //     techDiscription: 'This is a short des',
  //     severity: 2,
  //     longDescription: 'hfkdjshfkljhdasklfjhlksdjnf sadfh sdakjhf ksjadhfjhsd' +
  //       'fhsadjh fkjdshah h hjskafh sadjhfkjsdhjhakfj hhs ahfs' +
  //       ' kjhafkjhdsfkh '
  //   }, {
  //     code: 'C0301',
  //     techDiscription: 'This is a short des',
  //     severity: 1,
  //     longDescription: 'hfkdjshfkljhdasklfjhlksdjnf sadfh sdakjhf ksjadhfjhsd' +
  //       'fhsadjh fkjdshah h hjskafh sadjhfkjsdhjhakfj hhs ahfs' +
  //       ' kjhafkjhdsfkh '
  //   }, {
  //     code: 'C0302',
  //     techDiscription: 'This is a short des',
  //     severity: 2,
  //     longDescription: 'hfkdjshfkljhdasklfjhlksdjnf sadfh sdakjhf ksjadhfjhsd' +
  //       'fhsadjh fkjdshah h hjskafh sadjhfkjsdhjhakfj hhs ahfs' +
  //       ' kjhafkjhdsfkh '
  //   }
  // ];
  public image: SafeUrl;
  public errors: ErrorCode[];
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
    console.log('OBDMEDebug: Loading Home Page');
    if (!this.OBD.isLoading) {
      this.parsePhotos(this.OBD.currentProfile);
      if (this.OBD.currentProfile.nickname !== '-1') {
        this.updateErrorCodes();
      }
    } else {
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
  }

  ngOnInit() {
  }

  parsePhotos(activeProfile: CarProfile) {
    console.log('OBDMEDebug: Starting Photos');
    if (activeProfile.pictureSaved === false && activeProfile.nickname !== '-1') {
      console.log('OBDMEDebug: Command: ' + 'https://api.carmd.com/v3.0/image?vin=' + activeProfile.vin);
      this.httpNative.get('https://api.carmd.com/v3.0/image?vin=' + activeProfile.vin, {}, {
        'content-type': 'application/json',
        'authorization': 'Basic NTgyMjhmZGUtNGE1Yi00OWZkLThlMzAtNTlhNTU1NzYxYWNi',
        'partner-token': 'dc22f0426ac94a48b7779458ab235e54'
      }).then(data => {
        console.log('OBDMEDebug: Return: ' + JSON.stringify(data) + 'and: ' + JSON.stringify(JSON.parse(data.data).data.image));
        this.httpNative.downloadFile(JSON.parse(data.data).data.image,
          {}, {}, this.file.cacheDirectory + '/tempProfilePhoto.jpg').then(suc => {
            this.file.resolveDirectoryUrl(this.file.cacheDirectory).then(data => {
              this.base64.encodeFile(this.file.cacheDirectory + '/tempProfilePhoto.jpg').then(newData => {
                console.log('OBDMEDebug: PictureJSON: ' + JSON.stringify(newData));
                this.store.set('img:' + activeProfile.vin, newData).then(next => {
                  activeProfile.pictureSaved = true;
                  this.OBD.saveProfiles();
                  this.displayPhoto(activeProfile);
                });
                this.file.removeFile(this.file.cacheDirectory, 'tempProfilePhoto.jpg');
              }).catch(error => {
                console.log('OBDMEDebug: ' + error);
                this.image = '../../assets/2006-honda-crv.jpg';
              });
            });
          }, rej => {
            this.image = '../../assets/2006-honda-crv.jpg';
          });
      }, reject => {
        this.image = '../../assets/2006-honda-crv.jpg';
      }).catch(error => {
        this.image = '../../assets/2006-honda-crv.jpg';
      });
    } else if (activeProfile.nickname === '-1') {
      this.image = '../../assets/2006-honda-crv.jpg';
    } else {
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

  async updateErrorCodes() {
    this.errors = this.OBD.currentProfile.errorCodes;
    await this.OBD.callPID(PIDConstants.errors, PIDType.errors).then(newErrors => {
      const newErrorsList = newErrors.split(',');
      newErrorsList.forEach(async newError => {
        if (this.OBD.currentProfile.errorCodes.find(error => error.code === newError) === undefined) {
          // get error and add it
          await this.httpNative.get('http://api.carmd.com/v3.0/diag?vin=' + this.OBD.currentProfile.vin
            + '&mileage=50000&dtc=' + 'p0420', {}, {
            'content-type': 'application/json',
            'authorization': 'Basic NTgyMjhmZGUtNGE1Yi00OWZkLThlMzAtNTlhNTU1NzYxYWNi',
            'partner-token': 'dc22f0426ac94a48b7779458ab235e54'
          }).then(data => {
            this.errors.push({
              code: JSON.parse(data.data).data.code,
              techDiscription: JSON.parse(data.data).data.tech_definition,
              severity: JSON.parse(data.data).data.urgency,
              longDescription: JSON.parse(data.data).data.urgency_desc,
              effect: JSON.parse(data.data).data.effect_on_vehicle
            });
          }, reject => {
            // Get call rejected
          });
        }
      });
      this.OBD.currentProfile.errorCodes = this.errors;
      this.OBD.saveProfiles();
    }, rejected => {
      // Pid call rejected
    });
  }

}
