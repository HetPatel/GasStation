import { Component, ViewChild } from '@angular/core';

import { Platform, NavController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { timer } from 'rxjs/observable/timer';
import { GoogleLoginComponent } from './google-login/google-login.component';
import { LoginPage } from './login/login.page'
import { Router } from '@angular/router';

@Component({
  template: '<ion-nav #myNav [root]="rootPage"></ion-nav>',
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.style.scss']
})
export class AppComponent {
  @ViewChild('myNav') nav: NavController
  rootPage: any;
  showSplash = true;
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private router: Router
  ) {
    platform.ready().then(() => {
      this.initializeApp();
      // this.rootPage = LoginPage;
    });
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      timer(3000).subscribe(() => this.showSplash = false);
      console.log("I am Ready!");
      this.router.navigateByUrl('/login');
      // this.nav.navigateRoot(LoginPage);
    });
  }
}
