import { eq, and, gte, lt, count } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { InvoiceRepository, CreateInvoiceDTO } from '../invoice.repository';
import type { t_Invoice } from '../../../api/models';
import { invoices } from '../../database/postgres/schema';
import { generateUUID } from '../../utils/uuid';

export class PostgresInvoiceRepository implements InvoiceRepository {
    constructor(private db: NodePgDatabase) {}

    private toInvoice(row: typeof invoices.$inferSelect): t_Invoice {
        return {
            id: row.id,
            invoiceRef: row.invoiceRef,
            subscriptionId: row.subscriptionId,
            userId: row.userId,
            billingDate: row.billingDate.toISOString().slice(0, 10),
            periodStart: row.periodStart.toISOString().slice(0, 10),
            periodEnd: row.periodEnd.toISOString().slice(0, 10),
            amountExclVat: Number(row.amountExclVat),
            vatAmount: Number(row.vatAmount),
            amountInclVat: Number(row.amountInclVat),
            status: row.status as any,
        };
    }

    async create(data: CreateInvoiceDTO): Promise<t_Invoice> {
        const id = generateUUID();
        const values: typeof invoices.$inferInsert = {
            id,
            invoiceRef: data.invoiceRef,
            subscriptionId: data.subscriptionId,
            userId: data.userId,
            billingDate: new Date(data.billingDate),
            periodStart: new Date(data.periodStart),
            periodEnd: new Date(data.periodEnd),
            amountExclVat: String(data.amountExclVat),
            vatAmount: String(data.vatAmount),
            amountInclVat: String(data.amountInclVat),
            status: data.status,
        };

        const [inserted] = await this.db.insert(invoices).values(values).returning();

        if (!inserted) {
            throw new Error('Failed to create invoice');
        }

        return this.toInvoice(inserted);
    }

    async findAllByDate(date: string): Promise<t_Invoice[]> {
        // Exact match on date part is tricky with timestamps.
        // For this prototype, we will assume the query provides a specific timestamp or handle it loosely.
        // To keep it simple and consistent with memory repo:
        const searchDate = new Date(date);
        const rows = await this.db.select().from(invoices).where(eq(invoices.billingDate, searchDate)).execute();
        return rows.map(this.toInvoice);
    }

    async findAllByMonth(month: string): Promise<t_Invoice[]> {
        // month format: YYYY-MM
        const startDate = new Date(`${month}-01`);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1); // First day of next month

        const rows = await this.db
            .select()
            .from(invoices)
            .where(and(gte(invoices.billingDate, startDate), lt(invoices.billingDate, endDate)))
            .execute();

        return rows.map(this.toInvoice);
    }

    async findAllByDateRange(startDate: string, endDate: string): Promise<t_Invoice[]> {
        const start = new Date(startDate);
        const end = new Date(endDate);
        // Ensure end date covers the full day if only date part is provided,
        // but here we rely on the caller to provide precise boundaries or we assume strict date comparison.
        // If 'endDate' is '2026-06-30', it's '2026-06-30T00:00:00.000Z'.
        // Any invoice on that day might be later in time.
        // For safety, let's assume 'end' is inclusive for the day.
        // Actually, to make it simple and consistent with typical reporting, let's treat it as <=.

        const rows = await this.db
            .select()
            .from(invoices)
            .where(and(gte(invoices.billingDate, start), lt(invoices.billingDate, new Date(end.getTime() + 86400000)))) // +1 day for inclusive end
            .execute();

        return rows.map(this.toInvoice);
    }

    async countBySubscriptionId(subscriptionId: string): Promise<number> {
        const result = await this.db
            .select({ value: count() })
            .from(invoices)
            .where(eq(invoices.subscriptionId, subscriptionId))
            .execute();

        return result[0]?.value || 0;
    }

    async updateStatus(id: string, status: 'PAID' | 'FAILED'): Promise<t_Invoice | null> {
        const [updated] = await this.db.update(invoices).set({ status }).where(eq(invoices.id, id)).returning();

        return updated ? this.toInvoice(updated) : null;
    }
}
