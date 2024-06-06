import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/AuthService'; // Ensure the path is correct

@Component({
  selector: 'app-page-not-found',
  template: '',
  standalone: true, // Mark as standalone component
})
export class PageNotFoundComponent {
  constructor(private router: Router, private authService: AuthService) {
    this.authService.validateToken().subscribe(
      response => {
        if (response.valid) {
          this.router.navigate(['/home']); // Redirect to home if authenticated
        } else {
          this.router.navigate(['/login']); // Redirect to login if not authenticated
        }
      },
      error => {
        this.router.navigate(['/login']); // Redirect to login if there's an error
      }
    );
  }
}
