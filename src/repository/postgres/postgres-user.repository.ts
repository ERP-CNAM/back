import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import type { UserRepository, UserQueryOptions, UserWithPassword } from '../user.repository';
import type {
    t_CreateUserRequestBodySchema,
    t_UpdateUserRequestBodySchema,
    t_User,
    t_UserStatus,
} from '../../../api/models';
import { users } from '../../database/postgres/schema';
import { generateUUID } from '../../utils/uuid';
import { security } from '../../utils/security';

export class PostgresUserRepository implements UserRepository {
    constructor(private db: NodePgDatabase) {}

    private toUser(row: typeof users.$inferSelect): t_User {
        return {
            id: row.id,
            firstName: row.firstName ?? undefined,
            lastName: row.lastName ?? undefined,
            email: row.email ?? undefined,
            phone: row.phone ?? undefined,
            address: row.address ?? undefined,
            city: row.city ?? undefined,
            postalCode: row.postalCode ?? undefined,
            country: row.country ?? undefined,
            dateOfBirth: row.dateOfBirth ? row.dateOfBirth.toISOString().split('T')[0] : undefined,
            status: row.status as t_UserStatus,
            paymentMethod: row.paymentMethod ? JSON.parse(row.paymentMethod) : undefined,
            createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
            updatedAt: row.updatedAt ? row.updatedAt.toISOString() : undefined,
        };
    }

    async findAll(options?: UserQueryOptions): Promise<t_User[]> {
        let query = this.db.select().from(users);

        if (options?.status) {
            query = query.where(eq(users.status, options.status)) as any;
        }

        const rows = await query.execute();
        return rows.map((row) => this.toUser(row));
    }

    async findById(id: string): Promise<t_User | null> {
        const rows = await this.db.select().from(users).where(eq(users.id, id)).limit(1).execute();
        return rows[0] ? this.toUser(rows[0]) : null;
    }

    async findByEmail(email: string): Promise<t_User | null> {
        const rows = await this.db.select().from(users).where(eq(users.email, email)).limit(1).execute();
        return rows[0] ? this.toUser(rows[0]) : null;
    }

    async findWithPasswordByEmail(email: string): Promise<UserWithPassword | null> {
        const rows = await this.db.select().from(users).where(eq(users.email, email)).limit(1).execute();
        if (!rows[0]) return null;
        const user = this.toUser(rows[0]);
        return {
            ...user,
            password: rows[0].password ?? undefined,
        };
    }

    async create(data: t_CreateUserRequestBodySchema): Promise<t_User> {
        const id = generateUUID();
        const hashedPassword = await security.hashPassword(data.password);

        const [inserted] = await this.db
            .insert(users)
            .values({
                id: id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: hashedPassword,
                phone: data.phone,
                address: data.address,
                city: data.city,
                postalCode: data.postalCode,
                country: data.country ?? 'FR',
                dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                paymentMethod: data.paymentMethod ? JSON.stringify(data.paymentMethod) : null,
                status: 'OK',
            })
            .returning();

        if (!inserted) {
            throw new Error('Failed to create user');
        }

        return this.toUser(inserted);
    }

    async update(id: string, data: t_UpdateUserRequestBodySchema): Promise<t_User | null> {
        const existingUser = await this.findById(id);
        if (!existingUser) {
            return null;
        }

        const validStatuses: t_UserStatus[] = ['OK', 'SUSPENDED', 'BLOCKED', 'DELETED'];
        if (data.status && !validStatuses.includes(data.status)) {
            throw new Error(`Invalid user status: ${data.status}`);
        }

        const [updated] = await this.db
            .update(users)
            .set({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                city: data.city,
                postalCode: data.postalCode,
                country: data.country,
                dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
                paymentMethod: data.paymentMethod ? JSON.stringify(data.paymentMethod) : undefined,
                status: data.status,
                updatedAt: new Date(),
            })
            .where(eq(users.id, id))
            .returning();

        return updated ? this.toUser(updated) : null;
    }

    async delete(id: string): Promise<boolean> {
        const [updated] = await this.db
            .update(users)
            .set({
                status: 'BLOCKED',
                updatedAt: new Date(),
            })
            .where(eq(users.id, id))
            .returning();

        return !!updated;
    }

    async updateStatus(id: string, status: t_UserStatus): Promise<t_User | null> {
        return this.update(id, { status });
    }
}
