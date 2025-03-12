import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


import { Router } from '@angular/router';
import {AuthService} from '../services/AuthService';
import { UserService } from '../services/UserService';
import {HttpClientModule} from "@angular/common/http";
import {switchMap, throwError} from "rxjs";
import {ConfirmationService, MessageService} from "primeng/api";
import {ClaimsCommonService} from "../helpers/common/claims-common.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [FormsModule, HttpClientModule, CommonModule],
  providers: [ClaimsCommonService]
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  errorMessage: string = '';
  accessDisabled: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    public claimsCommonService: ClaimsCommonService
  ) {  }

  onLogin() {
    this.username = this.username.trim();
    this.password = this.password.trim();

    console.log("attempting login... " + this.username + ' ' + this.password);

    this.authService.login(this.username, this.password).pipe(
      switchMap(response => {
        /*if (this.username !== 'zscooter') {
          return throwError({ status: 401, message: 'Forbidden!' });
        }*/
        console.log('Login OK');

        // Fetch user details after successful login
        return this.userService.getUser(this.username);
      })
    ).subscribe(
      user => {
        console.log('Login successful; User details fetched: ', user);
        localStorage.setItem('userInfo', JSON.stringify(user));

        this.claimsCommonService.loadDropdownData();
        this.userService.loadProfileData();

        this.router.navigate(['/home']);
      },
      error => {
        console.log('Login unsuccessful ', error);
        this.handleErrorResponse(error);
      }
    );
  }

  private handleErrorResponse(error: any) {
    // Example error handling
    if (error.status === 400 || error.status === 404) {
      this.errorMessage = "Invalid username or password.";
    } else if (error.status === 401) {
      this.errorMessage = "Δεν είναι δυνατή η είδοδος στην πλατφόρμα. Καλέστε την γραμματεία.";
    }
    else {
      this.errorMessage = "An unexpected error occurred.";
    }
  }

}
