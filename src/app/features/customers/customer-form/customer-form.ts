import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormField, FormRoot, email, form, maxLength, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CustomersApi } from '../../../core/api/customers.api';
import { HasUnsavedChanges } from '../../../core/guards/unsaved-changes.guard';
import { ApiError } from '../../../core/models/api';
import { CustomerInput } from '../../../core/models/customer';
import { ToastService } from '../../../core/services/toast.service';
import { ErrorState } from '../../../shared/components/error-state';
import { FieldError } from '../../../shared/components/field-error';
import { Breadcrumb, PageHeader } from '../../../shared/components/page-header';

const EMPTY: CustomerInput = { name: '', email: '', phone: '', company: '', notes: '' };

@Component({
  selector: 'app-customer-form',
  imports: [FormField, FormRoot, RouterLink, PageHeader, ErrorState, FieldError],
  templateUrl: './customer-form.html',
})
export default class CustomerForm implements HasUnsavedChanges {
  private readonly customersApi = inject(CustomersApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Route param; present in edit mode. */
  readonly id = input<string>();

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly saveError = signal<ApiError | null>(null);
  private saved = false;

  protected readonly customer = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.customersApi.get(params),
  });

  protected readonly breadcrumbs = computed<Breadcrumb[]>(() =>
    this.isEdit()
      ? [
          { label: 'Customers', link: '/customers' },
          { label: this.customer.value()?.name ?? '…', link: `/customers/${this.id()}` },
          { label: 'Edit' },
        ]
      : [{ label: 'Customers', link: '/customers' }, { label: 'New customer' }],
  );

  private readonly model = signal<CustomerInput>({ ...EMPTY });

  protected readonly customerForm = form(
    this.model,
    (path) => {
      required(path.name, { message: 'Enter the customer’s name' });
      maxLength(path.name, 120, { message: 'Keep the name under 120 characters' });
      required(path.email, { message: 'Enter an email address' });
      email(path.email, { message: 'Enter a valid email address' });
      maxLength(path.notes, 2000, { message: 'Keep notes under 2,000 characters' });
    },
    { submission: { action: async () => this.save() } },
  );

  constructor() {
    effect(() => {
      const customer = this.customer.value();
      if (!customer) return;
      const { name, email, phone, company, notes } = customer;
      this.customerForm().reset({ name, email, phone, company, notes });
    });
  }

  hasUnsavedChanges(): boolean {
    return !this.saved && this.customerForm().dirty();
  }

  private async save(): Promise<undefined> {
    const value = this.model();
    const input: CustomerInput = {
      name: value.name.trim(),
      email: value.email.trim(),
      phone: value.phone.trim(),
      company: value.company.trim(),
      notes: value.notes.trim(),
    };

    this.saveError.set(null);
    try {
      const id = this.id();
      const customer = await firstValueFrom(
        id ? this.customersApi.update(id, input) : this.customersApi.create(input),
      );
      this.saved = true;
      this.toast.success(id ? 'Customer updated' : `${customer.name} added`);
      await this.router.navigate(['/customers', customer.id]);
    } catch (error) {
      this.saveError.set(error as ApiError);
    }
    return undefined;
  }
}
