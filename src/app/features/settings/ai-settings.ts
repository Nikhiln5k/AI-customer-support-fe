import { Component, effect, inject, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormField, FormRoot, disabled, form, max, min, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { SettingsApi } from '../../core/api/settings.api';
import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';
import { toApiError } from '../../core/models/api';
import { AiSettings as AiConfig } from '../../core/models/settings';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ErrorState } from '../../shared/components/error-state';
import { FieldError } from '../../shared/components/field-error';
import { Icon } from '../../shared/ui/icon';
import { SettingSwitch } from './setting-switch';
import { SettingsPanel, SettingsSkeleton } from './settings-panel';

@Component({
  selector: 'app-ai-settings',
  imports: [
    FormField,
    FormRoot,
    FieldError,
    ErrorState,
    Icon,
    SettingSwitch,
    SettingsPanel,
    SettingsSkeleton,
  ],
  template: `
    <app-settings-panel
      title="AI configuration"
      description="Control how the AI assistant helps your agents."
    >
      @if (settings.isLoading() && !settings.hasValue()) {
        <app-settings-skeleton />
      } @else if (settings.error()) {
        <app-error-state [error]="settings.error()" (retry)="settings.reload()" />
      } @else {
        @if (!canEdit) {
          <p
            class="mx-4 mt-4 flex items-center gap-2 rounded-control bg-subtle p-3 text-ink-muted md:mx-6"
          >
            <app-icon name="lock" [size]="16" />
            Only admins can change AI configuration.
          </p>
        }

        <form [formRoot]="aiForm" novalidate>
          <div class="divide-y divide-line px-4 pt-2 md:px-6">
            <app-setting-switch
              id="ai-suggest"
              label="Suggest replies"
              hint="Draft reply suggestions agents can edit before sending."
              [field]="aiForm.suggestReplies"
            />
            <app-setting-switch
              id="ai-classify"
              label="Auto-classify tickets"
              hint="Set category and priority on new tickets."
              [field]="aiForm.autoClassify"
            />
            <app-setting-switch
              id="ai-sentiment"
              label="Detect sentiment"
              hint="Flag frustrated customers so agents can prioritise them."
              [field]="aiForm.autoSentiment"
            />
          </div>

          <div class="border-t border-line p-4 md:p-6">
            <label for="ai-confidence" class="field-label">
              Minimum confidence <span class="text-danger" aria-hidden="true">*</span>
            </label>
            <div class="flex items-center gap-2">
              <input
                id="ai-confidence"
                type="number"
                class="input w-28"
                step="1"
                inputmode="numeric"
                [formField]="aiForm.minConfidence"
                [attr.aria-invalid]="
                  aiForm.minConfidence().touched() && aiForm.minConfidence().invalid()
                "
                aria-describedby="ai-confidence-hint ai-confidence-error"
              />
              <span class="text-ink-muted" aria-hidden="true">%</span>
            </div>
            <p id="ai-confidence-hint" class="field-hint">
              Suggestions below this confidence (0–100) are hidden from agents.
            </p>
            <app-field-error id="ai-confidence-error" [field]="aiForm.minConfidence" />
          </div>

          @if (canEdit) {
            <div class="flex justify-end gap-2 border-t border-line px-4 py-3 md:px-6">
              <button
                type="button"
                class="btn-ghost"
                [disabled]="!aiForm().dirty() || aiForm().submitting()"
                (click)="discard()"
              >
                Discard
              </button>
              <button type="submit" class="btn-primary" [disabled]="aiForm().submitting()">
                {{ aiForm().submitting() ? 'Saving…' : 'Save AI settings' }}
              </button>
            </div>
          }
        </form>
      }
    </app-settings-panel>
  `,
})
export class AiSettings implements HasUnsavedChanges {
  private readonly api = inject(SettingsApi);
  private readonly toast = inject(ToastService);
  protected readonly canEdit = inject(AuthService).hasRole('admin');

  protected readonly settings = rxResource({ stream: () => this.api.ai() });

  protected readonly aiForm = form(
    signal<AiConfig>({
      suggestReplies: false,
      autoClassify: false,
      autoSentiment: false,
      minConfidence: 70,
    }),
    (path) => {
      disabled(path, { when: () => !this.canEdit });
      required(path.minConfidence, { message: 'Enter a minimum confidence' });
      min(path.minConfidence, 0, { message: 'Use a value between 0 and 100' });
      max(path.minConfidence, 100, { message: 'Use a value between 0 and 100' });
    },
    {
      submission: {
        action: async (field) => {
          try {
            this.settings.set(await firstValueFrom(this.api.saveAi(field().value())));
            this.toast.success('AI settings saved');
          } catch (error) {
            this.toast.error(toApiError(error).message);
          }
          return undefined;
        },
      },
    },
  );

  constructor() {
    effect(() => {
      const value = this.settings.value();
      if (value) untracked(() => this.aiForm().reset(value));
    });
  }

  protected discard(): void {
    const value = this.settings.value();
    if (value) this.aiForm().reset(value);
  }

  hasUnsavedChanges(): boolean {
    return this.aiForm().dirty();
  }
}
