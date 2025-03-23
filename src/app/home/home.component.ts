import {Component, OnInit} from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { FooterComponent } from "../footer/footer.component";
import { NavigationComponent } from "../navigation/nav.component";
import {Router, RouterOutlet} from "@angular/router";
import {ProfileComponent} from "../content/profile/profile.component";
import {AuthService} from "../services/AuthService";
import {CommonModule} from "@angular/common";
import {ClaimsCommonService} from "../helpers/common/claims-common.service";
import {ConfirmationService, MessageService} from "primeng/api";

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
  ],
  providers: [MessageService, ConfirmationService, ClaimsCommonService]
})
export class HomeComponent {
  isHomeRoute: boolean = false;
  isClaimsRoute: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    public claimsCommonService: ClaimsCommonService
  ) {
    this.router.events.subscribe(() => {
      this.isHomeRoute = this.router.url === '/home';
    });
    this.router.events.subscribe(() => {
      this.isClaimsRoute = this.router.url === '/claims';
    });
  }

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
      case 'PAPERCLAIMS':
        this.router.navigate(['paperclaims']);
        break;
      case 'INTERNETCLAIMS':
        this.router.navigate(['internetclaims']);
        break;
      case 'TVCLAIMS':
        this.router.navigate(['tvclaims']);
        break;
      case 'RADIOCLAIMS':
        this.router.navigate(['radioclaims']);
        break;
      case 'OTHERCLAIMS':
        this.router.navigate(['otherclaims']);
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
      case 'ADMIN':
        this.router.navigate(['admin']);
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

        this.claimsCommonService.deleteDropdownData();

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
