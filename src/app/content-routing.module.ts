import {RouterModule, Routes} from '@angular/router';
import { LoginComponent } from "./accesscontrol/login.component";
import { HomeComponent } from "./home/home.component";
import {NgModule} from "@angular/core";
import {ProfileComponent} from "./content/profile/profile.component";

export const routes: Routes = [
  { path: 'home', component: HomeComponent, data: { name: 'HOME' } },
  /* { path: 'contracts', component: ClaimsComponent },
   { path: 'declarations', component: ClaimsComponent },
   { path: 'fillingout', component: ClaimsComponent },
   { path: 'payments', component: ClaimsComponent },*/
  { path: 'profile', component: ProfileComponent }
  //{ path: 'logout', component: ClaimsComponent }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContentRoutingModule {}
