import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../models/api';
import { AuthService } from '../services/auth.service';

const FALLBACK_MESSAGES: Record<number, string> = {
  0: 'Unable to reach the server. Check your connection and try again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  500: 'Something went wrong on our side. Please try again.',
};

/** Normalizes every HTTP failure into an `ApiError` and ends the session on 401. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((response: HttpErrorResponse) => {
      const isLogin = req.url.endsWith('/auth/login');
      if (response.status === 401 && !isLogin) {
        auth.logout();
      }

      const error: ApiError = {
        status: response.status,
        message:
          response.error?.message ?? FALLBACK_MESSAGES[response.status] ?? FALLBACK_MESSAGES[500],
      };
      return throwError(() => error);
    }),
  );
};
