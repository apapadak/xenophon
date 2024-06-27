import {Component, EventEmitter, Output} from '@angular/core';
import {CommonModule} from "@angular/common";

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

  constructor() {}

  ngOnInit(): void {
    this.showSubMenu['CLAIMS'] = true; // Set the submenu to be open by default
  }

  onNavigate(route: string): void {
    // Emit the selected route
    this.navigate.emit(route);
  }
}
