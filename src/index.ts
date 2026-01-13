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

const swaggerDocument = YAML.load(path.join(__dirname, '../api/spec/openapi.yaml'));
const PORT = Number(process.env.PORT) || 3000;

async function main() {
    // ✅ on attend VRAIMENT la création
    await createDefaultAdmin();
    await createDefaultUsers();

    const { app } = await bootstrap({
        port: PORT,
        router: createRouter(handlers),
        cors: undefined,
        middleware: [...swaggerUi.serve, connectMiddleware, debugRequestMiddleware, loggerMiddleware, authMiddleware],
    });

    app.use('/swagger', swaggerUi.setup(swaggerDocument));

    // ✅ subscriptions après users
    await createDefaultSubscriptions();

    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Swagger UI: http://localhost:${PORT}/swagger`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
