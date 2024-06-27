import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {ClaimsService} from "../../services/ClaimsService";
import {AutoCompleteCompleteEvent} from "primeng/autocomplete";
import {NgForm} from "@angular/forms";
import {ConfirmationService, MessageService} from "primeng/api";

export interface BaseTableData {
  claimId: number;

  signature: string;
  type: TypeData | null;
  periodicity: PeriodicityData | null;
  role: RoleData | null;
  wordcount: WordcountData | null;
  circulation: CirculationData | null;

  disabled: boolean; // Add this property used for disabling the whole row when needed
  permFlag: boolean;
}

// Define a type that includes titlePaper in the correct position
type PaperTableDataPreMerge = {
  claimId: number;
  titlePaper: TitlePaperData;
} & Omit<BaseTableData, 'claimId'>;

// Define a type that includes titleInternet in the correct position
type InternetTableDataPreMerge = {
  claimId: number;
  titleInternet: TitleInternetData;
} & Omit<BaseTableData, 'claimId'>;

export interface PaperTableData extends PaperTableDataPreMerge  {
  titlePaper: TitlePaperData;
}

export interface InternetTableData extends InternetTableDataPreMerge {
  titleInternet: TitleInternetData;
}

export interface TitlePaperData {
  id: number;
  title: string;

  custom: boolean;
}

export interface TitleInternetData {
  id: number;
  title: string;

  custom: boolean;
}

export interface TypeData {
  id: number;
  type: string;
}

export interface PeriodicityData {
  id: number;
  periodicity: string;
}

export interface RoleData {
  id: number;
  role: string;

  disableWordCount: boolean;
}

export interface WordcountData {
  id: number;
  wordcount: string;
}

