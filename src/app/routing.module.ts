import {RouterModule, Routes} from '@angular/router';
import { LoginComponent } from "./accesscontrol/login.component";
import { HomeComponent } from "./home/home.component";
import {NgModule} from "@angular/core";
import {ProfileComponent} from "./content/profile/profile.component";
import {ContractsComponent} from "./content/contracts/contracts.component";
import {PaymentsComponent} from "./content/payments/payments.component";
import {DistributionsComponent} from "./content/distributions/distributions.component";
import {ClaimsComponent} from "./content/claims/claims.component";
import {AuthGuard} from "./helpers/guards/auth.guard";
import {PageNotFoundComponent} from "./helpers/notfound/page-not-found.component";

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'logout', component: LoginComponent,canActivate: [AuthGuard] },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard], data: { name: 'HOME' } },
  /* { path: 'contracts', component: ClaimsComponent },
   { path: 'declarations', component: ClaimsComponent },
   { path: 'fillingout', component: ClaimsComponent },
   { path: 'payments', component: ClaimsComponent },*/
  {
    path: '',
    component: HomeComponent,
    children: [
      { path: 'contracts', component: ContractsComponent, canActivate: [AuthGuard] },
      { path: 'claims', component: ClaimsComponent, canActivate: [AuthGuard] },
      { path: 'payments', component: PaymentsComponent, canActivate: [AuthGuard] },
      { path: 'distributions', component: DistributionsComponent, canActivate: [AuthGuard] },
      { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
      // ... other child routes
    ]
  },
  { path: '**', component: PageNotFoundComponent } // Wildcard route
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RoutingModule {}
