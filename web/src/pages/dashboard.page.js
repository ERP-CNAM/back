// src/pages/dashboard.page.js
import { UsersComponent, registerUsersAlpine } from '../components/users.component.js';
import { SubscriptionsComponent, registerSubscriptionsAlpine } from '../components/subscriptions.component.js';

export function DashboardPage(route) {
    // route = "/users" ou "/subscriptions"
    const content = route === '/subscriptions' ? SubscriptionsComponent() : UsersComponent();
    return content;
}

export function registerDashboardAlpine(Alpine) {
    registerUsersAlpine(Alpine);
    registerSubscriptionsAlpine(Alpine);
}
