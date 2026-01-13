import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
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

        const [inserted] = await this.db
            .insert(invoices)
            .values(values)
            .returning();

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
}
