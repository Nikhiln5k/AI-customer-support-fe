import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmService } from '../services/confirm.service';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component.hasUnsavedChanges()) return true;

  return inject(ConfirmService).ask({
    title: 'Discard changes?',
    message: 'You have unsaved changes. If you leave this page they will be lost.',
    confirmLabel: 'Discard',
    destructive: true,
  });
};
