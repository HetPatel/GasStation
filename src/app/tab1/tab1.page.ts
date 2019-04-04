import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { ProductComponent } from '../product/product.component';

import { Platform, NavController } from '@ionic/angular';
import { GooglePlus } from '@ionic-native/google-plus/ngx';
import { TabsPage } from '../tabs/tabs.page';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class ScanPage {
  rootPage: any;  
  user: Observable<firebase.User>;
  barcode: any;
  encodeData: any;
  constructor(private barcodeScanner: BarcodeScanner,
              public navCtrl: NavController,
              private afAuth: AngularFireAuth, 
              private gplus: GooglePlus,
              private platform: Platform,
              public modalController: ModalController,
              private router: Router) { 
  this.user = this.afAuth.authState;
}

  googleLogin() {
    if (this.platform.is('cordova')) {
      console.log("I am in if!");
      this.nativeGoogleLogin();
    } else {
      console.log("I am in else!");
      this.webGoogleLogin();
    }
  }

  async nativeGoogleLogin(): Promise<firebase.User> {
  try {

    const gplusUser = await this.gplus.login({
      'webClientId': '1070151210348-l3o4cngjdjr17k0tm4irutk39gbdm1v5.apps.googleusercontent.com',
      'offline': true,
      'scopes': 'profile email'
    })
    return await this.afAuth.auth.signInWithCredential(
      firebase.auth.GoogleAuthProvider.credential(gplusUser.idToken)
      )

  } catch(err) {
    console.log(err)
  }
}

async webGoogleLogin(): Promise<void> {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const credential = await this.afAuth.auth.signInWithPopup(provider);
    console.log("Credential Value1: " + JSON.stringify(credential.user.uid));
    if(credential.user.uid){
      console.log("Atleast I am IN");
      this.modalController.dismiss();
      // this.navCtrl.navigateRoot(TabsPage);
    }

  } catch(err) {
    console.log(err)
  }

}


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

  signOut() {
    this.afAuth.auth.signOut();
    if(this.platform.is('cordova')){
      this.gplus.logout();
    }
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
