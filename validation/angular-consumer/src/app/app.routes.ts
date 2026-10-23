import type { Routes } from '@angular/router';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { HomeComponent } from './app.component';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', component: HomeComponent },
  ...['alpha', 'beta'].map(mount => ({
    path: mount,
    canActivate: [SdPermissionGuard],
    loadChildren: async () => {
      const module = await import('../modules/mdm');
      return [{
        path: '',
        providers: [module.provideMdmConfiguration({ apiHost: '/api/' + mount, assetBaseUrl: '/assets/' + mount })],
        children: module.mdmRoutes,
      }];
    },
  })),
  { path: 'error/:kind', loadComponent: () => import('./error.component').then(module => module.ErrorComponent) },
  { path: '**', redirectTo: 'error/not-found' },
];
