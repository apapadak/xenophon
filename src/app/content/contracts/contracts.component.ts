import { Component } from '@angular/core';
import { HeaderComponent } from "../../header/header.component";
import { FooterComponent } from "../../footer/footer.component";
import {RouterOutlet} from "@angular/router";
import {CommonModule} from "@angular/common";
import {ToastModule} from "primeng/toast";
import {ButtonModule} from "primeng/button";
import {DownloadCommonService} from '../../helpers/common/download-common.service';
import {UserService} from '../../services/UserService';

@Component({
  selector: 'app-home',
  templateUrl: './contracts.component.html',
  styleUrls: ['./contracts.component.css'],
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    ToastModule,
    ButtonModule,

    CommonModule
  ],
  providers: [DownloadCommonService]
})
export class ContractsComponent {

  userInfo: any;

  constructor(
    public downloadService: DownloadCommonService,
    public userService: UserService
  ) {
     this.userInfo = userService.getUserInfo();
  }

  downloadPDF(am: string) {
    this.downloadService.downloadContractPDF(am);
  }
}
