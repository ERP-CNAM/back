import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    dialect: 'sqlite',
    out: './database/memory/migrations',
    schema: './database/memory/schema.ts',
});
