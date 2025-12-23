export * from './bankingExportsApi';
import { BankingExportsApi } from './bankingExportsApi';
export * from './billingApi';
import { BillingApi } from './billingApi';
export * from './reportsApi';
import { ReportsApi } from './reportsApi';
export * from './subscriptionsApi';
import { SubscriptionsApi } from './subscriptionsApi';
export * from './usersApi';
import { UsersApi } from './usersApi';
import * as http from 'http';

export class HttpError extends Error {
    constructor (public response: http.IncomingMessage, public body: any, public statusCode?: number) {
        super('HTTP request failed');
        this.name = 'HttpError';
    }
}

export { RequestFile } from '../model/models';

export const APIS = [BankingExportsApi, BillingApi, ReportsApi, SubscriptionsApi, UsersApi];
