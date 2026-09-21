import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DrawerService } from './drawer.service';

@Component({
  selector: 'bella-drawer',
  templateUrl: './drawer.component.html',
  styleUrls: ['./drawer.component.scss'],
  standalone: false,
})
export class DrawerComponent implements OnDestroy {
  opened = false;
  subscription: Subscription;

  constructor(private drawerService: DrawerService) {
    this.subscription = this.drawerService.opened$.subscribe({
      next: (opened) => {
        this.opened = opened;
      },
    });
  }

  close(): void {
    this.drawerService.close();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
