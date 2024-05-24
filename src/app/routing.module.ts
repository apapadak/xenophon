import {RouterModule, Routes} from '@angular/router';
import { LoginComponent } from "./login/login.component";
import { HomeComponent } from "./home/home.component";
import {NgModule} from "@angular/core";
import {ProfileComponent} from "./profile/profile.component";

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, data: { name: 'HOME' } },
  /* { path: 'contracts', component: ProfileComponent },
   { path: 'declarations', component: ProfileComponent },
   { path: 'fillingout', component: ProfileComponent },
   { path: 'payments', component: ProfileComponent },*/
  { path: 'profile', component: ProfileComponent }
  //{ path: 'logout', component: ProfileComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule {}
