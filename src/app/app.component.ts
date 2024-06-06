import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {HttpClientModule} from "@angular/common/http";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {PageNotFoundComponent} from "./helpers/notfound/page-not-found.component";

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [
    HttpClientModule,
    RouterOutlet,
    PageNotFoundComponent
    // ... other imports
  ]
})
export class AppComponent {
  title = 'Xenophon';
}
