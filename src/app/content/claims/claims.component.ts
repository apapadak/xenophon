import {Component, OnInit, ViewChild} from '@angular/core';
import { HeaderComponent } from "../../header/header.component";
import { FooterComponent } from "../../footer/footer.component";
import {RouterOutlet} from "@angular/router";
import {ClaimsService} from "../../services/ClaimsService";
import {ProfileComponent} from "../profile/profile.component";
import {BrowserAnimationsModule, NoopAnimationsModule} from "@angular/platform-browser/animations";
import {FormBuilder, FormGroup, FormsModule, NgForm, Validators} from "@angular/forms";
import {TableModule} from "primeng/table";
import {ButtonModule} from "primeng/button";
import {InputTextModule} from "primeng/inputtext";
import {AutoCompleteCompleteEvent, AutoCompleteModule} from "primeng/autocomplete";
import {PanelMenuModule} from "primeng/panelmenu";
import {CommonModule} from "@angular/common";

interface TableData {
  claimsId: number;

  publicationTitle: PublicationTitleData;
  signature: string;
  type: TypeData | null;
  periodicity: PeriodicityData | null;
  articleTitle: string;
  wordCount: number;
  circulation: number;

  disabled: boolean; // Add this property used for disabling the whole row when needed
}

interface PublicationTitleData {
  id: number;
  publication_title: string;
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
    PanelMenuModule,
  ]
})

export class ClaimsComponent implements OnInit {
  @ViewChild('claimsForm') claimsForm!: NgForm; // Reference to the form

  data: TableData[] = [];

  preparedData: TableData[] = [];

  publicationTitles: PublicationTitleData[] = [];
  filteredPublicationTitles: PublicationTitleData[] = [];

  types: TypeData[] = [];
  filteredTypes: TypeData[] = [];

  periodicities: PeriodicityData[] = [];
  filteredPeriodicities: PeriodicityData[] = [];

  userInfo: any;

