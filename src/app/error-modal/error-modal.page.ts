import { Component, OnInit, Input } from '@angular/core';
import { ErrorCode } from '../interfaces/errorCode';
import { ModalController } from '@ionic/angular';


@Component({
  selector: 'app-error-modal',
  templateUrl: './error-modal.page.html',
  styleUrls: ['./error-modal.page.scss'],
})
export class ErrorModalPage implements OnInit {

  @Input() errorCodeSelect: ErrorCode;

  constructor(private modalCont: ModalController) { }

  ngOnInit() {
  }

  public dismissModal() {
    this.modalCont.dismiss({
      'dismissed': true
    });
  }

}
