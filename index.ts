import 'dotenv/config';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { createRouter, bootstrap } from './api/generated';
import { handlers } from './handler';

// Load OpenAPI spec for Swagger UI
const swaggerDocument = YAML.load(path.join(__dirname, 'api/spec/openapi.yaml'));

// Start server
const PORT = Number(process.env.PORT) || 3000;

bootstrap({
    port: PORT,
    router: createRouter(handlers),
    cors: undefined, // Allow all origins by default
    middleware: swaggerUi.serve,
}).then(({ app }) => {
    app.use('/swagger', swaggerUi.setup(swaggerDocument));

    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 Swagger UI: http://localhost:${PORT}/swagger`);
    console.log(`📡 API endpoints available`);
});
