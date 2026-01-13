# ERP CNAM - BACK

API de gestion des joueurs abonnés pour l'application ERP CNAM.

**Choix d'architecture : Design First avec génération automatique du code depuis OpenAPI**

---

## Démarrage rapide

```bash
# Cloner et installer
git clone https://github.com/ERP-CNAM/back.git
cd back
npm install

# Définisser les variables d'environnement
cp .env.example .env

# Lancer en mode développement
npm run dev
```

L'API sera accessible sur `http://localhost:3000` et la documentation de l'API sur `http://localhost:3000/swagger`

---

## Workflow Design to Code API

Ce projet suit une approche **Design First** : vous définissez d'abord le contrat API dans OpenAPI, puis le code est
généré automatiquement.

### 1. Design - Définir l'API

Modifiez `api/spec/openapi.yaml` pour ajouter ou modifier un endpoint :

```yaml
paths:
    /users/{userId}:
        get:
            operationId: getUser
            tags: [Users]
            parameters:
                - name: userId
                  in: path
                  required: true
                  schema:
                      type: string
            responses:
                '200':
                    description: Utilisateur trouvé
                    content:
                        application/json:
                            schema:
                                $ref: '#/components/schemas/User'
                '404':
                    description: Utilisateur non trouvé
```

### 2. Generate - Générer les interfaces, routes, et types

```bash
npm run generate
```

Cette commande génère automatiquement dans `api/` :

- Types TypeScript (`GetUser`, `GetUserResponder`)
- Schémas de validation Zod v4
- Interface `Implementation` pour assembler les handlers

> Les fichiers générés dans `api/` (generated.ts, models.ts, schemas.ts) sont créés automatiquement - ne les modifiez jamais manuellement !

### 3. Implement - Implémenter la logique métier

Créez votre handler dans `handler/user.ts` en utilisant les types générés :

```typescript
import type { GetUser } from '../api/generated';

const getUser: GetUser = async (params, respond) => {
    const { userId } = params.params;

    const user = await repository.findById(userId);

    if (!user) {
        return respond.with404().body();
    }

    return respond.with200().body(user);
};
```

Enregistrez ensuite le handler dans `handler/index.ts` :

```typescript
export const handlers: Implementation = {
    getUser: userHandlers.getUser,
    // ... autres handlers
};
```

### Test - Valider les implémentations

```bash
# Lancer les tests
npm test

# Tests en mode watch (pratique en mode développement)
npm run test:watch

# Rapport de couverture
npm run test:coverage
```

---

## Pourquoi cette approche ?

| Avantage                       | Bénéfice                                           |
| ------------------------------ | -------------------------------------------------- |
| **Contrat respecté**           | L'implémentation respecte toujours la spec OpenAPI |
| **Type Safety**                | TypeScript détecte les erreurs à la compilation    |
| **Validation automatique**     | Zod valide les entrées/sorties automatiquement     |
| **Documentation synchronisée** | Swagger UI toujours à jour                         |
| **Productivité**               | Moins de code générique à écrire                   |

---

## Structure du projet

```
back/
├── api/
│   ├── spec/
│   │   └── openapi.yaml    # Source de vérité - Contrat API
│   ├── generated.ts        # Code généré (ne pas toucher)
│   ├── models.ts           # Code généré (ne pas toucher)
│   └── schemas.ts          # Code généré (ne pas toucher)
├── handler/                # Logique métier (vous codez ici)
│   ├── user.ts
│   ├── subscription.ts
│   └── index.ts
├── repository/             # Accès aux données
├── database/               # Configuration DB (SQLite/PostgreSQL)
└── index.ts                # Point d'entrée
```

---

## Contribuer au développement

### Workflow recommandé

```bash
# 1. Créer une branche
git checkout -b feature/nom-de-la-feature

# 2. Modifier l'API
# Éditez api/spec/openapi.yaml

# 3. Générer le code
npm run generate

# 4. Implémenter vos handlers dans handler/

# 5. Tester
npm test
npm run dev

# 6. Push et PR
git add .
git commit -m "feat: description"
git push origin feature/nom-de-la-feature
```

### Règles d'or

- Toujours commencer par modifier `api/spec/openapi.yaml`
- Toujours regénérer après modification OpenAPI
- Écrire des tests pour chaque nouveau handler
- Ne jamais modifier les fichiers générés dans `api/` manuellement
- Ne jamais ajouter un fichier Typescript personnalisé dans `api/`, privilégier d'autres répertoires
- Ne jamais commit sans avoir lancé les tests

---

## Technologies utilisées

- **Runtime** : Node.js + TypeScript
- **API Framework** : Express
- **Validation schemas** : Zod v4
- **Base de données** : SQLite in-memory (Drizzle ORM) → PostgreSQL à venir
- **Framework de tests** : [Vitest](https://vitest.dev/)
- **Générateur de code** : [@nahkies/openapi-code-generator](https://openapi-code-generator.nahkies.co.nz)

---

## Support

Pour toute question ou problème, ouvrez une [issue sur GitHub](https://github.com/ERP-CNAM/back/issues).
