/**
 * Change DB_TYPE to switch between different database implementations
 */

export type RepositoryType = 'in-memory' | 'postgres';

export const DB_TYPE: RepositoryType = (process.env.REPOSITORY || 'postgres') as RepositoryType;

export const DB_CONFIG = {
    postgres: {
        url: process.env.DATABASE_URL,
    },
};
