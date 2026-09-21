import { Component, OnInit } from '@angular/core';

export enum routes {
  DASHBOARD = '/dashboard',
  LOGIN = '/login',
}

@Component({
  selector: 'bella-sidenav',
  templateUrl: './sidenav.component.html',
  standalone: false,
})
export class SidenavComponent {
  // constructor() {}
  readonly routes = routes;
}
