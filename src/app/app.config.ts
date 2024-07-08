import {ApplicationConfig, importProvidersFrom} from '@angular/core';
import { provideRouter } from '@angular/router';
import {RoutingModule, routes} from './routing.module';
import {HttpClientModule} from "@angular/common/http";
import {InterceptorModule} from "./helpers/interceptors/interceptor.module";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {ConfirmationService, MessageService} from "primeng/api";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    importProvidersFrom(HttpClientModule, InterceptorModule, BrowserAnimationsModule),
    RoutingModule,
    MessageService,
    ConfirmationService
  ]
};
