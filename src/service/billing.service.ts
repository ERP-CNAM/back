import type { InvoiceRepository } from '../repository/invoice.repository';
import type { SubscriptionRepository } from '../repository/subscription.repository';
import type { UserRepository } from '../repository/user.repository';
import type { t_Invoice } from '../../api/models';
import { VAT_RATE, PROMO_CODES, PROMO_RULES } from '../config/constants';

export class BillingService {
    constructor(
        private readonly invoiceRepository: InvoiceRepository,
        private readonly subscriptionRepository: SubscriptionRepository,
        private readonly userRepository: UserRepository,
    ) { }

    /**
     * Generates monthly billing invoices for active subscriptions.
     * @param billingDate The date of billing (YYYY-MM-DD). Defaults to today.
     */
    async generateMonthlyBilling(billingDate: string = new Date().toISOString().slice(0, 10)): Promise<{ billingDate: string; invoices: t_Invoice[] }> {
        const dateObj = new Date(billingDate);

        // 1. Fetch active subscriptions
        const activeSubscriptions = await this.subscriptionRepository.findAll({ status: 'ACTIVE' });

        // 2. Generate invoices in parallel
        const invoicePromises = activeSubscriptions.map(async (sub) => {
            let amountExclVat = sub.monthlyAmount || 0;

            // Apply 50% discount on first payment if promo code is 'B1M20'
            if (sub.promoCode === PROMO_CODES.WELCOME_OFFER) {
                const previousInvoicesCount = await this.invoiceRepository.countBySubscriptionId(sub.id!);
                if (previousInvoicesCount === 0) {
                    amountExclVat = amountExclVat * PROMO_RULES.WELCOME_OFFER_DISCOUNT;
                }
            }

            const vatRate = VAT_RATE;
            const vatAmount = Number((amountExclVat * vatRate).toFixed(2));
            const amountInclVat = Number((amountExclVat + vatAmount).toFixed(2));

            // Define period (full month)
            const periodStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).toISOString().slice(0, 10);
            const periodEnd = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).toISOString().slice(0, 10);

            return this.invoiceRepository.create({
                invoiceRef: `INV-${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${sub.contractCode}`,
                subscriptionId: sub.id!,
                userId: sub.userId!,
                billingDate: billingDate,
                periodStart,
                periodEnd,
                amountExclVat,
                vatAmount,
                amountInclVat,
                status: 'PENDING',
            });
        });

        const invoices = await Promise.all(invoicePromises);

        return {
            billingDate,
            invoices,
        };
    }

    /**
     * Updates payment statuses for invoices.
     * @param updates List of updates containing invoiceId and new status.
     */
    async updatePaymentStatuses(updates: { invoiceId: string; status: 'EXECUTED' | 'REJECTED' | 'PENDING' }[]) {
        let updatedCount = 0;

        // Process updates in parallel
        await Promise.all(updates.map(async (update) => {
            const newStatus = update.status === 'EXECUTED' ? 'PAID' : 'FAILED';

            // 1. Update Invoice
            const invoice = await this.invoiceRepository.updateStatus(update.invoiceId, newStatus);

            // 2. If Failed, Block User
            if (newStatus === 'FAILED' && invoice && invoice.userId) {
                await this.userRepository.updateStatus(invoice.userId, 'SUSPENDED');
            }
            updatedCount++;
        }));

        return updatedCount;
    }
}
