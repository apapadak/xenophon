import {Component, OnInit, ViewChild} from '@angular/core';
import { HeaderComponent } from "../../../header/header.component";
import { FooterComponent } from "../../../footer/footer.component";
import {ClaimsService} from "../../../services/ClaimsService";
import {FormsModule, NgForm} from "@angular/forms";
import {TableModule} from "primeng/table";
import {ButtonModule} from "primeng/button";
import {InputTextModule} from "primeng/inputtext";
import {AutoCompleteCompleteEvent, AutoCompleteModule} from "primeng/autocomplete";
import {PanelMenuModule} from "primeng/panelmenu";
import {CommonModule} from "@angular/common";
import {ToastModule} from "primeng/toast";
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import {MessageService, ConfirmationService} from "primeng/api";
import {CirculationData, ClaimsCommonService, PeriodicityData, RoleData, TitlePaperData, TypeData, WordcountData,} from '../../../helpers/common/claims-common.service';

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
  providers: [MessageService, ConfirmationService, ClaimsCommonService]
})

export class PaperClaimsComponent implements OnInit {
  @ViewChild('claimsPaperForm') claimsPaperForm!: NgForm; // Reference to the form

  userInfo: any;

  //data: TableData[] = [];
  //isAnyRowDeleted: boolean = false;

  constructor(
    public claimsCommonService: ClaimsCommonService
  ) {}

  ngOnInit() {
    this.userInfo = this.claimsCommonService.getUserInfo();

    //this.fetchData();
    this.claimsCommonService.fetchPaperClaims();
    //this.loadDropdownData();
    this.claimsCommonService.loadPaperDropdownData();
  }

  /*fetchData() {

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
      },
      error: (err) => {
        console.error('Failed to fetch claims:', err);
      }
    });
  }*/

  /*loadDropdownData() {
    this.claimsService.getPaperDropdownData().subscribe(data => {
      this.titlePapers = data.titlePapers;
      this.types = data.types;
      this.periodicities = data.periodicities;
      this.roles = data.roles;
      this.wordcounts = data.wordcounts;
      this.circulations = data.circulations;
    });
  }*/

  /*addRow() {
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
  }*/

  /*saveRow(rowData: TableData, rowIndex: number, title: any, signature: any, type: any, periodicity: any, role: any, wordcount: any, circulation: any) {
    console.log(rowData);
    this.claimsCommonService.markAsTouched(title, signature, type, periodicity, role, wordcount, circulation);

    if (this.claimsCommonService.isValidRow(rowData)) {
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
  }*/

  /*deleteRow(index: number) {
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
    this.confirmationService.confirm({
      message: 'Είστε σίγουροι ότι θέλετε να προχωρήσετε?\nΔεν επιτρέπονται άλλες αλλαγές μετά την Οριστική Αποθήκευση.',
      accept: () => {
        this.finalStore();
      }
    });
  }

  finalStore() {
    this.tempStore(true);
  }*/

}



