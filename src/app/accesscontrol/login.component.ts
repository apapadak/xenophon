import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [FormsModule] // Import FormsModule here
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(private router: Router) {} // Step 2: Inject Router

  onSubmit() {
    // TODO: Implement login logic (e.g., call authentication service)
    // For demonstration purposes, we'll assume successful login
    console.log('Login successful');
    // Redirect to '/home'
    this.router.navigate(['/home']);

  }
}
