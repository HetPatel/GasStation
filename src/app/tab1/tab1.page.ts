import { Component } from '@angular/core';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class ScanPage {
  barcode: any;
  encodeData: any;
  constructor(private barcodeScanner: BarcodeScanner) { }


  scanCode() {
    const self = this;
    self.barcodeScanner.scan().then(barcodeData => {
      self.barcode = barcodeData;
     }).catch(err => {
         console.log('Error', err);
     });
  }
}
