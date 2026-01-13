/**
 * Change DB_TYPE to switch between different database implementations
 */

export type RepositoryType = 'in-memory' | 'postgres';

const DEFAULT_REPOSITORY: RepositoryType = process.env.NODE_ENV === 'production' ? 'postgres' : 'in-memory';

export const DB_TYPE: RepositoryType = (process.env.REPOSITORY || DEFAULT_REPOSITORY) as RepositoryType;

export const DB_CONFIG = {
    postgres: {
        url: process.env.DATABASE_URL,
    },
};
