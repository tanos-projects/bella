import { Component } from '@angular/core';
import { AuthUserService } from '../../../../auth/auth-user.service';

@Component({
  selector: 'bella-view-profile',
  templateUrl: 'view-profile.component.html'
})
export class ViewProfileComponent {
  //implements OnInit {

  currentUser$ = this.userService.getProfile();
  constructor(private userService: AuthUserService) {}
  // ngOnInit(): void {
  //   // sdfsdf
  // }
}
