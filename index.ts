import express from 'express';
import * as http from 'http';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

const app = express();
app.use(express.json());

// 1. Chargement de la spécification OpenAPI pour Swagger UI
const swaggerDocument = YAML.load(path.join(__dirname, 'api/openapi.yaml'));

// 2. Route pour Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 3. Exemple d'implémentation d'une route (User)
app.get('/users', (req, res) => {
    // Ici vous utiliseriez les interfaces générées
    res.json([{ id: "uuid-1", firstName: "Fatih", status: "OK" }]);
});

const server = http.createServer(app);
server.listen(3000, () => {
    console.log('Serveur lancé sur http://localhost:3000');
    console.log('Documentation disponible sur http://localhost:3000/docs');
});