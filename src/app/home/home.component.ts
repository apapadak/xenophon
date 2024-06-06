import { Component } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { FooterComponent } from "../footer/footer.component";
import { NavigationComponent } from "../navigation/nav.component";
import {Router, RouterOutlet} from "@angular/router";
import {ProfileComponent} from "../content/profile/profile.component";
import {AuthService} from "../services/AuthService";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    NavigationComponent,
    ProfileComponent,
    CommonModule
    // ... other imports
  ]
})
export class HomeComponent {
  constructor(private router: Router, private authService: AuthService) {}

  onNavigate(route: string): void {
    // Logic to navigate to the selected route
    console.log('Navigating to:', route);

    switch (route) {
      case 'HOME':
        this.router.navigate(['home']);
        break;
      case 'CONTRACTS':
        this.router.navigate(['contracts']);
        break;
      case 'CLAIMS':
        this.router.navigate(['claims']);
        break;
      case 'PAYMENTS':
        this.router.navigate(['payments']);
        break;
      case 'DISTRIBUTIONS':
        this.router.navigate(['distributions']);
        break;
      case 'PROFILE':
        this.router.navigate(['profile']);
        break;
      case 'LOGOUT':
        this.performLogout();
        break;
      // Add other cases for different route names as needed
      default:
        console.error('Invalid route name:', route);
        break;
    }
  }

  private performLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        localStorage.removeItem('jwt');
        localStorage.removeItem('userInfo');
        this.router.navigate(['login']).then(() => {
          window.location.reload();  // Optional: Force a reload to clear all data
        });
      },
      error: (err) => {
        console.error('Logout failed', err);
        // Handle errors if necessary
      }
    });
  }
}
