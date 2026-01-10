import { DB_TYPE } from './config';
import { getPostgresDatabase } from './postgres/instance';
import { getInMemoryDatabase } from './memory/instance';

let dbInstance: any;

export function getDatabase(): any {
    if (dbInstance) return dbInstance;

    if (DB_TYPE === 'postgres') {
        dbInstance = getPostgresDatabase();
    } else if (DB_TYPE === 'in-memory') {
        dbInstance = getInMemoryDatabase();
    } else {
        throw new Error(`Database type ${DB_TYPE} not yet implemented`);
    }

    return dbInstance;
}
