/**
 * Change DB_TYPE to switch between different database implementations
 */

export type DatabaseType = 'sqlite-memory' | 'sqlite-file' | 'postgres';

export const DB_TYPE: DatabaseType = (process.env.DATASTORE as DatabaseType) || 'sqlite-memory';

export const DB_CONFIG = {
    sqlite: {
        filename: './data/gamers-erp.db',
    },

    postgres: {
        url: process.env.DATABASE_URL || null,
    },
};
