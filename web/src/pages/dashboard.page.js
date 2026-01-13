// src/pages/dashboard.page.js
import { UsersComponent, registerUsersAlpine } from '../components/users.component.js';
import { SubscriptionsComponent, registerSubscriptionsAlpine } from '../components/subscriptions.component.js';
import { InvoicesComponent, registerInvoicesAlpine } from '../components/invoices.component.js';

export function DashboardPage(route) {
    const content =
        route === '/subscriptions'
            ? SubscriptionsComponent()
            : route === '/invoices'
              ? InvoicesComponent()
              : UsersComponent();

    return content;
}
export function registerDashboardAlpine(Alpine) {
    registerUsersAlpine(Alpine);
    registerSubscriptionsAlpine(Alpine);
    registerInvoicesAlpine(Alpine);
}
