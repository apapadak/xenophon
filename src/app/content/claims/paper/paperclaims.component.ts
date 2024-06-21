import {Component, OnInit, ViewChild} from '@angular/core';
import { HeaderComponent } from "../../../header/header.component";
import { FooterComponent } from "../../../footer/footer.component";
import {RouterOutlet} from "@angular/router";
import {ClaimsService} from "../../../services/ClaimsService";
import {ProfileComponent} from "../../profile/profile.component";
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

  titlePaper: TitlePaperData;
  signature: string;
  type: TypeData | null;
  periodicity: PeriodicityData | null;
  role: RoleData | null;
  wordcount: WordcountData | null;
  circulation: CirculationData | null;

  disabled: boolean; // Add this property used for disabling the whole row when needed
  permFlag: boolean;
}

interface TitlePaperData {
  id: number;
  title: string;

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

  disableWordCount: boolean;
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
  providers: [MessageService, ConfirmationService]
})

export class PaperClaimsComponent implements OnInit {
  @ViewChild('claimsForm') claimsForm!: NgForm; // Reference to the form

  data: TableData[] = [];
  isAnyRowDeleted: boolean = false;

  titlePapers: TitlePaperData[] = [];
  filteredtitlePapers: TitlePaperData[] = [];

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

    this.claimsService.getPaperClaims(this.userInfo.user_id).subscribe({
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
    this.claimsService.getPaperDropdownData().subscribe(data => {
      this.titlePapers = data.titlePapers;
      this.types = data.types;
      this.periodicities = data.periodicities;
      this.roles = data.roles;
      this.wordcounts = data.wordcounts;
      this.circulations = data.circulations;
    });
  }

  addRow() {
    this.data.push({
      claimId: -1,

      titlePaper: { id: -1, title: '', custom: false },
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

  saveRow(rowData: TableData, rowIndex: number, title: any, signature: any, type: any, periodicity: any, role: any, wordcount: any, circulation: any) {
    console.log(rowData);
    this.markAsTouched(title, signature, type, periodicity, role, wordcount, circulation);

    if (this.isValidRow(rowData)) {
      console.log('Saving row data:', rowData);

      // Update titlePaper based on whether it's a string or an object
      if (typeof rowData.titlePaper === 'string') {
        rowData.titlePaper = {
          id: -1,
          title: rowData.titlePaper,
          custom: true
        };
      } else {
        rowData.titlePaper.custom = false;
      }

      rowData.disabled = true; // Ensure the row is disabled after saving

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
    return !!rowData.titlePaper &&
      !!rowData.signature &&
      !!rowData.type &&
      !!rowData.periodicity &&
      !!rowData.role &&
      (rowData.role.disableWordCount || !!rowData.wordcount) &&
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

    this.isAnyRowDeleted = true;
    console.log('1 ', this.data);
    if (this.data.length === 0 && !this.isAnyRowDeleted) {
      this.addRow();
    }

    console.log('2 ', this.data);
  }

  isStoreButtonsDisabled(): boolean {
    //console.log(this.data);
    //console.log('this.data.length ', this.data.length, ' this.isAnyRowDeleted:', this.isAnyRowDeleted, ' ', this.data.every(row => row.disabled === true));
    return (this.data.length == 0 && !this.isAnyRowDeleted) || (this.data.length > 0 && !this.data.every(row => row.disabled));
  }

  showControls(): boolean {
    //console.log(this.isAnyRowDeleted, ' ', !this.data.every(row => row.permFlag));
    return this.isAnyRowDeleted || !this.data.every(row => row.permFlag);
  }

  isAddRowDisabled(): boolean {
    return (this.data.length == 0 && !this.isAnyRowDeleted) || this.data.some(row => !row.disabled);
  }

  tempStore(permFlag: boolean) {
    const payload = {
      userId: this.userInfo.user_id,
      claims: this.data.map(({ disabled, ...row }) => ({
        ...row,
        role: row.role ? {
          id: row.role.id,
          role: row.role.role
        } : null
      })),
      permFlag: permFlag
    };

    console.log('Data to be sent:', payload);

    this.claimsService.savePaperClaims(payload).subscribe({
      next: (response) => {
        this.messageService.add({severity: 'success', summary: 'Επιτυχία', detail: 'Επιτυχής προσωρινή αποθήκευση'});

        this.fetchData(); // refresh data array
        this.isAnyRowDeleted = false;

        console.log('Data successfully saved:', response);
      },
      error: (error) => {
        this.messageService.add({severity: 'danger', summary: 'Αποτυχία', detail: 'Αποτυχία προσωρινής αποθήκευσης'});

        console.error('Failed to save data:', error);
      }
    });
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


  searchTitlePaper(event: AutoCompleteCompleteEvent) {
    console.log(this.titlePapers);
    const filtered = this.filterByField(this.titlePapers, 'title', event.query);
    console.log(filtered);
    this.filteredtitlePapers = this.transformAndMaintainOrder(filtered, 'id', 'title');
    console.log(this.filteredtitlePapers);
  }
  searchTypes(event: AutoCompleteCompleteEvent) {
    //console.log(this.types);
    const filtered = this.filterByField(this.types, 'type', event.query);
    this.filteredTypes = this.transformAndMaintainOrder(filtered, 'id', 'type');
    //console.log(this.filteredTypes);
  }
  searchPeriodicity(event: AutoCompleteCompleteEvent) {
    const filtered = this.filterByField(this.periodicities, 'periodicity', event.query);
    this.filteredPeriodicities = this.transformAndMaintainOrder(filtered, 'id', 'periodicity');
  }

  searchRole(event: AutoCompleteCompleteEvent) {
    const filtered = this.filterByField(this.roles, 'role', event.query);
    this.filteredRoles = this.transformAndMaintainOrder(filtered, 'id', 'role');
  }

  searchWordcount(event: AutoCompleteCompleteEvent) {
    const filtered = this.filterByField(this.wordcounts, 'wordcount', event.query);
    this.filteredWordcounts = this.transformAndMaintainOrder(filtered, 'id', 'wordcount');
  }

  searchCirculation(event: AutoCompleteCompleteEvent) {
    const filtered = this.filterByField(this.circulations, 'circulation', event.query);
    this.filteredCirculations = this.transformAndMaintainOrder(filtered, 'id', 'circulation');
  }




  filterByField<T>(arr: T[], field: keyof T, query: string): T[] {
    return arr.filter(item => {console.log(field);
      const value = item[field];
      console.log(`Filtering ${value} with query ${query}`);
      return typeof value === 'string' && value.toLowerCase().includes(query.toLowerCase());
    });
  }

  transformAndMaintainOrder<T>(arr: T[], idField: keyof T, sortField: keyof T): T[] {
    // Sort by the custom field first
    const customSortedArr = arr.slice().sort((a, b) => {
      const valueA = a[sortField];
      const valueB = b[sortField];
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return this.customSort(valueA, valueB);
      }
      return 0;
    });

    // Then sort by the ID field to maintain the natural order
    const finalSortedArr = customSortedArr.slice().sort((a, b) => {
      const idA = a[idField];
      const idB = b[idField];
      if (typeof idA === 'number' && typeof idB === 'number') {
        return idA - idB;
      }
      return 0;
    });

    return finalSortedArr;
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
      rowData.titlePaper = inputElement.value;  // Update the ngModel
    }
  }

  handleRoleChange(rowData: TableData) {
    if (rowData.role?.disableWordCount) {
      rowData.wordcount = null; // Clear word count if the role disables it
    }
  }

}



