import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import type { AdminRepository, AdminWithPassword } from '../admin.repository';
import type { t_Admin } from '../../../api/models';
import { admins } from '../../database/postgres/schema';
import { generateUUID } from '../../utils/uuid';
import { security } from '../../utils/security';

export class PostgresAdminRepository implements AdminRepository {
    constructor(private db: NodePgDatabase) {}

    private toAdmin(row: typeof admins.$inferSelect): t_Admin {
        return {
            id: row.id,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            isActive: row.isActive,
            lastLogin: row.lastLogin ? row.lastLogin.toISOString() : undefined,
            createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
            updatedAt: row.updatedAt ? row.updatedAt.toISOString() : undefined,
        };
    }

    async findAll(): Promise<t_Admin[]> {
        const rows = await this.db.select().from(admins).execute();
        return rows.map((row) => this.toAdmin(row));
    }

    async findById(id: string): Promise<t_Admin | null> {
        const rows = await this.db.select().from(admins).where(eq(admins.id, id)).limit(1).execute();
        return rows[0] ? this.toAdmin(rows[0]) : null;
    }

    async findByEmail(email: string): Promise<t_Admin | null> {
        const rows = await this.db.select().from(admins).where(eq(admins.email, email)).limit(1).execute();
        return rows[0] ? this.toAdmin(rows[0]) : null;
    }

    async findWithPasswordByEmail(email: string): Promise<AdminWithPassword | null> {
        const rows = await this.db.select().from(admins).where(eq(admins.email, email)).limit(1).execute();
        if (!rows[0]) return null;
        const admin = this.toAdmin(rows[0]);
        return {
            ...admin,
            password: rows[0].password ?? undefined,
        };
    }

    async create(data: { email: string; password: string; firstName: string; lastName: string }): Promise<t_Admin> {
        const id = generateUUID();
        const hashedPassword = await security.hashPassword(data.password);

        const [inserted] = await this.db
            .insert(admins)
            .values({
                id: id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: hashedPassword,
                isActive: 'true',
            })
            .returning();

        if (!inserted) {
            throw new Error('Failed to create admin');
        }

        return this.toAdmin(inserted);
    }

    async updateLastLogin(id: string): Promise<void> {
        await this.db
            .update(admins)
            .set({
                lastLogin: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(admins.id, id))
            .execute();
    }
}
