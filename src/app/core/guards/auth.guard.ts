import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { Role } from '../models/user';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_, state) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) return true;

  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const guestGuard: CanActivateFn = () => {
  return inject(AuthService).isAuthenticated()
    ? inject(Router).createUrlTree(['/dashboard'])
    : true;
};

/** UX-only gate; the backend still enforces permissions. */
export const roleGuard =
  (...roles: Role[]): CanMatchFn =>
  () => {
    if (inject(AuthService).hasRole(...roles)) return true;
    return inject(Router).createUrlTree(['/forbidden']);
  };
