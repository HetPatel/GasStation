import { Component, OnInit } from '@angular/core';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { Observable } from 'rxjs/Observable';

import { Platform, NavController } from '@ionic/angular';
import { GooglePlus } from '@ionic-native/google-plus/ngx';
import { TabsPage } from '../tabs/tabs.page';
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  rootPage: any;	
  user: Observable<firebase.User>;

  constructor(public navCtrl: NavController,
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
    this.router.navigateByUrl('/tabshome');
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
      this.router.navigateByUrl('/tabshome');
      // this.modalController.dismiss();
      // this.navCtrl.navigateRoot(TabsPage);
    }

  } catch(err) {
    console.log(err)
  }

}

  signOut() {
    this.afAuth.auth.signOut();
    if(this.platform.is('cordova')){
      this.gplus.logout();
    }
  }


  ngOnInit() {
  }

}
