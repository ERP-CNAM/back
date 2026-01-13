import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import type { UserRepository, UserQueryOptions, UserWithPassword } from '../user.repository';
import type {
    t_CreateUserRequestBodySchema,
    t_UpdateUserRequestBodySchema,
    t_User,
    t_UserStatus,
} from '../../../api/models';
import { users } from '../../database/memory/schema';
import { generateUUID } from '../../utils/uuid';
import { security } from '../../utils/security';

export class InMemoryUserRepository implements UserRepository {
    constructor(private db: BetterSQLite3Database) { }

    private toUser(row: any): t_User {
        return {
            id: row.id,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phone: row.phone ?? undefined,
            address: row.address ?? undefined,
            city: row.city ?? undefined,
            postalCode: row.postalCode ?? undefined,
            country: row.country ?? undefined,
            dateOfBirth: row.dateOfBirth,
            paymentMethod: row.paymentMethod ? JSON.parse(row.paymentMethod) : undefined,
            status: row.status,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }

    async findAll(options?: UserQueryOptions): Promise<t_User[]> {
        let query = this.db.select().from(users);

        if (options?.status) {
            query = query.where(eq(users.status, options.status)) as any;
        }

        return query.all().map((row) => this.toUser(row));
    }

    async findById(id: string): Promise<t_User | null> {
        const rows = this.db.select().from(users).where(eq(users.id, id)).limit(1).all();
        return rows.length > 0 ? this.toUser(rows[0]) : null;
    }

    async findByEmail(email: string): Promise<t_User | null> {
        const rows = this.db.select().from(users).where(eq(users.email, email)).limit(1).all();
        return rows.length > 0 ? this.toUser(rows[0]) : null;
    }

    async findWithPasswordByEmail(email: string): Promise<UserWithPassword | null> {
        const rows = this.db.select().from(users).where(eq(users.email, email)).limit(1).all();
        const row = rows[0];
        if (!row) return null;
        const user = this.toUser(row);
        return {
            ...user,
            password: row.password ?? undefined,
        };
    }

    async create(data: t_CreateUserRequestBodySchema): Promise<t_User> {
        const hashedPassword = await security.hashPassword(data.password);
        const { password, ...userData } = data;
        const newUser: t_User = {
            id: generateUUID(),
            status: 'OK',
            ...userData,
            country: userData.country ?? 'FR',
            phone: userData.phone ?? undefined,
            address: userData.address ?? undefined,
            city: userData.city ?? undefined,
            postalCode: userData.postalCode ?? undefined,
            dateOfBirth: userData.dateOfBirth ?? null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        this.db
            .insert(users)
            .values({
                id: newUser.id!,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                password: hashedPassword,
                phone: newUser.phone,
                address: newUser.address,
                city: newUser.city,
                postalCode: newUser.postalCode,
                country: newUser.country ?? 'FR',
                dateOfBirth: newUser.dateOfBirth,
                paymentMethod: newUser.paymentMethod ? JSON.stringify(newUser.paymentMethod) : null,
                status: newUser.status,
                createdAt: newUser.createdAt,
                updatedAt: newUser.updatedAt,
            })
            .run();

        return newUser;
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

        const updatedUser: t_User = {
            ...existingUser,
            ...data,
            id, // Preserve original ID
            updatedAt: new Date().toISOString(),
        };

        this.db
            .update(users)
            .set({
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                phone: updatedUser.phone,
                address: updatedUser.address,
                city: updatedUser.city,
                postalCode: updatedUser.postalCode,
                country: updatedUser.country,
                dateOfBirth: updatedUser.dateOfBirth,
                paymentMethod: updatedUser.paymentMethod ? JSON.stringify(updatedUser.paymentMethod) : null,
                status: updatedUser.status,
                updatedAt: updatedUser.updatedAt,
            })
            .where(eq(users.id, id))
            .run();

        return updatedUser;
    }

    async delete(id: string): Promise<boolean> {
        const user = await this.findById(id);
        if (!user) return false;

        this.db
            .update(users)
            .set({
                status: 'BLOCKED',
                updatedAt: new Date().toISOString(),
            })
            .where(eq(users.id, id))
            .run();

        return true;
    }

    async updateStatus(id: string, status: t_UserStatus): Promise<t_User | null> {
        return this.update(id, { status });
    }
}
