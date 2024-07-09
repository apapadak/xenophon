import {Injectable, OnInit} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {ClaimsService} from "../../services/ClaimsService";
import {AutoCompleteCompleteEvent} from "primeng/autocomplete";
import {NgForm, NgModel} from "@angular/forms";
import {ConfirmationService, MessageService} from "primeng/api";

export interface BaseTableData {
  claimId: number;

  signature: string;

  periodicity: PeriodicityData | null;
  role: RoleData | null;
  wordcount: WordcountData | null;

  disabled: boolean; // Add this property used for disabling the whole row when needed
  finalFlag: boolean;

  created_at?: Date | null,
  updated_at?: Date | null,
  finalized_at?: Date | null
}

/*type PaperTableDataPreMerge = {
  claimId: number;
  titlePaper: TitlePaperData;
} & Omit<BaseTableData, 'claimId'>;

type InternetTableDataPreMerge = {
  claimId: number;
  titleInternet: TitleInternetData;
} & Omit<BaseTableData, 'claimId'>;

type TvTableDataPreMerge = {
  claimId: number;
  titleTv: TitleTvData;
} & Omit<BaseTableData, 'claimId'>;

type RadioTableDataPreMerge = {
  claimId: number;
  titleRadio: TitleRadioData;
} & Omit<BaseTableData, 'claimId'>;
*/




type TypeTableDataPreMerge = {
  signature: string;
  periodicity: PeriodicityData | null;
} & Omit<BaseTableData, 'signature'>;

type TvTypeTableDataPreMerge = {
  signature: string;
  periodicity: PeriodicityData | null;
} & Omit<BaseTableData, 'signature'>;

type RadioTypeTableDataPreMerge = {
  signature: string;
  periodicity: PeriodicityData | null;
} & Omit<BaseTableData, 'signature'>;

export interface PaperTypeTableData extends TypeTableDataPreMerge  {
  paperType: TypeData | null;
}

export interface InternetTypeTableData extends TypeTableDataPreMerge  {
  internetType: TypeData | null;
}

export interface TvTypeTableData extends TvTypeTableDataPreMerge {
  tvType: TypeData | null;
}

export interface RadioTypeTableData extends RadioTypeTableDataPreMerge {
  radioType: TypeData | null;
}


export interface PaperTableData extends PaperTypeTableData  {
  titlePaper: TitlePaperData;

  circulation: CirculationData | number | null;
}

export interface InternetTableData extends InternetTypeTableData {
  titleInternet: TitleInternetData;

  pageviews: PageviewsData | number | null;
}

export interface TvTableData extends TvTypeTableData {
  titleTv: TitleTvData;

  circulation: CirculationData | number | null;
}

export interface RadioTableData extends RadioTypeTableData {
  titleRadio: TitleRadioData;

  circulation: CirculationData | number | null;
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

export interface TitleTvData {
  id: number;
  title: string;

