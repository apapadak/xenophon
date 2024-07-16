import {Component, OnInit} from '@angular/core';
import {HeaderComponent} from "../../header/header.component";
import {FooterComponent} from "../../footer/footer.component";
import {RouterOutlet} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {UserService} from "../../services/UserService";
import {ClaimsCommonService} from "../../helpers/common/claims-common.service";

@Component({
  selector: 'app-home',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    FormsModule,
  ],
  providers: [UserService]
})
export class ProfileComponent implements OnInit {

  constructor(
    public userService: UserService
  ) {  }

  ngOnInit() { }

  get fullName(): string {
    return `${this.userService.userInfo.firstname} ${this.userService.userInfo.surname}`;
  }

  getUsername(): string {
    return this.userService.userInfo.afm;
  }

}
