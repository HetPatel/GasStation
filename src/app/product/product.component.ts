import { Component, OnInit, Input } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
})
export class ProductComponent implements OnInit {
  @Input()
  barcode: any;
  scannedItem: any = {};

  constructor(private db: AngularFireDatabase, public modalController: ModalController) { }

  ngOnInit() {
    const self = this;
    const product = self.db.list('/products', ref => ref.orderByChild('barCode').equalTo(self.barcode.text));
    product.valueChanges().subscribe(res => {
      if (res) {
        self.scannedItem = res[0];
      }
    });
  }

  dismiss() {
    this.modalController.dismiss();
  }

  save() {
    const self = this;
    console.log(self.scannedItem.quantity);
    const product = self.db.object('/products/' + self.scannedItem.barCode);
    product.set(self.scannedItem).then(res => {
      console.log(res);
        self.modalController.dismiss();
    });
  }
}
