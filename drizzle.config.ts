import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './database/postgres/schema.ts',
    out: './database/postgres/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
