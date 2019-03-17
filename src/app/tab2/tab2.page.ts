import { Component } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {
	productsRef: AngularFireList<any>;
	products: Observable<any[]>;
	search = "Mars";
	constructor(db: AngularFireDatabase){
	this.productsRef = db.list('products');
    this.products = this.productsRef.valueChanges();
	}
}

export interface Product { name: string; }
