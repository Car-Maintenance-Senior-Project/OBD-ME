/** Template page for displaying more info about a error.
 * Data is loaded in when the page is
 */
import { Component, OnInit, Input } from '@angular/core';
import { ErrorCode } from '../interfaces/errorCode';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-error-modal',
  templateUrl: './error-modal.page.html',
  styleUrls: ['./error-modal.page.scss'],
})
export class ErrorModalPage implements OnInit {
  // Imports the error code when the Modal is called
  @Input() errorCodeSelect: ErrorCode;

  constructor(private modalCont: ModalController) { }

  ngOnInit() { }

  public dismissModal() {
    this.modalCont.dismiss({
      dismissed: true,
    });
  }
}
