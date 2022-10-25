import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProfileService } from './profile.service';

@Component({
  selector: 'bella-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
  private readonly id: string = this.routeParams.snapshot.params['id'];
  readonly data$ = this.profileService.getProfile(this.id);
  constructor(private routeParams: ActivatedRoute, private profileService: ProfileService) {}
}
