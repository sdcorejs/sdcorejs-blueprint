import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { provideRouter, Router, withComponentInputBinding, withNavigationErrorHandler, withRouterConfig } from '@angular/router';
import { SD_PERMISSION_CONFIGURATION, type ISdPermissionConfiguration } from '@sdcorejs/angular/modules/permission';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { redirectNavigationError } from './app/navigation-error';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(appRoutes, withComponentInputBinding(), withNavigationErrorHandler(redirectNavigationError),
      // Restore the history index when the dirty guard cancels browser Back/Forward.
      withRouterConfig({ canceledNavigationResolution: 'computed' })),
    {
      provide: SD_PERMISSION_CONFIGURATION,
      useFactory: (): ISdPermissionConfiguration => {
        const http = inject(HttpClient);
        const router = inject(Router);
        return {
          loadPermissions: () => http.get<string[]>('/api/permissions'),
          onForbiden: () => { void router.navigateByUrl('/error/forbidden'); },
        };
      },
    },
  ],
}).catch((error: unknown) => console.error(error));
