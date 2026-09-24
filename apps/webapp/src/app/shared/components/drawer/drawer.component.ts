import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { DrawerService } from './drawer.service';

@Component({
  selector: 'bella-drawer',
  templateUrl: './drawer.component.html',
  styleUrls: ['./drawer.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class DrawerComponent implements OnDestroy {
  private drawerService = inject(DrawerService);

  opened = false;
  subscription: Subscription;

  constructor() {
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
