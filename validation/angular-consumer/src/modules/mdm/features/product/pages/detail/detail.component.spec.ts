import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SD_PERMISSION_CONFIGURATION } from '@sdcorejs/angular/modules/permission';
import { DetailComponent } from './detail.component';

it('renders preloaded identity and Core fields with OnPush input updates', async () => {
  TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: SD_PERMISSION_CONFIGURATION, useValue: { loadPermissions: () => [] } }] });
  const fixture = TestBed.createComponent(DetailComponent);
  fixture.componentRef.setInput('entity', { id: 'one', code: 'P1', name: 'First', status: 'active' });
  await fixture.whenStable();
  expect(fixture.nativeElement.textContent).toContain('Chi tiết sản phẩm #P1');
  fixture.componentRef.setInput('entity', { id: 'two', code: 'P2', name: 'Second', status: 'inactive' });
  await fixture.whenStable();
  expect(fixture.nativeElement.textContent).toContain('Second');
  expect(fixture.nativeElement.textContent).not.toContain('First');
});
