import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { timer } from 'rxjs/observable/timer';
import { GoogleLoginComponent } from './google-login/google-login.component';
import { LoginPageModule } from './login/login.module';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.style.scss']
})
export class AppComponent {
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
      this.rootPage = LoginPageModule;
      console.log("I am Ready!");
    });
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      timer(3000).subscribe(() => this.showSplash = false);
    });
  }
}
