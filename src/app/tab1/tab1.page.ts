import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { ProductComponent } from '../product/product.component';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class ScanPage {
  barcode: any;
  encodeData: any;
  constructor(private barcodeScanner: BarcodeScanner,
    public modalController: ModalController) { }


  scanCode() {
    const self = this;
    self.barcode = {};
    self.barcode.text = '0058496442644';

    self.presentModal();

    return
    self.barcodeScanner.scan().then(barcodeData => {
      self.barcode = barcodeData;
     }).catch(err => {
         console.log('Error', err);
     });
  }

  async presentModal() {
    const self = this;
    const modal = await this.modalController.create({
      component: ProductComponent,
      componentProps: { barcode: self.barcode }
    });
    return await modal.present();
  }

}
