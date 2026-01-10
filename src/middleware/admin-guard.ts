import type { UserPayload } from '../utils/security';

const ADMIN_GROUP_TYPE = 'admin';

export function isAdmin(req: any): boolean {
    const user = (req as any).user as UserPayload | undefined;
    return user?.userType === ADMIN_GROUP_TYPE;
}
