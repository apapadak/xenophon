import { Component } from '@angular/core';
import { HeaderComponent } from "../../header/header.component";
import { FooterComponent } from "../../footer/footer.component";
import {RouterOutlet} from "@angular/router";

@Component({
  selector: 'app-home',
  templateUrl: './distributions.component.html',
  styleUrls: ['./distributions.component.css'],
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    // ... other imports
  ]
})
export class DistributionsComponent {
  // TODO: Implement home page logic
}
