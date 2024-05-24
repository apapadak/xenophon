import {Component, OnInit} from '@angular/core';
import { HeaderComponent } from "../../header/header.component";
import { FooterComponent } from "../../footer/footer.component";
import {RouterOutlet} from "@angular/router";
import {ClaimsService} from "../../services/ClaimsService";
import {ProfileComponent} from "../profile/profile.component";
import {BrowserAnimationsModule, NoopAnimationsModule} from "@angular/platform-browser/animations";
import {FormsModule} from "@angular/forms";
import {TableModule} from "primeng/table";
import {ButtonModule} from "primeng/button";
import {InputTextModule} from "primeng/inputtext";
import {AutoCompleteCompleteEvent, AutoCompleteModule} from "primeng/autocomplete";
import {PanelMenuModule} from "primeng/panelmenu";
import {CommonModule} from "@angular/common";

interface TableData {
  articleTitle: string;
  signature: string;
  type: string;
  periodicity: string;
  title: string;
  wordCount: string;
  circulation: string;
}

interface ArticleTitleData {
  id: number;
  article_title: string;
}

interface TypeData {
  id: number;
  type: string;
}

interface PeriodicityData {
  id: number;
  periodicity: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './claims.component.html',
  styleUrls: ['./claims.component.css'],
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
    PanelMenuModule
  ]
})

export class ClaimsComponent implements OnInit {
  data: TableData[] = [];

  articleTitles: string[] = [];
  filteredArticleTitles: string[] = [];

  types: string[] = [];
  filteredTypes: string[] = [];

  periodicities: string[] = [];
  filteredPeriodicities: string[] = [];

  userInfo: any;

  constructor(
    private claimsService: ClaimsService
  ) {}

  ngOnInit() {
    this.addRow(); // Initialize with one empty row
    this.fetchData();
  }

  fetchData() {
    const userInfoString = localStorage.getItem('userInfo');
    this.userInfo = userInfoString ? JSON.parse(userInfoString) : '';

    console.log('userInfo: ', this.userInfo);

    this.claimsService.getClaims(this.userInfo.afm).subscribe({
      next: (data) => {
        ;this.data = data;
      },
      error: (err) => {
        console.error('Failed to fetch claims:', err);
        // Handle errors here, possibly showing a user-friendly message
      }
    });
    this.loadDropdownData();
  }

  loadDropdownData() {
    this.claimsService.getArticleTitles().subscribe(data => {
      this.articleTitles = data.map((item: ArticleTitleData) => item.article_title);
      console.log('articleTitles:' , this.articleTitles);
    });

    this.claimsService.getTypes().subscribe(data => {
      this.types = data.map((item: TypeData) => item.type);
      console.log('types:' , this.types);
    });

    this.claimsService.getPeriodicity().subscribe(data => {
      this.periodicities = data.map((item: PeriodicityData) => item.periodicity);
      console.log('periodicities:' , this.periodicities);
    });




  }

  addRow() {
    this.data.push({
      title: '',
      signature: '',
      type: '',
      periodicity: '',
      articleTitle: '',
      wordCount: '',
      circulation: ''
    });
  }

  saveRow(row: TableData) {
     //Implement your save logic here
  }

  deleteRow(index: number) {
    this.data.splice(index, 1);
  }




  searchArticleTitle(event: AutoCompleteCompleteEvent) {
    this.filteredArticleTitles = this.articleTitles.filter(title => title.toLowerCase().includes(event.query.toLowerCase()) );
  }
  searchTypes(event: AutoCompleteCompleteEvent) {
    this.filteredTypes = this.types.filter(type => type.toLowerCase().includes(event.query.toLowerCase()) );
  }
  searchPeriodicity(event: AutoCompleteCompleteEvent) {
    this.filteredPeriodicities = this.periodicities.filter(periodicity => periodicity.toLowerCase().includes(event.query.toLowerCase()) );
  }





}



