import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { GooglePlus } from '@ionic-native/google-plus/ngx';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AngularFireModule } from '@angular/fire';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { environment } from '../environments/environment';
import { PipesModule } from './../pipes.module';
import { ProductComponent } from './product/product.component';
import { LoginPageModule } from './login/login.module';
import { Tab1PageModule } from './tab1/tab1.module';


@NgModule({
  declarations: [AppComponent, ProductComponent],
  entryComponents: [ProductComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule,
  	AngularFireModule.initializeApp(environment.firebase, 'track-it'),
    AngularFireAuthModule,
  	AngularFireDatabaseModule, PipesModule, LoginPageModule, Tab1PageModule
  ],
  providers: [
    GooglePlus,
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
