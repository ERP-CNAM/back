import express, { Request, Response } from 'express';
import * as http from 'http';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

import { User, UserStatus } from './server/model/models';
import usersData from './mock/users.json';

const app = express();
app.use(express.json());

const swaggerDocument = YAML.load(path.join(__dirname, 'api/openapi.yaml'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const usersMock = (usersData as unknown) as User[];

/**
 * GET /users
 */
app.get('/users', (req: Request, res: Response) => {
    const statusQuery = req.query.status as unknown as UserStatus;

    if (statusQuery) {
        const filtered = usersMock.filter(u => u.status === statusQuery);
        return res.json(filtered);
    }

    res.json(usersMock);
});

/**
 * GET /users/{userId}
 */
app.get('/users/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;
    const user = usersMock.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.json(user);
});

const server = http.createServer(app);
server.listen(3000, () => {
    console.log('🚀 Serveur sur http://localhost:3000');
    console.log('📚 Docs sur http://localhost:3000/docs');
});