  constructor(
    private claimsService: ClaimsService,
    private fb: FormBuilder
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
        this.data = data;
      },
      error: (err) => {
        console.error('Failed to fetch claims:', err);
        // Handle errors here, possibly showing a user-friendly message
      }
    });

    this.loadDropdownData();

  }

  loadDropdownData() {
    this.claimsService.getPublicationTitles().subscribe(data => {
      //this.publicationTitles = data.map((item: PublicationTitleData) => item.publication_title);
      this.publicationTitles = data;
        console.log('publicationTitles:' , this.publicationTitles);
    });

    this.claimsService.getTypes().subscribe(data => {
      //this.types = data.map((item: TypeData) => item.type);
      this.types = data;
      console.log('types:' , this.types);
    });

    this.claimsService.getPeriodicity().subscribe(data => {
      //this.periodicities = data.map((item: PeriodicityData) => item.periodicity);
      this.periodicities = data;
      console.log('periodicities:' , this.periodicities);
    });

  }

  addRow() {
    this.data.push({
      claimsId: -1,

      publicationTitle: { id: -1, publication_title: '' }, // Initialize as PublicationTitleData
      signature: '',
      type: null,
      periodicity: null,
      articleTitle: '',
      wordCount: '',
      circulation: '',

      disabled: false // Initialize as false
    });
  }

  saveRow(rowData: TableData, rowIndex: number, publicationTitle: any, signature: any, type: any, periodicity: any, articleTitle: any, wordCount: any, circulation: any) {
    console.log(rowData);
    this.markAsTouched(publicationTitle, signature, type, periodicity, articleTitle, wordCount, circulation);

    if (this.isValidRow(rowData)) {
      console.log('Saving row data:', rowData);

      // Update publicationTitle based on whether it's a string or an object
      if (typeof rowData.publicationTitle === 'string') {
        rowData.publicationTitle = {
          id: -1,
          publication_title: rowData.publicationTitle
        };
      }

     // let preparedRow = { ...rowData };

      this.preparedData.push( { ...rowData } );
      rowData.disabled = true; // Disable the row after saving

      console.log('Row prepared data prepared for saving:', this.preparedData);
    } else {
      console.error('Validation failed for row data:', rowData);
    }

    console.log('data: ', this.data);
    console.log('preparedData: ', this.preparedData);
  }

  private markAsTouched(...controls: any[]) {
    controls.forEach(control => {
      control.control.markAsTouched();
    });
  }


  private isValidRow(rowData: TableData): boolean {
    return !!rowData.publicationTitle &&
      !!rowData.signature &&
      !!rowData.type &&
      !!rowData.periodicity &&
      !!rowData.articleTitle &&
      this.isPositiveInteger(rowData.wordCount) &&
      this.isPositiveInteger(rowData.circulation);
  }

  private isPositiveInteger(value: number): boolean {
    //const num = Number(value);
    return Number.isInteger(value) && value > 0;
  }

  validateInteger(event: Event, field: keyof TableData, rowData: TableData): void {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
    if (value < 1 || !Number.isInteger(value)) {
      (rowData as any)[field] = ''; // Use type assertion
    }
  }

  deleteRow(index: number) {
    this.data.splice(index, 1);
    this.preparedData.splice(index, 1);
  }

  tempStore() {

  }

  finalStore() {

  }

  isTempStoreEnabled(): boolean {
    //console.log(this.data.length !== 0 ,' ', this.data.some(row => !row.disabled));
    return this.data.length > 0 && this.data.every(row => row.disabled);
  }

  isAddRowDisabled(): boolean {
    return this.data.some(row => !row.disabled);
  }


  searchPublicationTitle(event: AutoCompleteCompleteEvent) {
    const filtered = this.filterByField(this.publicationTitles, 'publication_title', event.query);
    this.filteredPublicationTitles = this.transformAndSortDisplay(filtered, 'publication_title');
  }
  searchTypes(event: AutoCompleteCompleteEvent) {
    console.log(this.types);
    const filtered = this.filterByField(this.types, 'type', event.query);
    this.filteredTypes = this.transformAndSortDisplay(filtered, 'type');
    console.log(this.filteredTypes);
  }
  searchPeriodicity(event: AutoCompleteCompleteEvent) {
    const filtered = this.filterByField(this.periodicities, 'periodicity', event.query);
    this.filteredPeriodicities = this.transformAndSortDisplay(filtered, 'periodicity');

  }



  filterByField<T>(arr: T[], field: keyof T, query: string): T[] {
    return arr.filter(item => {
      const value = item[field];
      //console.log(`Filtering ${value} with query ${query}`);
      return typeof value === 'string' && value.toLowerCase().includes(query.toLowerCase());
    });
  }

  transformAndSortDisplay<T>(arr: T[], field: keyof T): T[] {
    return arr
      .map(item => ({
        ...item,
        [field]: typeof item[field] === 'string' ? (item[field] as string).toLowerCase() : item[field]
      }))
      .sort((a, b) => {
        const valueA = a[field];
        const valueB = b[field];
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return this.customSort(valueA, valueB);
        }
        return 0;
      });
  }

  customSort(a: string, b: string): number {
    const greekRegex = /^[Α-Ωα-ω]/; // Greek letters
    const numberRegex = /^[0-9]/;   // Numbers
    const symbolRegex = /^[^A-Za-z0-9Α-Ωα-ω]/; // Symbols

    const isGreekA = greekRegex.test(a);
    const isGreekB = greekRegex.test(b);
    const isNumberA = numberRegex.test(a);
    const isNumberB = numberRegex.test(b);
    const isSymbolA = symbolRegex.test(a);
    const isSymbolB = symbolRegex.test(b);

    if (isGreekA && !isGreekB) return -1;
    if (!isGreekA && isGreekB) return 1;
    if (isNumberA && !isNumberB) return -1;
    if (!isNumberA && isNumberB) return 1;
    if (isSymbolA && !isSymbolB) return -1;
    if (!isSymbolA && isSymbolB) return 1;

    return a.localeCompare(b); // Default locale compare for other cases
  }



}



