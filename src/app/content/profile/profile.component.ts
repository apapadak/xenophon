import {Component, OnInit} from '@angular/core';
import { HeaderComponent } from "../../header/header.component";
import { FooterComponent } from "../../footer/footer.component";
import {RouterOutlet} from "@angular/router";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-home',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    FormsModule
  ]
})
export class ProfileComponent implements OnInit {
  userInfo: any;

  ngOnInit() {
    this.loadProfileData();
  }

  loadProfileData() {
    const userInfo = localStorage.getItem('userInfo');

    this.userInfo = userInfo ? JSON.parse(userInfo) : this.initializePersonalInfo();
    console.log('this.userInfo: ', userInfo);
  }

  initializePersonalInfo() {
    return {
      "afm": '',
      "firstname": '',
      "surname": '',
      "father_name": '',
      "tax_office": '',
      "dob": '',
      "adt": '',
      "iban": '',
      "bank": '',
      "legal_form": '',
      "address": '',
      "city": '',
      "postal_code": '',
      "country": '',
      "telephone": '',
      "mobile": '',
      "email_1": '',
      "email_2": '',
    };
  }

  get fullName(): string {
    return `${this.userInfo.firstname} ${this.userInfo.surname}`;
  }

  getUsername(): string {
    return this.userInfo.afm;
  }

}
