import { Component, inject } from '@angular/core';
import { AuthUserService } from '../../../../auth/auth-user.service';

@Component({
  selector: 'bella-view-profile',
  templateUrl: 'view-profile.component.html'
})
export class ViewProfileComponent {
  //implements OnInit {
  private userService = inject(AuthUserService);

  currentUser$ = this.userService.getProfile();
  // ngOnInit(): void {
  //   // sdfsdf
  // }
}
