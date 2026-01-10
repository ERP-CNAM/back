import { security } from '../utils/security';

export const authMiddleware = (req: any, res: any, next: any) => {
    // Exclude swagger, login, and registration
    if (
        req.path.startsWith('/swagger') ||
        req.path === '/auth/login' ||
        (req.path === '/users' && req.method === 'POST')
    ) {
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Token invalide ou manquant' });
    }

    const token = authHeader.split(' ')[1];
    try {
        (req as any).user = security.verifyToken(token);
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Token invalide' });
    }
};
