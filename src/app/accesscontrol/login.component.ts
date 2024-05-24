import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Import CommonModule


import { Router } from '@angular/router';
import {AuthService} from '../services/AuthService';
import { UserService } from '../services/UserService';
import {HttpClientModule} from "@angular/common/http";
import {switchMap} from "rxjs";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [FormsModule, HttpClientModule, CommonModule] // Import FormsModule here
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  errorMessage: string = '';  // Add an error message field

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService
  ) {} // Step 2: Inject Router

  onLogin() {
    console.log("attempting login... " + this.username + ' ' + this.password);
    this.authService.login(this.username, this.password).pipe(
      switchMap(response => {
        // Assume the token is returned in response.token
        console.log('Login OK');
        localStorage.setItem('jwt', response.token);

        // Fetch user details after successful login
        return this.userService.getUser(this.username);
      })
    ).subscribe(
      user => {
        console.log('Login successful; User details fetched: ', user);
        localStorage.setItem('userInfo', JSON.stringify(user));

        this.router.navigate(['/home']);
      },
      error => {
        console.log('Login unsucceful ', error);
        this.handleErrorResponse(error);
      }
    );
  }

  private handleErrorResponse(error: any) {
    // Example error handling
    if (error.status === 400 || error.status === 404) {
      this.errorMessage = "Invalid username or password.";
    } else {
      this.errorMessage = "An unexpected error occurred.";
    }
  }

}
