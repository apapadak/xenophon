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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import {ClaimsCommonService} from '../../../helpers/common/claims-common.service';

@Component({
  selector: 'app-home',
  templateUrl: './paperclaims.component.html',
  styleUrls: ['./paperclaims.component.css'],
  standalone: true,
  imports: [
    //RouterOutlet,
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

export class PaperClaimsComponent {
  @ViewChild('claimsPaperForm') claimsPaperForm!: NgForm; // Reference to the form

  userInfo: any;

  constructor(
    public claimsCommonService: ClaimsCommonService
  ) {
    this.userInfo = this.claimsCommonService.getUserInfo();

    this.claimsCommonService.fetchPaperClaims();
  }
}



