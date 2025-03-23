import {RouterModule, Routes} from '@angular/router';
import { LoginComponent } from "./accesscontrol/login.component";
import { HomeComponent } from "./home/home.component";
import {NgModule} from "@angular/core";
import {ProfileComponent} from "./content/profile/profile.component";
import {ContractsComponent} from "./content/contracts/contracts.component";
import {PaymentsComponent} from "./content/payments/payments.component";
import {DistributionsComponent} from "./content/distributions/distributions.component";
import {PaperClaimsComponent} from "./content/claims/paper/paperclaims.component";
import {AuthGuard} from "./helpers/guards/auth.guard";
import {PageNotFoundComponent} from "./helpers/notfound/page-not-found.component";
import {InternetClaimsComponent} from "./content/claims/internet/internetclaims.component";
import {TvClaimsComponent} from "./content/claims/tv/tvclaims.component";
import {RadioClaimsComponent} from "./content/claims/radio/radioclaims.component";
import {OtherClaimsComponent} from "./content/claims/other/otherclaims.component";
import {AdminComponent} from "./admin/admin.component";

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'logout', component: LoginComponent,canActivate: [AuthGuard] },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard], data: { name: 'HOME' } },
  { path: 'claims', component: HomeComponent, canActivate: [AuthGuard], data: { name: 'HOME' } },
  {
    path: '',
    component: HomeComponent,
    children: [
      { path: 'contracts', component: ContractsComponent, canActivate: [AuthGuard] },
      { path: 'paperclaims', component: PaperClaimsComponent, canActivate: [AuthGuard] },
      { path: 'internetclaims', component: InternetClaimsComponent, canActivate: [AuthGuard] },
      { path: 'tvclaims', component: TvClaimsComponent, canActivate: [AuthGuard] },
      { path: 'radioclaims', component: RadioClaimsComponent, canActivate: [AuthGuard] },
      { path: 'otherclaims', component: OtherClaimsComponent, canActivate: [AuthGuard] },
      { path: 'payments', component: PaymentsComponent, canActivate: [AuthGuard] },
      { path: 'distributions', component: DistributionsComponent, canActivate: [AuthGuard] },
      { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
      { path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },
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
