import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    dbCredentials: {
        url: './data/gamers-erp.db',
    },
    dialect: 'sqlite',
    out: './database/memory/migrations',
    schema: './database/memory/schema.ts',
});