  custom: boolean;
}

export interface TitleRadioData {
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

export interface PageviewsData {
  id: number;
  pageviews: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClaimsCommonService {

  userInfo: any;

  //paperData: PaperTableData[] = [];
  //internetData: InternetTableData[] = [];

  data: (PaperTableData | InternetTableData | TvTableData | RadioTableData)[] = [];

  titlePapers: TitlePaperData[] = [];
  titleInternet: TitleInternetData[] = [];
  titleTv: TitleTvData[] = [];
  titleRadio: TitleRadioData[] = [];
  //filteredTitlePapers: TitlePaperData[] = [];
  //filteredTitleInternet: TitleInternetData[] = [];

  papertypes: TypeData[] = [];
  internettypes: TypeData[] = [];
  tvtypes: TypeData[] = [];
  radiotypes: TypeData[] = [];

  periodicities: PeriodicityData[] = [];
  tvperiodicities: PeriodicityData[] = [];
  radioperiodicities: PeriodicityData[] = [];

  roles: RoleData[] = [];

  wordcounts: WordcountData[] = [];

  circulations: CirculationData[] = [];

  pageviews: PageviewsData[] = [];

  isAnyRowDeleted: boolean = false;
  latestTimestampAt: Date | null = null;
  latestFinalizedAt: Date | null = null;


  constructor(private http: HttpClient,
              private claimsService: ClaimsService,
              private messageService: MessageService,
              private confirmationService: ConfirmationService
  ) {

  }

  getUserInfo() {
    const userInfoString = localStorage.getItem('userInfo');
    this.userInfo = userInfoString ? JSON.parse(userInfoString) : '';

    return this.userInfo;
  }

  loadDropdownData() {
    this.claimsService.getDropdownData().subscribe(data => {
      this.titlePapers = data.titlePapers;
      this.titleInternet = data.titleInternet;
      this.titleTv = data.titleTv;
      this.titleRadio = data.titleRadio;

      this.papertypes = data.papertypes;
      this.internettypes = data.internettypes;
      this.tvtypes = data.tvtypes;
      this.radiotypes = data.radiotypes;

      this.periodicities = data.periodicities;
      this.tvperiodicities = data.tvperiodicities;
      this.radioperiodicities = data.radioperiodicities;
      this.roles = data.roles;
      this.wordcounts = data.wordcounts;
      this.circulations = data.circulations;
      this.pageviews = data.pageviews;

      sessionStorage.setItem('titlePapers', JSON.stringify(this.titlePapers));
      sessionStorage.setItem('titleInternet', JSON.stringify(this.titleInternet));
      sessionStorage.setItem('titleTv', JSON.stringify(this.titleTv));
      sessionStorage.setItem('titleRadio', JSON.stringify(this.titleRadio));

      sessionStorage.setItem('papertypes', JSON.stringify(this.papertypes));
      sessionStorage.setItem('internettypes', JSON.stringify(this.internettypes));
      sessionStorage.setItem('tvtypes', JSON.stringify(this.tvtypes));
      sessionStorage.setItem('radiotypes', JSON.stringify(this.radiotypes));

      sessionStorage.setItem('periodicities', JSON.stringify(this.periodicities));
      sessionStorage.setItem('tvperiodicities', JSON.stringify(this.tvperiodicities));
      sessionStorage.setItem('radioperiodicities', JSON.stringify(this.radioperiodicities));
      sessionStorage.setItem('roles', JSON.stringify(this.roles));
      sessionStorage.setItem('wordcounts', JSON.stringify(this.wordcounts));
      sessionStorage.setItem('circulations', JSON.stringify(this.circulations));
      sessionStorage.setItem('pageviews', JSON.stringify(this.pageviews));
    });
  }

  deleteDropdownData() {
      sessionStorage.removeItem('titlePapers');
      sessionStorage.removeItem('titleInternet');
      sessionStorage.removeItem('titleTv');
      sessionStorage.removeItem('titleRadio');

      sessionStorage.removeItem('papertypes');
      sessionStorage.removeItem('internettypes');
      sessionStorage.removeItem('tvtypes');
      sessionStorage.removeItem('radiotypes');

      sessionStorage.removeItem('periodicities');
      sessionStorage.removeItem('tvperiodicities');
      sessionStorage.removeItem('radioperiodicities');
      sessionStorage.removeItem('roles');
      sessionStorage.removeItem('wordcounts');
      sessionStorage.removeItem('circulations');
      sessionStorage.removeItem('pageviews');
  }

  fetchPaperClaims() {
    console.log('userInfo: ', this.userInfo);

    this.claimsService.getPaperClaims(this.userInfo.user_id).subscribe({
      next: (data) => {
        this.data = data.map((row: PaperTableData) => ({  // Add disabled flag to each row in the fetched data
          ...row,
          disabled: true
        }));

        if (this.data.length === 0) {
          this.addPaperRow();
        }

        this.latestTimestampAt = this.findLatestTimestamp();
        this.latestFinalizedAt = this.findLatestFinalizedAt();

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
        this.data = data.map((row: PaperTableData) => ({ // Add disabled flag to each row in the fetched data
          ...row,
          disabled: true
        }));

        if (this.data.length === 0) {
          this.addInternetRow();
        }

        this.latestTimestampAt = this.findLatestTimestamp();
        this.latestFinalizedAt = this.findLatestFinalizedAt();

        console.log('data:', this.data);
      },
      error: (err) => {
        console.error('Failed to fetch paper claims:', err);
      }
    });
  }

  fetchTvClaims() {
    console.log('userInfo: ', this.userInfo);

    this.claimsService.getTvClaims(this.userInfo.user_id).subscribe({
      next: (data) => {
        this.data = data.map((row: TvTableData) => ({ // Add disabled flag to each row in the fetched data
          ...row,
          disabled: true
        }));

        if (this.data.length === 0) {
          this.addTvRow();
        }

        this.latestTimestampAt = this.findLatestTimestamp();
        this.latestFinalizedAt = this.findLatestFinalizedAt();

        console.log('data:', this.data);
      },
      error: (err) => {
        console.error('Failed to fetch paper claims:', err);
      }
    });
  }

  fetchRadioClaims() {
    console.log('userInfo: ', this.userInfo);

    this.claimsService.getRadioClaims(this.userInfo.user_id).subscribe({
      next: (data) => {
        this.data = data.map((row: RadioTableData) => ({ // Add disabled flag to each row in the fetched data
          ...row,
          disabled: true
        }));

        if (this.data.length === 0) {
          this.addRadioRow();
        }

        this.latestTimestampAt = this.findLatestTimestamp();
        this.latestFinalizedAt = this.findLatestFinalizedAt();

        console.log('data:', this.data);
      },
      error: (err) => {
        console.error('Failed to fetch paper claims:', err);
      }
    });
  }

  addPaperRow() {
    const newRow: PaperTableData = {
      claimId: -1,

      titlePaper: { id: -1, title: '', custom: false },
      signature: '',
      paperType: null,
      periodicity: null,
      role: null,
      wordcount: null,
      circulation: null,

      disabled: false,
      finalFlag: false
    };

    this.data.push(newRow);
  }

  addInternetRow() {
    const newRow: InternetTableData = {
      claimId: -1,

      titleInternet: { id: -1, title: '', custom: false },
      signature: '',
      internetType: null,
      periodicity: null,
      role: null,
      wordcount: null,
      pageviews: null,

      disabled: false,
      finalFlag: false
    };

    this.data.push(newRow);
  }

  addTvRow() {
    const newRow: TvTableData = {
      claimId: -1,

      titleTv: { id: -1, title: '', custom: false },
      signature: '',
      tvType: null,
      periodicity: null,
      role: null,
      wordcount: null,
      circulation: null,

      disabled: false,
      finalFlag: false
    };

    this.data.push(newRow);
  }

  addRadioRow() {
    const newRow: RadioTableData = {
      claimId: -1,

      titleRadio: { id: -1, title: '', custom: false },
      signature: '',
      radioType: null,
      periodicity: null,
      role: null,
      wordcount: null,
      circulation: null,

      disabled: false,
      finalFlag: false
    };

    this.data.push(newRow);
  }


  savePaperRow(form: NgForm, rowData: PaperTableData) {
    console.log(rowData);
    //console.log(form);
   // console.log(form.controls);

    Object.keys(form.controls).forEach(controlName => {
      const control = form.controls[controlName];
      control.markAsTouched();
    });

    //console.log(form.controls);

    if (this.isValidPaperRow(rowData)) {
      console.log('Saving paper row data:', rowData);

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
      console.log('paper row data prepared for saving:', this.data);
    } else {
      console.error('Validation failed for paper row data:', rowData);
    }
  }

  saveInternetRow(form: NgForm,rowData: InternetTableData) {
    console.log(rowData);

    console.log(form.controls);
    Object.keys(form.controls).forEach(controlName => {
      const control = form.controls[controlName];
      control.markAsTouched();
    });

    if (this.isValidInternetRow(rowData)) {
      console.log('Saving internet row data:', rowData);

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
      console.log('internet row data prepared for saving:', this.data);
    } else {
      console.error('Validation failed for internet row data:', rowData);
    }
  }

  saveTvRow(form: NgForm, rowData: TvTableData) {
    console.log(rowData);

    console.log(form.controls);
    Object.keys(form.controls).forEach(controlName => {
      const control = form.controls[controlName];
      control.markAsTouched();
    });

    if (this.isValidTvRow(rowData)) {
      console.log('Saving tv row data:', rowData);

      if (typeof rowData.titleTv === 'string') {
        rowData.titleTv = {
          id: -1,
          title: rowData.titleTv,
          custom: true
        };
      } else {
        rowData.titleTv.custom = false;
      }

      rowData.disabled = true; // Ensure the row is disabled after saving
      console.log('tv row data prepared for saving:', this.data);
    } else {
      console.error('Validation failed for tv row data:', rowData);
    }
  }

  saveRadioRow(form: NgForm, rowData: RadioTableData) {
    console.log(rowData);

    console.log(form.controls);
    Object.keys(form.controls).forEach(controlName => {
      const control = form.controls[controlName];
      control.markAsTouched();
    });

    if (this.isValidRadioRow(rowData)) {
      console.log('Saving radio row data:', rowData);

      if (typeof rowData.titleRadio === 'string') {
        rowData.titleRadio = {
          id: -1,
          title: rowData.titleRadio,
          custom: true
        };
      } else {
        rowData.titleRadio.custom = false;
      }

      rowData.disabled = true; // Ensure the row is disabled after saving
      console.log('radio row data prepared for saving:', this.data);
    } else {
      console.error('Validation failed for radio row data:', rowData);
    }
  }

  value(control: NgModel): boolean {
    console.log(control);
    return true;//control.invalid && (control.dirty || control.touched);
  }

  isValidPaperRow(rowData: PaperTableData): boolean {
    return !!rowData.titlePaper &&
      !!rowData.signature &&
      !!rowData.paperType &&
      !!rowData.periodicity &&
      !!rowData.role &&
      (rowData.role.disableWordCount || !!rowData.wordcount) &&
      !!rowData.circulation;
  }

  isValidInternetRow(rowData: InternetTableData): boolean {
    return !!rowData.titleInternet &&
      !!rowData.signature &&
      !!rowData.internetType &&
      !!rowData.periodicity &&
      !!rowData.role &&
      (rowData.role.disableWordCount || !!rowData.wordcount) &&
      !!rowData.pageviews;
  }

  isValidTvRow(rowData: TvTableData): boolean {
    return !!rowData.titleTv &&
      !!rowData.signature &&
      !!rowData.tvType &&
      !!rowData.periodicity &&
      !!rowData.role
  }

  isValidRadioRow(rowData: RadioTableData): boolean {
    return !!rowData.titleRadio &&
      !!rowData.signature &&
      !!rowData.radioType &&
      !!rowData.periodicity &&
      !!rowData.role
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
   // console.log(this.isAnyRowDeleted, ' ', !(this.data as BaseTableData[]).every(row => row.finalFlag));
    return this.isAnyRowDeleted || !(this.data as BaseTableData[]).every(row => row.finalFlag);
  }

  isAddRowDisabled(): boolean {
    return (this.data.length == 0 && !this.isAnyRowDeleted) || this.data.some(row => !row.disabled);
  }

  tempStore(formType: 'paper' | 'internet' | 'tv' | 'radio', finalFlag: boolean) {
    const payload = {
      userId: this.userInfo.user_id,
      claims: this.data.map(({ disabled, ...row }) => ({
        ...row,
        role: row.role ? {
          id: row.role.id,
          role: row.role.role
        } : null
      })),
      finalFlag: finalFlag
    };

    console.log('Data to be sent:', payload);

    let saveClaimsObservable: Observable<any> | null = null;

    switch (formType) {
      case 'paper':
        saveClaimsObservable = this.claimsService.savePaperClaims(payload);
        break;
      case 'internet':
        saveClaimsObservable = this.claimsService.saveInternetClaims(payload);
        break;
      case 'tv':
        saveClaimsObservable = this.claimsService.saveTvClaims(payload);
        break;
      case 'radio':
        saveClaimsObservable = this.claimsService.saveRadioClaims(payload);
        break;
      default:
        console.error('Unknown form type');
    }
    if (saveClaimsObservable) {
      saveClaimsObservable.subscribe({
        next: (response) => {
          if ( !finalFlag ) {
            this.messageService.add({severity: 'success', summary: 'Επιτυχία', detail: 'Επιτυχής προσωρινή αποθήκευση'});
          } else {
            this.messageService.add({severity: 'success', summary: 'Επιτυχία', detail: 'Επιτυχής οριστική αποθήκευση'});
          }

          switch (formType) {
            case 'paper':
              this.fetchPaperClaims();
              break;
            case 'internet':
              this.fetchInternetClaims();
              break;
            case 'tv':
              this.fetchTvClaims()
              break;
            case 'radio':
              this.fetchRadioClaims()
              break;
            default:
              console.error('Unknown form type');
          }
          this.isAnyRowDeleted = false;

          console.log('Data successfully saved:', response);
        },
        error: (error) => {
          this.messageService.add({severity: 'danger', summary: 'Αποτυχία', detail: 'Αποτυχία προσωρινής αποθήκευσης'});

          console.error('Failed to save data:', error);
        }
      });
    }
  }

  confirmFinalStore(formType: 'paper' | 'internet' | 'tv' | 'radio') {
    this.confirmationService.confirm({
      message: 'Είστε σίγουροι ότι θέλετε να προχωρήσετε?\nΔεν επιτρέπονται άλλες αλλαγές μετά την Οριστική Αποθήκευση.',
      accept: () => {
        this.finalStore(formType);
      }
    });
  }

  finalStore(formType: 'paper' | 'internet' | 'tv' | 'radio') {
    this.tempStore(formType, true);
  }

  search<T>(hash: string, field: keyof T, event: AutoCompleteCompleteEvent, idField: keyof T, sortField: keyof T): T[] {
    const storedData = sessionStorage.getItem(hash);
    let array: T[] = [];

    if (storedData) {
      array = JSON.parse(storedData);
    }

    const filtered = this.filterByField(array, field, event.query);
    return this.transformAndMaintainOrder(filtered, idField, sortField);
  }

  filterByField<T>(arr: T[], field: keyof T, query: string): T[] {
    return arr.filter(item => {//console.log(field);
      const value = item[field];
      //console.log(`Filtering ${value} with query ${query}`);
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

  handleRoleChange(rowData: PaperTableData | InternetTableData | TvTableData | RadioTableData) {
    if (rowData.role?.disableWordCount) {
      rowData.wordcount = null; // Clear word count if the role disables it
    }
  }

  findLatestTimestamp(): Date | null {
    if (this.data.length === 0) return null;

    return this.data
      .filter(claim => claim.updated_at || claim.created_at) // Filter out claims where both dates are null
      .reduce((latest: Date | null, current) => {
        const currentDate = new Date(
          current.updated_at && current.created_at
            ? (new Date(current.updated_at) > new Date(current.created_at)
              ? current.updated_at
              : current.created_at)
            : (current.updated_at || current.created_at)!
        );

        return !latest || currentDate > latest ? currentDate : latest;
      }, null as Date | null);
  }


  findLatestFinalizedAt(): Date | null {
    if (this.data.length === 0) return null;

    // Check if all finalFlag properties are set to true
    const allFinalized = this.data.every(claim => claim.finalFlag);

    // Find the latest finalized_at date
    return this.data
      .filter(claim => claim.finalized_at) // Filter out null or undefined dates
      .reduce((latest: Date | null, current) => {
        if (!current.finalized_at) return latest;
        const currentDate = new Date(current.finalized_at);
        return latest && latest > currentDate ? latest : currentDate;
      }, null as Date | null);
  }

}
