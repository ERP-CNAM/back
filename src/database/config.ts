/**
 * Set the default repository type
 * 
 * @default 'in-memory' if NODE_ENV is not 'production', otherwise 'postgres'
 */

export type RepositoryType = 'in-memory' | 'postgres';

const DEFAULT_REPOSITORY: RepositoryType = process.env.NODE_ENV === 'production' ? 'postgres' : 'in-memory';

export const DB_TYPE: RepositoryType = (process.env.REPOSITORY || DEFAULT_REPOSITORY) as RepositoryType;

export const DB_CONFIG = {
    postgres: {
        url: process.env.DATABASE_URL,
    },
};
