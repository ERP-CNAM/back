import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import type { AdminRepository, AdminWithPassword } from '../admin.repository';
import type { t_Admin } from '../../../api/models';
import { admins } from '../../database/memory/schema';
import { generateUUID } from '../../utils/uuid';
import { security } from '../../utils/security';

export class InMemoryAdminRepository implements AdminRepository {
    constructor(private db: BetterSQLite3Database) {}

    private toAdmin(row: any): t_Admin {
        return {
            id: row.id,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            isActive: row.isActive,
            lastLogin: row.lastLogin,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }

    async findAll(): Promise<t_Admin[]> {
        const rows = this.db.select().from(admins).all();
        return rows.map((row) => this.toAdmin(row));
    }

    async findById(id: string): Promise<t_Admin | null> {
        const rows = this.db.select().from(admins).where(eq(admins.id, id)).limit(1).all();
        return rows.length > 0 ? this.toAdmin(rows[0]) : null;
    }

    async findByEmail(email: string): Promise<t_Admin | null> {
        const rows = this.db.select().from(admins).where(eq(admins.email, email)).limit(1).all();
        return rows.length > 0 ? this.toAdmin(rows[0]) : null;
    }

    async findWithPasswordByEmail(email: string): Promise<AdminWithPassword | null> {
        const rows = this.db.select().from(admins).where(eq(admins.email, email)).limit(1).all();
        const row = rows[0];
        if (!row) return null;
        const admin = this.toAdmin(row);
        return {
            ...admin,
            password: row.password ?? undefined,
        };
    }

    async create(data: { email: string; password: string; firstName: string; lastName: string }): Promise<t_Admin> {
        const hashedPassword = await security.hashPassword(data.password);
        const id = generateUUID();
        const now = new Date().toISOString();

        this.db
            .insert(admins)
            .values({
                id: id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: hashedPassword,
                isActive: 'true',
                lastLogin: null,
                createdAt: now,
                updatedAt: now,
            })
            .run();

        const newAdmin: t_Admin = {
            id: id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            isActive: 'true',
            createdAt: now,
            updatedAt: now,
        };

        return newAdmin;
    }

    async updateLastLogin(id: string): Promise<void> {
        this.db
            .update(admins)
            .set({
                lastLogin: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
            .where(eq(admins.id, id))
            .run();
    }
}
