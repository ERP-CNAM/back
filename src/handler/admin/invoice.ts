import type { ListInvoices } from '../../../api/generated';
import type { InvoiceRepository } from '../../repository/invoice.repository';
import type { SubscriptionRepository } from '../../repository/subscription.repository';
import type { UserRepository } from '../../repository/user.repository';

/**
 * Creates the invoice handlers
 * 
 * @param invoiceRepo The invoice repository
 * @param subscriptionRepo The subscription repository
 * @param userRepo The user repository
 * 
 * @returns The invoice handlers
 */
export function createInvoiceHandlers(
    invoiceRepo: InvoiceRepository,
    subscriptionRepo: SubscriptionRepository,
    userRepo: UserRepository,
) {
    /**
     * Lists the invoices
     * 
     * @route GET /invoices?userId=&subscriptionId=&status=
     * 
     * @param params The request parameters
     * @param respond The response handler
     * 
     * @returns The response object
     */
    const listInvoices: ListInvoices = async (params, respond) => {
        const { userId, subscriptionId, status } = params.query || {};

        // 1) récupère les invoices (filtrées côté repo)
        const invoices = await invoiceRepo.findAll({ userId, subscriptionId, status });

        // 2) hydrate InvoiceDetailed: invoice + subscription + subscription.user
        // (on charge "en masse" puis map)
        const subs = await subscriptionRepo.findAll({});
        const users = await userRepo.findAll({});

        const subscriptionsById = new Map(subs.map((s: any) => [s.id, s]));
        const usersById = new Map(users.map((u: any) => [u.id, u]));

        const detailed = invoices.map((inv: any) => {
            const sub = subscriptionsById.get(inv.subscriptionId);
            const user = usersById.get(inv.userId);

            return {
                ...inv,
                subscription: sub ? { ...sub, user: user ?? null } : null,
            };
        });

        return respond.with200().body({
            success: true,
            message: 'Invoices retrieved successfully',
            payload: detailed,
        });
    };

    return { listInvoices };
}
