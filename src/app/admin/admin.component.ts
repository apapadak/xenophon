import {Component, OnInit} from '@angular/core';
import {RouterOutlet} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {ButtonModule} from "primeng/button";
import { ToolbarModule } from 'primeng/toolbar';
import {CommonModule} from "@angular/common";
import {ConfirmationService, MessageService} from "primeng/api";
import {ToastModule} from "primeng/toast";
import {HeaderComponent} from "../header/header.component";
import {FooterComponent} from "../footer/footer.component";
import {UserData, UserService} from "../services/UserService";
import {ConfirmDialogModule} from 'primeng/confirmdialog';

@Component({
  selector: 'app-home',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    FormsModule,

    CommonModule,
    ButtonModule,
    ToolbarModule,
    ToastModule,
    ConfirmDialogModule,
  ]
})
export class AdminComponent implements OnInit {

  registerMode: boolean = false; // Property to track register mode
  editMode: boolean = false; // Property to track edit mode
  retrievedMode: boolean = false; // Property to track retrieved mode
  dobErrorMessage: string | null = null; // Property to hold error message

  username: string = '';

  user: UserData = this.userService.initializeUserData();

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {  }

  ngOnInit() { }

  registerUser() {
    this.user = this.userService.initializeUserData();
    this.registerMode = true;
  }

  editUser() {
    this.editMode = true;
  }

  searchAfm() {
    this.userService.getUser(this.username).subscribe(
      user => {
        this.user = user;
        this.retrievedMode = true;
      },
      error => {
        this.messageService.add({severity: 'danger', summary: 'Δεν βρέθηκε', detail: 'Δεν βρέθηκε χρήστης με αυτό το ΑΦΜ'});
        this.retrievedMode = false;
      }
    );
  }

  doSave(isRegister: boolean) {
    const datePattern = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

    if (this.user.dob && !datePattern.test(this.user.dob.trim())) {
      this.messageService.add({ severity: 'error', summary: 'Αποτυχία', detail: 'Η ημερομηνία πρέπει να είναι στη μορφή dd/mm/yyyy' });
      this.dobErrorMessage = 'Η ημερομηνία πρέπει να είναι στη μορφή dd/mm/yyyy';

      return;
    }

    this.dobErrorMessage = null;

    const action = isRegister ? 'εισαγωγή' : 'μεταβολή';
    const successMessage = isRegister ? 'Καταχωρήθηκε επιτυχώς ο χρήστης' : 'Έγινε επιτυχής μεταβολή των στοιχείων του χρήστη';
    const confirmMessage = `Είστε σίγουροι ότι θέλετε να προχωρήσετε στην ${action} του χρήστη με ΑΦΜ: ${this.user.afm}`;

    this.confirmationService.confirm({
      message: confirmMessage,
      accept: () => {
        this.userService.saveUser(this.user).subscribe(
          (response) => {
            console.log(`User ${isRegister ? 'registered' : 'updated'} successfully`, response);
            this.messageService.add({ severity: 'success', summary: 'Επιτυχία', detail: successMessage });

            this.registerMode = false;
            this.retrievedMode = false;
            this.user = this.userService.initializeUserData();
          },
          (error) => {
            console.error(`Error ${isRegister ? 'registering' : 'updating'} user`, error);

            if (error.status === 409) {
              this.messageService.add({ severity: 'error', summary: 'Αποτυχία', detail: 'Ο χρήστης με αυτό το ΑΦΜ υπάρχει ήδη' });
            } else if (error.status === 410) {
              this.messageService.add({ severity: 'error', summary: 'Αποτυχία', detail: 'Ο χρήστης με αυτό το αριθμό μητρώου υπάρχει ήδη' });
            } else {
              this.messageService.add({ severity: 'error', summary: 'Αποτυχία', detail: 'Αποτυχία καταχώρησης χρήστη' });
            }
          }
        );
      }
    });
  }

  doRegister() {
    this.doSave(true);
  }

  doEdit() {
    this.doSave(false);
  }


  cancelRegister() {
    this.registerMode = false;
    this.user = this.userService.initializeUserData();
  }

  cancelEdit() {
    this.editMode = false; this.retrievedMode = false;
    this.user = this.userService.initializeUserData();
    this.username = '';
  }

}
