import {ApplicationConfig, importProvidersFrom} from '@angular/core';
import { provideRouter } from '@angular/router';

import {RoutingModule, routes} from './routing.module';
import {HttpClientModule} from "@angular/common/http";
import {InterceptorModule} from "./helpers/interceptors/interceptor.module";
import {BrowserAnimationsModule, NoopAnimationsModule} from "@angular/platform-browser/animations";
//import {ContentRoutingModule} from "./content-routing.module";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    importProvidersFrom(HttpClientModule, InterceptorModule, BrowserAnimationsModule),
    RoutingModule // Include RoutingModule
    //ContentRoutingModule, // Include AdminRoutingModule
  ]
};
