import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './database/memory/schema.ts',
    out: './database/memory/migrations',
    dialect: 'sqlite',
    dbCredentials: {
        url: './data/gamers-erp.db',
    },
});
