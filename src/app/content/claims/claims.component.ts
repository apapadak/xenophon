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
import {ToastModule} from "primeng/toast";
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import {MessageService, ConfirmationService} from "primeng/api";

interface TableData {
  claimId: number;

  publicationTitle: PublicationTitleData;
  signature: string;
  type: TypeData | null;
  periodicity: PeriodicityData | null;
  role: RoleData | null;
  wordcount: WordcountData | null;
  circulation: CirculationData | null;

  disabled: boolean; // Add this property used for disabling the whole row when needed
  permFlag: boolean;
}

interface PublicationTitleData {
  id: number;
  publication_title: string;

  custom: boolean;
}

interface TypeData {
  id: number;
  type: string;
}

interface PeriodicityData {
  id: number;
  periodicity: string;
}

interface RoleData {
  id: number;
  role: string;
}

interface WordcountData {
  id: number;
  wordcount: string;
}

interface CirculationData {
  id: number;
  circulation: string;
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
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService]
})

export class ClaimsComponent implements OnInit {
  @ViewChild('claimsForm') claimsForm!: NgForm; // Reference to the form

  data: TableData[] = [];

  //preparedData: TableData[] = [];

  publicationTitles: PublicationTitleData[] = [];
  filteredPublicationTitles: PublicationTitleData[] = [];

  types: TypeData[] = [];
  filteredTypes: TypeData[] = [];

  periodicities: PeriodicityData[] = [];
  filteredPeriodicities: PeriodicityData[] = [];

  roles: RoleData[] = [];
  filteredRoles: RoleData[] = [];

  wordcounts: WordcountData[] = [];
  filteredWordcounts: WordcountData[] = [];

  circulations: CirculationData[] = [];
  filteredCirculations: CirculationData[] = [];

  userInfo: any;

  constructor(
    private claimsService: ClaimsService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
     // Initialize with one empty row
    this.fetchData();
    this.loadDropdownData();
  }

  fetchData() {
    const userInfoString = localStorage.getItem('userInfo');
    this.userInfo = userInfoString ? JSON.parse(userInfoString) : '';

    console.log('userInfo: ', this.userInfo);

    this.claimsService.getClaims(this.userInfo.user_id).subscribe({
      next: (data) => {
        // Add disabled flag to each row in the fetched data
        this.data = data.map((row: TableData) => ({
          ...row,
          disabled: true
        }));

        if (this.data.length === 0) {
          this.addRow();
        }

        console.log('data:', this.data);
        //console.log('preparedData:', this.preparedData);
      },
      error: (err) => {
        console.error('Failed to fetch claims:', err);
        // Handle errors here, possibly showing a user-friendly message
      }
    });
  }

  loadDropdownData() {
    this.claimsService.getPublicationTitles().subscribe(data => {
      //this.publicationTitles = data.map((item: PublicationTitleData) => item.publication_title);
      this.publicationTitles = data;
      //console.log('publicationTitles:' , this.publicationTitles);
    });

    this.claimsService.getTypes().subscribe(data => {
      //this.types = data.map((item: TypeData) => item.type);
      this.types = data;
      //console.log('types:' , this.types);
    });

    this.claimsService.getPeriodicities().subscribe(data => {
      //this.periodicities = data.map((item: PeriodicityData) => item.periodicity);
      this.periodicities = data;
      //console.log('periodicities:' , this.periodicities);
    });

    this.claimsService.getRoles().subscribe(data => {
      this.roles = data;
    });

    this.claimsService.getWordcounts().subscribe(data => {
      this.wordcounts = data;
      //console.log('WordCounts:' , this.wordcounts);
    });

    this.claimsService.getCirculations().subscribe(data => {
      this.circulations = data;
      //console.log('circulations:' , this.circulations);
    });

  }

  addRow() {
    this.data.push({
      claimId: -1,

      publicationTitle: { id: -1, publication_title: '', custom: false }, // Initialize as PublicationTitleData
      signature: '',
      type: null,
      periodicity: null,
      role: null,
      wordcount: null,
      circulation: null,

      disabled: false, // Initialize as false
      permFlag: false
    });
  }

  saveRow(rowData: TableData, rowIndex: number, publicationTitle: any, signature: any, type: any, periodicity: any, role: any, wordcount: any, circulation: any) {
    console.log(rowData);
    this.markAsTouched(publicationTitle, signature, type, periodicity, role, wordcount, circulation);

    if (this.isValidRow(rowData)) {
      console.log('Saving row data:', rowData);

      // Update publicationTitle based on whether it's a string or an object
      if (typeof rowData.publicationTitle === 'string') {
        rowData.publicationTitle = {
          id: -1,
          publication_title: rowData.publicationTitle,
          custom: true
        };
      } else {
        rowData.publicationTitle.custom = false;
      }

      // Update data and preparedData
      /*const updatedRow = {
        ...rowData,
        wordCount: typeof rowData.wordCount === 'string' ? Number(rowData.wordCount) : rowData.wordCount,
        circulation: typeof rowData.circulation === 'string' ? Number(rowData.circulation) : rowData.circulation,
        disabled: true // Disable the row after saving
      };*/

      //rowData.wordCount = typeof rowData.wordCount === 'string' ? Number(rowData.wordCount) : rowData.wordCount;
      //rowData.circulation = typeof rowData.circulation === 'string' ? Number(rowData.circulation) : rowData.circulation;

      rowData.disabled = true; // Ensure the row is disabled after saving

      //this.data[rowIndex] = updatedRow;
      //this.preparedData[rowIndex] = { ...updatedRow };

      console.log('Row data prepared for saving:', this.data);
    } else {
      console.error('Validation failed for row data:', rowData);
    }

    console.log('data: ', this.data);
    //console.log('preparedData: ', this.preparedData);
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
      !!rowData.role &&
      !!rowData.wordcount &&
      !!rowData.circulation;
  }

