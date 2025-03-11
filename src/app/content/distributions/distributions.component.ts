import { Component } from '@angular/core';
import { HeaderComponent } from "../../header/header.component";
import { FooterComponent } from "../../footer/footer.component";
import {RouterOutlet} from "@angular/router";
import {CommonModule} from "@angular/common";
import {ToastModule} from "primeng/toast";
import { AccordionModule } from 'primeng/accordion';
import { TableModule } from 'primeng/table';
import { PanelModule } from 'primeng/panel';
import {DownloadCommonService} from '../../helpers/common/download-common.service';
import {ClaimsCommonService} from '../../helpers/common/claims-common.service';
import {UserService} from '../../services/UserService';

@Component({
  selector: 'app-home',
  templateUrl: './distributions.component.html',
  styleUrls: ['./distributions.component.css'],
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    ToastModule,
    AccordionModule,
    TableModule,
    PanelModule,

    CommonModule
  ],
  providers: [DownloadCommonService, ClaimsCommonService]
})

export class DistributionsComponent {

  userInfo: any;

  constructor(
    public claimsCommonService: ClaimsCommonService,
    public downloadService: DownloadCommonService,
    public userService: UserService
  ) {
     this.userInfo = userService.getUserInfo();
  }

    downloadPDF(am: string) {
      this.downloadService.downloadDistributionPDF(am);
    }

    ngOnInit(): void {
      this.claimsCommonService.fetchPaperClaims(2023);
      this.claimsCommonService.fetchInternetClaims(2023);
      this.claimsCommonService.fetchTvClaims(2023);
      this.claimsCommonService.fetchRadioClaims(2023);
    }

  }
