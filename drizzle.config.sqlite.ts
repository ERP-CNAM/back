import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    dialect: 'sqlite',
    out: './src/database/memory/migrations',
    schema: './src/database/memory/schema.ts',
});
