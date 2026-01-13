import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import type { InvoiceRepository, CreateInvoiceDTO } from '../invoice.repository';
import type { t_Invoice } from '../../../api/models';
import { invoices } from '../../database/memory/schema';
import { generateUUID } from '../../utils/uuid';

export class InMemoryInvoiceRepository implements InvoiceRepository {
    constructor(private db: BetterSQLite3Database) {}

    private toInvoice(row: any): t_Invoice {
        return {
            id: row.id,
            invoiceRef: row.invoiceRef,
            subscriptionId: row.subscriptionId,
            userId: row.userId,
            billingDate: row.billingDate,
            periodStart: row.periodStart,
            periodEnd: row.periodEnd,
            amountExclVat: row.amountExclVat,
            vatAmount: row.vatAmount,
            amountInclVat: row.amountInclVat,
            status: row.status as any,
        };
    }

    async create(data: CreateInvoiceDTO): Promise<t_Invoice> {
        const invoice: t_Invoice = {
            id: generateUUID(),
            ...data,
        };

        this.db
            .insert(invoices)
            .values({
                id: invoice.id!,
                invoiceRef: invoice.invoiceRef!,
                subscriptionId: invoice.subscriptionId!,
                userId: invoice.userId!,
                billingDate: invoice.billingDate!,
                periodStart: invoice.periodStart!,
                periodEnd: invoice.periodEnd!,
                amountExclVat: invoice.amountExclVat!,
                vatAmount: invoice.vatAmount!,
                amountInclVat: invoice.amountInclVat!,
                status: invoice.status!,
            })
            .run();

        return invoice;
    }

    async findAllByDate(date: string): Promise<t_Invoice[]> {
        // Simple string matching for now, assuming date format YYYY-MM-DD matches
        // Ideally we might want range queries or exact day matching
        // The requirement says "Generate Monthly Billing", usually for a whole month.
        // But for now let's just implement basic retrieval.
        // Actually, "findAllByDate" is vague. Let's say we filter by billingDate.
        // If date is "2023-10", we might want all invoices in that month.
        // For this MVP step, let's assume exact match or partial match on billingDate string.
        
        // However, standard SQL matching on dates stored as strings (sqlite) or timestamps (pg) differs.
        // Let's stick to exact match on the billingDate field for now as it's the simplest valid implementation.
        
        // Wait, the use case is usually "Show me invoices generated today" or "for this run".
        
        const rows = this.db.select().from(invoices).where(eq(invoices.billingDate, date)).all();
        return rows.map(this.toInvoice);
    }
}