  /*private isPositiveInteger(value: string | number): boolean {
    const num = typeof value === 'string' ? Number(value) : value;
    return Number.isInteger(num) && num > 0;
  }*/

  /*validateInteger(event: Event, field: keyof TableData, rowData: TableData): void {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
    if (value < 1 || !Number.isInteger(value)) {
      (rowData as any)[field] = ''; // Use type assertion
    }
  }*/

  deleteRow(index: number) {
    this.data.splice(index, 1);

    if (this.data.length === 0) {
      this.addRow();
    }
  }

  tempStore(permFlag: boolean) {
    const payload = {
      userId: this.userInfo.user_id,
      claims: this.data.map(({ disabled, ...rest }) => rest), // Remove the 'disabled' flag from each row, no need to be sent to the server

      permFlag: permFlag
    };

    console.log('Data to be sent:', payload);

    this.claimsService.saveClaims(payload).subscribe({
      next: (response) => {
        this.messageService.add({severity: 'success', summary: 'Επιτυχία', detail: 'Επιτυχής προσωρινή αποθήκευση'});

        this.fetchData(); // refresh data array

        console.log('Data successfully saved:', response);
      },
      error: (error) => {
        this.messageService.add({severity: 'danger', summary: 'Αποτυχία', detail: 'Αποτυχία προσωρινής αποθήκευσης'});

        console.error('Failed to save data:', error);
      }
    });
  }

  isStoreButtonsDisabled(): boolean {
    //console.log(this.data);
    //console.log('this.data.length ', this.data.length, ' ', this.data.every(row => row.disabled === true));
    return this.data.length > 0 && !this.data.every(row => row.disabled);
  }

  confirmFinalStore() {
    console.log('hi');
    this.confirmationService.confirm({
      message: 'Είστε σίγουροι ότι θέλετε να προχωρήσετε?\nΔεν επιτρέπονται άλλες αλλαγές μετά την Οριστική Αποθήκευση.',
      accept: () => {
        this.finalStore();
      }
    });
  }

  finalStore() {
    this.tempStore(true);
  }

  showControls(): boolean {
    return !this.data.every(row => row.permFlag);
  }

  isAddRowDisabled(): boolean {
    return this.data.some(row => !row.disabled);
  }

  searchPublicationTitle(event: AutoCompleteCompleteEvent) {
    const filtered = this.filterByField(this.publicationTitles, 'publication_title', event.query);
    this.filteredPublicationTitles = this.transformAndSortDisplay(filtered, 'publication_title');
  }
  searchTypes(event: AutoCompleteCompleteEvent) {
    //console.log(this.types);
    const filtered = this.filterByField(this.types, 'type', event.query);
    this.filteredTypes = this.transformAndSortDisplay(filtered, 'type');
    //console.log(this.filteredTypes);
  }
  searchPeriodicity(event: AutoCompleteCompleteEvent) {
    //const filtered = this.filterByField(this.periodicities, 'periodicity', event.query);
    this.filteredPeriodicities = [...this.periodicities];//this.transformAndSortDisplay(filtered, 'periodicity');
  }

  searchRole(event: AutoCompleteCompleteEvent) {
    //const filtered = this.filterByField(this.roles, 'role', event.query);
    this.filteredRoles = [...this.roles];// this.transformAndSortDisplay(filtered, 'role');
  }

  searchWordcount(event: AutoCompleteCompleteEvent) {
   // const filtered = this.filterByField(this.wordcounts, 'wordcount', event.query);
    this.filteredWordcounts = [...this.wordcounts];//this.transformAndSortDisplay(filtered, 'wordcount');
  }

  searchCirculation(event: AutoCompleteCompleteEvent) {
    //const filtered = this.filterByField(this.circulations, 'circulation', event.query);
    this.filteredCirculations = [...this.circulations];//this.transformAndSortDisplay(filtered, 'circulation');
  }




  filterByField<T>(arr: T[], field: keyof T, query: string): T[] {
    return arr.filter(item => {
      const value = item[field];
      console.log(`Filtering ${value} with query ${query}`);
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

  limitInputLength(event: any, maxLength: number, rowData: any) {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.value.length > maxLength) {
      inputElement.value = inputElement.value.slice(0, maxLength);
      rowData.publicationTitle = inputElement.value;  // Update the ngModel
    }
  }

}



