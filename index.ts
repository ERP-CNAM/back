import 'dotenv/config';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import morgan from 'morgan';
import { bootstrap, createRouter } from './api/generated';
import { handlers } from './handler';

import { security } from './utils/security';

// Load OpenAPI spec for Swagger UI
const swaggerDocument = YAML.load(path.join(__dirname, 'api/spec/openapi.yaml'));

// Start server
const PORT = Number(process.env.PORT) || 3000;

const loggerMiddleware = morgan('combined');

const authMiddleware = (req: any, res: any, next: any) => {
    // Exclude swagger, login, and registration
    if (req.path.startsWith('/swagger') || req.path === '/login' || (req.path === '/users' && req.method === 'POST')) {
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

bootstrap({
    port: PORT,
    router: createRouter(handlers),
    cors: undefined, // Allow all origins by default
    middleware: [...swaggerUi.serve, loggerMiddleware, authMiddleware],
}).then(({ app }) => {
    app.use('/swagger', swaggerUi.setup(swaggerDocument));

    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Swagger UI: http://localhost:${PORT}/swagger`);
    console.log(`API endpoints available`);
});
