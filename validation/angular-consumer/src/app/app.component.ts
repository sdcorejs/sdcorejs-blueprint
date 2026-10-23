import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationStart, NavigationEnd, NavigationCancel, NavigationError, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, SdButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Consumer mounts" class="d-flex gap-8 p-8 flex-wrap">
      <sd-button title="Home" routerLink="/" />
      <sd-button title="Alpha" routerLink="/alpha/product" />
      <sd-button title="Beta" routerLink="/beta/product" />
    </nav>
    @if (navigating()) { <div role="status">Đang tải trang</div> }
    <router-outlet />
  `,
})
export class AppComponent {
  protected readonly navigating = toSignal(inject(Router).events.pipe(
    filter(event => event instanceof NavigationStart || event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError),
    map(event => event instanceof NavigationStart),
  ), { initialValue: false });
}

@Component({ selector: 'consumer-home', changeDetection: ChangeDetectionStrategy.OnPush, template: '<p class="p-16">Blueprint Angular consumer</p>' })
export class HomeComponent {}
