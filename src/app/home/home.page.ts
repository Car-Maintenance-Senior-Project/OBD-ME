import { Component } from '@angular/core';
import { OBDConnectorService } from '../services/obd-connector.service';
import { HTTP } from '@ionic-native/http/ngx';
import { File } from '@ionic-native/file/ngx';
import { Storage } from '@ionic/storage';
import { Base64 } from '@ionic-native/base64/ngx';
import { SafeUrl } from '@angular/platform-browser';
import { StorageKeys } from '../classes/storage-keys';
import { CarProfile } from '../interfaces/car-profile';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  // TODO: don't use this array, instead import/inject a service and use data from that
  public errors = [
    {
      name: 'Error 1'
    },
    {
      name: 'Error 2'
    }
  ];
  public image: SafeUrl;

  /**
   * Creates an instance of home page. Runs startup from OBD service
   * @param OBD - The obd connector service
   */
  constructor(
    private OBD: OBDConnectorService,
    private httpNative: HTTP,
    private file: File,
    private store: Storage,
    private base64: Base64, ) {
  }

  ngOnInit() {
    if (!this.OBD.isLoading) {
      this.parsePhotos(this.OBD.currentProfile);
    } else {
      this.store.get(StorageKeys.CARPROFILES).then(allProfilesTemp => {
        if (allProfilesTemp === null) {
          allProfilesTemp = []
        }
        const tempActiveProfile: CarProfile = allProfilesTemp.find(profile => profile.lastProfile === true);
        if (tempActiveProfile !== undefined) {
          this.parsePhotos(tempActiveProfile);
        } else {
          this.image = '../../assets/2006-honda-crv.jpg';
        }
      });
    }
  }

  parsePhotos(activeProfile: CarProfile) {
    console.log('OBDMEDebug: Starting Photos');
    if (activeProfile.pictureSaved === false) {
      this.httpNative.get('https://api.carmd.com/v3.0/image?vin=' + activeProfile.vin, {}, {
        'content-type': 'application/json',
        'authorization': 'Basic NTgyMjhmZGUtNGE1Yi00OWZkLThlMzAtNTlhNTU1NzYxYWNi',
        'partner-token': 'dc22f0426ac94a48b7779458ab235e54'
      }).then(data => {
        console.log('OBDMEDebug: Return: ' + JSON.stringify(JSON.parse(data.data).data.image));
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

}
