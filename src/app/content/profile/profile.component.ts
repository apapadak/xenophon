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
    // ... other imports
  ]
})
export class ProfileComponent implements OnInit {
  userInfo: any;

  ngOnInit() {
    this.loadProfileData();
  }

  loadProfileData() {
    const userInfo = localStorage.getItem('userInfo');

    // Check if data exists, if not initialize to defaults or empty objects
    this.userInfo = userInfo ? JSON.parse(userInfo) : this.initializePersonalInfo();
    console.log('this.userInfo: ', userInfo);
  }

  initializePersonalInfo() {
    // Return a default personalInfo object or an empty one
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

  // Getter for fullName that concatenates firstName and lastName
  get fullName(): string {
    return `${this.userInfo.firstName} ${this.userInfo.lastName}`;
  }

  // Setter for fullName that splits the fullName and sets firstName and lastName
  set fullName(value: string) {
    const [firstName, lastName] = value.split(' ');
    this.userInfo.firstName = firstName;
    this.userInfo.lastName = lastName;
  }

  getUsername(): string {
    return this.userInfo.afm;
  }

}
