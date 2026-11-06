import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import type { ProductDto } from '../../services/product.model';

@Component({
  selector: 'detail',
  templateUrl: './detail.component.html',
})
export class DetailComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #data = toSignal(this.#route.data, { requireSync: true });
  readonly product = computed(() => this.#data()['entity'] as ProductDto);
}
