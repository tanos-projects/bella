import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompleteProfileGuard } from '../../auth/complete-profile.guard';
import { AccountComponent } from './account.component';
import { CreateProfileComponent as CreateProfileComponent } from './profile/create/create-profile-component';

const routes: Routes = [
  {
    path: '',
    component: AccountComponent,
    canActivate: [CompleteProfileGuard]
  },
  {
    path: 'create-profile',
    component: CreateProfileComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountRoutingModule {}
