import {
  Component,
  ElementRef,
  inject,
  input,
  linkedSignal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';
import { PageHeader } from '../../shared/components/page-header';
import { Icon, IconName } from '../../shared/ui/icon';
import { AiSettings } from './ai-settings';
import { NotificationSettings } from './notification-settings';
import { OrganizationSettings } from './organization-settings';
import { ProfileSettings } from './profile-settings';
import { SecuritySettings } from './security-settings';

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: 'users' },
  { id: 'organization', label: 'Organization', icon: 'building' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'ai', label: 'AI configuration', icon: 'sparkles' },
  { id: 'security', label: 'Security', icon: 'lock' },
] as const satisfies readonly { id: string; label: string; icon: IconName }[];

type SectionId = (typeof SECTIONS)[number]['id'];

const isSection = (value: string | undefined): value is SectionId =>
  SECTIONS.some((s) => s.id === value);

@Component({
  selector: 'app-settings',
  imports: [
    PageHeader,
    Icon,
    ProfileSettings,
    OrganizationSettings,
    NotificationSettings,
    AiSettings,
    SecuritySettings,
  ],
  template: `
    <app-page-header title="Settings" description="Manage your profile, workspace and security." />

    <div class="grid gap-4 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-6">
      <div
        role="tablist"
        aria-label="Settings sections"
        class="-mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 md:mx-0 md:flex-col md:self-start md:overflow-visible md:border-0 md:px-0"
        (keydown)="onKeydown($event)"
      >
        @for (section of sections; track section.id) {
          <button
            #tab
            type="button"
            role="tab"
            class="flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors md:min-h-10 md:rounded-control md:border-b-0"
            [class]="
              active() === section.id
                ? 'border-brand text-brand-ink md:bg-brand-soft'
                : 'border-transparent text-ink-muted hover:text-ink md:hover:bg-subtle'
            "
            [id]="'tab-' + section.id"
            [attr.aria-selected]="active() === section.id"
            [attr.aria-controls]="'panel-' + section.id"
            [tabIndex]="active() === section.id ? 0 : -1"
            (click)="select(section.id)"
          >
            <app-icon [name]="section.icon" [size]="16" />
            {{ section.label }}
          </button>
        }
      </div>

      <div class="min-w-0">
        @for (section of sections; track section.id) {
          <div
            role="tabpanel"
            [id]="'panel-' + section.id"
            [attr.aria-labelledby]="'tab-' + section.id"
            [hidden]="active() !== section.id"
          >
            @switch (section.id) {
              @case ('profile') {
                <app-profile-settings />
              }
              @case ('organization') {
                <app-organization-settings />
              }
              @case ('notifications') {
                <app-notification-settings />
              }
              @case ('ai') {
                <app-ai-settings />
              }
              @case ('security') {
                <app-security-settings />
              }
            }
          </div>
        }
      </div>
    </div>
  `,
})
export default class Settings implements HasUnsavedChanges {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Deep link to a section via `?section=`. */
  readonly section = input<string>();

  protected readonly sections = SECTIONS;
  protected readonly active = linkedSignal<SectionId>(() => {
    const section = this.section();
    return isSection(section) ? section : 'profile';
  });

  private readonly tabs = viewChildren<ElementRef<HTMLButtonElement>>('tab');

  // Panels stay mounted while hidden, so switching tabs never loses edits.
  private readonly profile = viewChild(ProfileSettings);
  private readonly organization = viewChild(OrganizationSettings);
  private readonly notifications = viewChild(NotificationSettings);
  private readonly ai = viewChild(AiSettings);

  protected select(id: SectionId): void {
    this.active.set(id);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { section: id },
      replaceUrl: true,
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    const index = SECTIONS.findIndex((s) => s.id === this.active());
    const last = SECTIONS.length - 1;
    const targets: Record<string, number> = {
      ArrowDown: index + 1,
      ArrowRight: index + 1,
      ArrowUp: index - 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: last,
    };
    const next = targets[event.key];
    if (next === undefined) return;

    event.preventDefault();
    const target = next < 0 ? last : next > last ? 0 : next;
    this.select(SECTIONS[target].id);
    this.tabs()[target]?.nativeElement.focus();
  }

  hasUnsavedChanges(): boolean {
    return [this.profile(), this.organization(), this.notifications(), this.ai()].some((section) =>
      section?.hasUnsavedChanges(),
    );
  }
}
