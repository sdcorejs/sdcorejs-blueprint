import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { ProductService } from '../../services/product.service';
import { GeneralInformationFormComponent } from '../../components/general-information-form/general-information-form.component';
import { CreateComponent } from './create.component';

it('registers Core controls and updates form validity and dirty state after native input', async () => {
  TestBed.configureTestingModule({ providers: [
    provideRouter([]), { provide: ProductService, useValue: { create: () => of({ id: 'created' }) } },
    { provide: SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER, useValue: { confirm: () => 'discard' } },
  ] });
  const fixture = TestBed.createComponent(CreateComponent);
  await fixture.whenStable();
  const fields = fixture.debugElement.query(By.directive(GeneralInformationFormComponent)).componentInstance as GeneralInformationFormComponent;
  const inputs = fixture.debugElement.queryAll(By.directive(SdInput));
  for (const [index, value] of ['NEW-001', 'New product'].entries()) {
    const component = inputs[index].componentInstance as SdInput;
    expect(fields.form().get(component.name())).toBe(component.formControl);
    const input = inputs[index].nativeElement.querySelector('input') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  }
  expect(fields.form().getRawValue()).toEqual({ code: 'NEW-001', name: 'New product', status: 'active' });
  expect(Object.fromEntries(Object.entries(fields.form().controls).map(([name, control]) => [name, control.errors]))).toEqual({ code: null, name: null, status: null });
  expect(fields.form().valid).toBe(true);
  expect(TestBed.inject(SdUnsavedChangesService).hasChanges()).toBe(true);
  expect(await TestBed.inject(SdUnsavedChangesService).confirmLeave()).toBe(true);
});
