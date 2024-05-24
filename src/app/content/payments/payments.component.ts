import { Component } from '@angular/core';
import { HeaderComponent } from "../../header/header.component";
import { FooterComponent } from "../../footer/footer.component";
import {RouterOutlet} from "@angular/router";

@Component({
  selector: 'app-home',
  templateUrl: './contracts.component.html',
  styleUrls: ['./contracts.component.css'],
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    // ... other imports
  ]
})
export class ContractsComponent {
  // TODO: Implement home page logic
}
