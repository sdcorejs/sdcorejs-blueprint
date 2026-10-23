import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdButton } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'consumer-error', imports: [SdPageComponent, SdButton, RouterLink], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<sd-page title="Không thể mở trang"><div class="p-16"><p role="alert">{{ kind() }}</p><sd-button title="Về trang đầu" routerLink="/" /></div></sd-page>`,
})
export class ErrorComponent { readonly kind = input.required<string>(); }
