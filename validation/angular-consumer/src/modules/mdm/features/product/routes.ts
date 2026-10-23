import type { Routes } from '@angular/router';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { sdUnsavedChangesGuard } from '@sdcorejs/angular/services/unsaved-changes';
import { ProductService } from './services/product.service';
import { entityResolver } from './entity.resolver';

export const routes: Routes = [{
  path: '', providers: [ProductService], canActivateChild: [SdPermissionGuard], children: [
    { path: '', pathMatch: 'full', data: { permission: 'MDM_PRODUCT_C_LIST' }, loadComponent: () => import('./pages/list/list.component').then(module => module.ListComponent) },
    { path: 'create', data: { permission: 'MDM_PRODUCT_C_CREATE' }, canDeactivate: [sdUnsavedChangesGuard], loadComponent: () => import('./pages/create/create.component').then(module => module.CreateComponent) },
    { path: ':id/detail', data: { permission: 'MDM_PRODUCT_C_DETAIL' }, resolve: { entity: entityResolver }, runGuardsAndResolvers: 'paramsChange', loadComponent: () => import('./pages/detail/detail.component').then(module => module.DetailComponent) },
    { path: ':id/update', data: { permission: 'MDM_PRODUCT_C_UPDATE' }, resolve: { entity: entityResolver }, runGuardsAndResolvers: 'paramsChange', canDeactivate: [sdUnsavedChangesGuard], loadComponent: () => import('./pages/update/update.component').then(module => module.UpdateComponent) },
  ],
}];
