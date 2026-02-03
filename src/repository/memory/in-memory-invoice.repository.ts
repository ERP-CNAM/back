import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import type { InvoiceRepository, CreateInvoiceDTO } from '../invoice.repository';
import type { t_Invoice } from '../../../api/models';
import { invoices } from '../../database/memory/schema';
import { generateUUID } from '../../utils/uuid';

export class InMemoryInvoiceRepository implements InvoiceRepository {
    constructor(private db: BetterSQLite3Database) { }

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

    async findAll(filter: {
        userId?: string;
        subscriptionId?: string;
        status?: 'PENDING' | 'SENT' | 'PAID' | 'FAILED';
    }): Promise<t_Invoice[]> {
        let query = this.db.select().from(invoices);
        if (filter.userId) {
            query = query.where(eq(invoices.userId, filter.userId)) as any;
        }
        if (filter.subscriptionId) {
            query = query.where(eq(invoices.subscriptionId, filter.subscriptionId)) as any;
        }
        if (filter.status) {
            query = query.where(eq(invoices.status, filter.status)) as any;
        }
        const rows = query.all();
        return rows.map((row) => this.toInvoice(row));
    }

    async findAllByDate(date: string): Promise<t_Invoice[]> {
        const rows = this.db.select().from(invoices).where(eq(invoices.billingDate, date)).all();
        return rows.map(this.toInvoice);
    }

    async findAllByMonth(month: string): Promise<t_Invoice[]> {
        // month is expected to be 'YYYY-MM'
        const allInvoices = this.db.select().from(invoices).all();
        const filtered = allInvoices.filter((inv) => inv.billingDate?.startsWith(month));
        return filtered.map(this.toInvoice);
    }

    async findAllByDateRange(startDate: string, endDate: string): Promise<t_Invoice[]> {
        const allInvoices = this.db.select().from(invoices).all();
        const filtered = allInvoices.filter((inv) => inv.billingDate >= startDate && inv.billingDate <= endDate);
        return filtered.map(this.toInvoice);
    }

    async countBySubscriptionId(subscriptionId: string): Promise<number> {
        const rows = this.db.select().from(invoices).where(eq(invoices.subscriptionId, subscriptionId)).all();
        return rows.length;
    }

    async findByReference(invoiceRef: string): Promise<t_Invoice | null> {
        const row = this.db.select().from(invoices).where(eq(invoices.invoiceRef, invoiceRef)).get();
        return row ? this.toInvoice(row) : null;
    }

    async updateStatus(id: string, status: 'PAID' | 'FAILED'): Promise<t_Invoice | null> {
        const existing = this.db.select().from(invoices).where(eq(invoices.id, id)).get();
        if (!existing) return null;

        this.db.update(invoices).set({ status }).where(eq(invoices.id, id)).run();

        return this.toInvoice({ ...existing, status });
    }
}
