import 'dotenv/config';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { bootstrap, createRouter } from '../api/generated';
import { handlers } from './handler';
import { loggerMiddleware } from './middleware/logger.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { debugRequestMiddleware } from './middleware/debug.middleware';
import { connectMiddleware } from './middleware/connect.middleware';
import { createDefaultAdmin } from './utils/default-admin';
import { createDefaultUsers } from './utils/default-users';
import { createDefaultSubscriptions } from './utils/default-subscription';
import { createDefaultInvoices } from './utils/default-invoice';
import { registerConnect } from './connect/register.connect';
import { logger } from './utils/logger';

const swaggerDocument = YAML.load(path.join(__dirname, '../api/spec/openapi.yaml'));
const PORT = Number(process.env.PORT) || 3000;

async function main() {
    await createDefaultAdmin();
    await createDefaultUsers();

    const { app } = await bootstrap({
        port: PORT,
        router: createRouter(handlers),
        cors: undefined,
        middleware: [...swaggerUi.serve, connectMiddleware, debugRequestMiddleware, loggerMiddleware, authMiddleware],
    });

    app.use('/swagger', swaggerUi.setup(swaggerDocument));

    // Global Error Handler
    app.use((err: any, req: any, res: any, _next: any) => {
        const log = req.log || logger;
        log.error({ err }, 'Unhandled request error');

        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    });

    await createDefaultSubscriptions();
    await createDefaultInvoices();
    await registerConnect();

    logger.info(`Server running on http://localhost:${PORT}`);
    logger.info(`Swagger UI: http://localhost:${PORT}/swagger`);
}

main().catch((e) => {
    logger.error(e);
    process.exit(1);
});
