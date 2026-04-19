import {Component, EventEmitter, Output} from '@angular/core';
import {CommonModule} from "@angular/common";
import {UserService} from "../services/UserService";

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
  standalone: true,
  imports: [
    CommonModule,
  ],
})
export class NavigationComponent {
  @Output() navigate = new EventEmitter<string>();
  showSubMenu: { [key: string]: boolean } = {};

  isAdmin: boolean = false;

  constructor(
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.showSubMenu['CLAIMS'] = true; // Set the submenu to be open by default
    this.showSubMenu['TVCLAIMS'] = true;
    this.showSubMenu['RADIOCLAIMS'] = true;

    this.checkAdminStatus();
  }

  onNavigate(route: string): void {
    this.navigate.emit(route);
  }

  checkAdminStatus() {
    //console.log(this.userService.userInfo);
    const username = this.userService.userInfo.afm;
    this.userService.checkCredentials(username).subscribe(
      (response) => {
        this.isAdmin = response.isAdmin;
      },
      (error) => {
        console.error('Error checking admin status:', error);
      }
    );
  }
}
