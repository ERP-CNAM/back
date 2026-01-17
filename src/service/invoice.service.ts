import type { InvoiceRepository } from '../repository/invoice.repository';
import type { SubscriptionRepository } from '../repository/subscription.repository';
import type { UserRepository } from '../repository/user.repository';
import type { t_InvoiceDetailed } from '../../api/models';

export class InvoiceService {
    constructor(
        private readonly invoiceRepository: InvoiceRepository,
        private readonly subscriptionRepository: SubscriptionRepository,
        private readonly userRepository: UserRepository,
    ) { }

    async listInvoices(filters: { userId?: string; subscriptionId?: string; status?: 'PENDING' | 'SENT' | 'PAID' | 'FAILED' }): Promise<t_InvoiceDetailed[]> {
        // 1. Fetch filtered invoices
        const invoices = await this.invoiceRepository.findAll(filters);

        if (invoices.length === 0) {
            return [];
        }

        // 2. Extract unique IDs to fetch related data efficiently
        const userIds = new Set<string>();
        const subscriptionIds = new Set<string>();

        for (const invoice of invoices) {
            if (invoice.userId) userIds.add(invoice.userId);
            if (invoice.subscriptionId) subscriptionIds.add(invoice.subscriptionId);
        }

        // 3. Fetch related data in parallel (N+1 optimisation vs loading full DB)
        const [users, subscriptions] = await Promise.all([
            Promise.all(Array.from(userIds).map(id => this.userRepository.findById(id))),
            Promise.all(Array.from(subscriptionIds).map(id => this.subscriptionRepository.findById(id))),
        ]);

        const usersById = new Map(users.filter(u => u !== null).map(u => [u!.id!, u!]));
        const subscriptionsById = new Map(subscriptions.filter(s => s !== null).map(s => [s!.id!, s!]));

        // 4. Hydrate result
        return invoices.map(invoice => {
            const sub = invoice.subscriptionId ? subscriptionsById.get(invoice.subscriptionId) : undefined;
            const user = invoice.userId ? usersById.get(invoice.userId) : undefined;

            return {
                ...invoice,
                subscription: sub ? { ...sub, user: user ?? undefined } : undefined,
            };
        });
    }
}
