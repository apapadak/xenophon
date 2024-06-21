import {RouterModule, Routes} from '@angular/router';
import { LoginComponent } from "./accesscontrol/login.component";
import { HomeComponent } from "./home/home.component";
import {NgModule} from "@angular/core";
import {ProfileComponent} from "./content/profile/profile.component";

export const routes: Routes = [
  { path: 'home', component: HomeComponent, data: { name: 'HOME' } },
  /* { path: 'contracts', component: PaperclaimsComponent },
   { path: 'declarations', component: PaperclaimsComponent },
   { path: 'fillingout', component: PaperclaimsComponent },
   { path: 'payments', component: PaperclaimsComponent },*/
  { path: 'profile', component: ProfileComponent }
  //{ path: 'logout', component: PaperclaimsComponent }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContentRoutingModule {}
