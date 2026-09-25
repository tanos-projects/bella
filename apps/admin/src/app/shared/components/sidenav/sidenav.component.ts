import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';

export enum routes {
  DASHBOARD = '/dashboard',
  LOGIN = '/login',
}

@Component({
  selector: 'bella-sidenav',
  templateUrl: './sidenav.component.html',
  standalone: true,
  imports: [RouterModule, MatListModule, MatIconModule],
})
export class SidenavComponent {
  // constructor() {}
  readonly routes = routes;
}