export interface CirculationData {
  id: number;
  circulation: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClaimsCommonService {

  userInfo: any;

  //paperData: PaperTableData[] = [];
  //internetData: InternetTableData[] = [];

  data: (PaperTableData | InternetTableData)[] = [];

  titlePapers: TitlePaperData[] = [];
  titleInternet: TitleInternetData[] = [];
  filteredTitlePapers: TitlePaperData[] = [];
  filteredTitleInternet: TitleInternetData[] = [];

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

  isAnyRowDeleted: boolean = false;

  constructor(private http: HttpClient,
              private claimsService: ClaimsService,
              private messageService: MessageService,
              private confirmationService: ConfirmationService,
  ) {
  }

  getUserInfo() {
    const userInfoString = localStorage.getItem('userInfo');
    this.userInfo = userInfoString ? JSON.parse(userInfoString) : '';

    return this.userInfo;
  }

  fetchPaperClaims() {
    console.log('userInfo: ', this.userInfo);

    this.claimsService.getPaperClaims(this.userInfo.user_id).subscribe({
      next: (data) => {
        // Add disabled flag to each row in the fetched data
        this.data = data.map((row: PaperTableData) => ({
          ...row,
          disabled: true
        }));

        if (this.data.length === 0) {
          this.addPaperRow();
        }

        console.log('data:', this.data);
      },
      error: (err) => {
        console.error('Failed to fetch paper claims:', err);
      }
    });
  }

  fetchInternetClaims() {
    console.log('userInfo: ', this.userInfo);

    this.claimsService.getInternetClaims(this.userInfo.user_id).subscribe({
      next: (data) => {
        // Add disabled flag to each row in the fetched data
        this.data = data.map((row: PaperTableData) => ({
          ...row,
          disabled: true
        }));

        if (this.data.length === 0) {
          this.addInternetRow();
        }

        console.log('data:', this.data);
      },
      error: (err) => {
        console.error('Failed to fetch paper claims:', err);
      }
    });
  }

  loadPaperDropdownData() {
    this.claimsService.getTitlePapersDropdownData().subscribe(data => {
      this.titlePapers = data.titlePapers;
    });
    this.loadClaimsDropdownData();
  }
  loadInternetDropdownData() {
    this.claimsService.getTitleInternetDropdownData().subscribe(data => {
      this.titleInternet = data.titleInternet;
    });
    this.loadClaimsDropdownData();
  }

  loadClaimsDropdownData() {
    this.claimsService.getClaimsDropdownData().subscribe(data => {
      this.types = data.types;
      this.periodicities = data.periodicities;
      this.roles = data.roles;
      this.wordcounts = data.wordcounts;
      this.circulations = data.circulations;
    });
  }

  addPaperRow() {
    const newRow: PaperTableData = {
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
    };

    this.data.push(newRow);
  }

  addInternetRow() {
    const newRow: InternetTableData = {
      claimId: -1,

      titleInternet: { id: -1, title: '', custom: false },
      signature: '',
      type: null,
      periodicity: null,
      role: null,
      wordcount: null,
      circulation: null,

      disabled: false, // Initialize as false
      permFlag: false
    };

    this.data.push(newRow);
  }

  isPaperTableData(data: any): data is PaperTableData {
    return 'titlePaper' in data;
  }

  isInternetTableData(data: any): data is InternetTableData {
    return 'titleInternet' in data;
  }

  savePaperRow(form: NgForm, rowData: PaperTableData) {
    console.log(rowData);
    //console.log(form);
    //console.log(form.controls);

   // const { title, signature, type, periodicity, role, wordcount, circulation } = form.controls;
    //this.markAsTouched(form.controls);
    Object.keys(form.controls).forEach(controlName => {
      const control = form.controls[controlName];
      control.markAsTouched();
    });

    if (this.isValidRow(rowData)) {
      console.log('Saving row data:', rowData);

      // Handle PaperTableData
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
    } else {
      console.error('Validation failed for row data:', rowData);
    }

    console.log('row data prepared for saving:', this.data);
  }

  saveInternetRow(form: NgForm,rowData: InternetTableData) {
    console.log(rowData);

    //const { title, signature, type, periodicity, role, wordcount, circulation } = form.controls;
    Object.keys(form.controls).forEach(controlName => {
      const control = form.controls[controlName];
      control.markAsTouched();
    });

    if (this.isValidRow(rowData)) {
      console.log('Saving row data:', rowData);

      if (typeof rowData.titleInternet === 'string') {
        rowData.titleInternet = {
          id: -1,
          title: rowData.titleInternet,
          custom: true
        };
      } else {
        rowData.titleInternet.custom = false;
      }

      rowData.disabled = true; // Ensure the row is disabled after saving
    } else {
      console.error('Validation failed for row data:', rowData);
    }

    console.log('row data prepared for saving:', this.data);
  }

  isValidRow(rowData: PaperTableData | InternetTableData): boolean {
    // Check if rowData has titlePaper or titleInternet
    const hasTitle = this.isPaperTableData(rowData) ? !!rowData.titlePaper : !!rowData.titleInternet;

    return hasTitle &&
      !!rowData.signature &&
      !!rowData.type &&
      !!rowData.periodicity &&
      !!rowData.role &&
      (rowData.role.disableWordCount || !!rowData.wordcount) &&
      !!rowData.circulation;
  }

  searchTitlePaper(event: AutoCompleteCompleteEvent) {
    console.log('hi');
    this.filteredTitlePapers = this.search(this.titlePapers, 'title', event, 'id', 'title');
  }

  searchTitleInternet(event: AutoCompleteCompleteEvent) {
    this.filteredTitleInternet = this.search(this.titleInternet, 'title', event, 'id', 'title');
  }

  searchTypes(event: AutoCompleteCompleteEvent) {
    this.filteredTypes = this.search(this.types, 'type', event, 'id', 'type');
  }

  searchPeriodicity(event: AutoCompleteCompleteEvent) {
    this.filteredPeriodicities = this.search(this.periodicities, 'periodicity', event, 'id', 'periodicity');
  }

  searchRole(event: AutoCompleteCompleteEvent) {
    this.filteredRoles = this.search(this.roles, 'role', event, 'id', 'role');
  }

  searchWordcount(event: AutoCompleteCompleteEvent) {
    this.filteredWordcounts = this.search(this.wordcounts, 'wordcount', event, 'id', 'wordcount');
  }

  searchCirculation(event: AutoCompleteCompleteEvent) {
    this.filteredCirculations = this.search(this.circulations, 'circulation', event, 'id', 'circulation');
  }

  deleteRow(index: number) {
    this.data.splice(index, 1);

    this.isAnyRowDeleted = true;
    console.log('1 ', this.data);
    if (this.data.length === 0 && !this.isAnyRowDeleted) {
      this.addPaperRow();
    }

    console.log('2 ', this.data);
  }

  isStoreButtonsDisabled(): boolean {
    //console.log(this.data);
    //console.log('this.data.length ', this.data.length, ' this.isAnyRowDeleted:', this.isAnyRowDeleted, ' ', this.data.every(row => row.disabled === true));
    return (this.data.length == 0 && !this.isAnyRowDeleted) || (this.data.length > 0 && !(this.data as BaseTableData[]).every(row => row.disabled));
  }

  showControls(): boolean {
   // console.log(this.isAnyRowDeleted, ' ', !(this.data as BaseTableData[]).every(row => row.permFlag));
    return this.isAnyRowDeleted || !(this.data as BaseTableData[]).every(row => row.permFlag);
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

    let saveClaimsObservable: Observable<any>;

    if (this.data.length == 0 || this.isPaperTableData(this.data[0])) {
      saveClaimsObservable = this.claimsService.savePaperClaims(payload);
    } else if (this.data.length == 0 || this.isInternetTableData(this.data[0])) {
      saveClaimsObservable = this.claimsService.saveInternetClaims(payload);
    } else {
      console.error('Unknown data type');
      return;
    }

    saveClaimsObservable.subscribe({
      next: (response) => {
        this.messageService.add({severity: 'success', summary: 'Επιτυχία', detail: 'Επιτυχής προσωρινή αποθήκευση'});

        //this.fetchData(); // refresh data array
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

  search<T>(arr: T[], field: keyof T, event: AutoCompleteCompleteEvent, idField: keyof T, sortField: keyof T): T[] {
    const filtered = this.filterByField(arr, field, event.query);
    return this.transformAndMaintainOrder(filtered, idField, sortField);
  }

  filterByField<T>(arr: T[], field: keyof T, query: string): T[] {
    return arr.filter(item => {console.log(field);
      const value = item[field];
      console.log(`Filtering ${value} with query ${query}`);
      return typeof value === 'string' && (value as string).toLowerCase().includes(query.toLowerCase());
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

  handleRoleChange(rowData:  PaperTableData | InternetTableData) {
    if (rowData.role?.disableWordCount) {
      rowData.wordcount = null; // Clear word count if the role disables it
    }
  }

}
