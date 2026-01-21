import 'dotenv/config';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { bootstrap, createRouter } from '../api/generated';
import express from 'express';
import { handlers } from './handler';
import { loggerMiddleware } from './middleware/logger.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { debugRequestMiddleware } from './middleware/debug.middleware';
import { connectMiddleware } from './middleware/connect.middleware';
import { runDatabaseSeed } from './utils/seed/runner';
import { registerConnect } from './adapter/register.connect';
import { logger } from './utils/logger';
import { runPostgresMigrations } from './database/postgres/instance';

const swaggerDocument = YAML.load(path.join(__dirname, '../api/spec/openapi.yaml'));
const PORT = Number(process.env.PORT) || 3000;
const BACKOFFICE_PORT = Number(process.env.BACKOFFICE_PORT) || 3001;

/**
 * Main function
 * - Runs migrations
 * - Runs database seeds (Admin, Users, Subscriptions, Invoices)
 * - Registers Connect
 * - Starts the server
 * - Starts backoffice web page
 */
async function main() {
    await runPostgresMigrations();
    await runDatabaseSeed();

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
            payload: null,
        });
    });

    await registerConnect();

    logger.info(`Server running on http://localhost:${PORT}`);
    logger.info(`Swagger UI: http://localhost:${PORT}/swagger`);
    bootstrapBackoffice();
}

/**
 * Bootstrap backoffice administration web page
 */
function bootstrapBackoffice() {
    const backofficeApp = express();
    backofficeApp.use(express.static(path.join(process.cwd(), 'web')));
    backofficeApp.listen(BACKOFFICE_PORT, () => {
        logger.info(`Backoffice server running on http://localhost:${BACKOFFICE_PORT}`);
    });
}

main().catch((e) => {
    logger.error(e);
    process.exit(1);
});
