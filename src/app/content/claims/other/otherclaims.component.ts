import {Component, OnInit, ViewChild} from '@angular/core';
import { HeaderComponent } from "../../../header/header.component";
import { FooterComponent } from "../../../footer/footer.component";
import {FormsModule, NgForm} from "@angular/forms";
import {TableModule} from "primeng/table";
import {ButtonModule} from "primeng/button";
import {InputTextModule} from "primeng/inputtext";
import {AutoCompleteModule} from "primeng/autocomplete";
import {PanelMenuModule} from "primeng/panelmenu";
import {CommonModule} from "@angular/common";
import {ToastModule} from "primeng/toast";
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {ClaimsCommonService} from '../../../helpers/common/claims-common.service';
import {UserService} from '../../../services/UserService';

@Component({
  selector: 'app-home',
  templateUrl: './otherclaims.component.html',
  styleUrls: ['./otherclaims.component.css'],
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,

    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    AutoCompleteModule,
    PanelMenuModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [ClaimsCommonService]
})

export class OtherClaimsComponent {
  @ViewChild('claimsOtherForm') claimsOtherForm!: NgForm; // Reference to the form

  userInfo: any;

  constructor(
    public claimsCommonService: ClaimsCommonService,
    public userService: UserService
  ) {
    this.userInfo = userService.getUserInfo();

    this.claimsCommonService.fetchOtherClaims();
  }
}



