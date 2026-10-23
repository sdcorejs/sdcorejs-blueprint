import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RedirectCommand, Router, type NavigationError } from '@angular/router';

/** Error destinations belong to the host; reusable module resolvers only propagate failures. */
export function redirectNavigationError(event: NavigationError): RedirectCommand {
  const status = event.error instanceof HttpErrorResponse ? event.error.status : 0;
  const kind = status === 404 ? 'not-found' : status === 401 ? 'unauthorized' : status === 403 ? 'forbidden' : 'unavailable';
  return new RedirectCommand(inject(Router).parseUrl('/error/' + kind));
}
