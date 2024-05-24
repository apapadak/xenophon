import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
  standalone: true
})
export class NavigationComponent {
  @Output() navigate = new EventEmitter<string>();

  constructor() {}

  onNavigate(route: string): void {
    // Emit the selected route
    this.navigate.emit(route);
  }
}
