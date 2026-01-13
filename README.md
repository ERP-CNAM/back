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

L'API sera accessible sur `http://localhost:3000` et la documentation de l'API sur `http://localhost:3000/swagger`.
Une documentation complète par domaine métier est disponible dans le dossier [docs/api/](docs/api/README.md).

---

## Workflow Design to Code API

Ce projet suit une approche **Design First** : vous définissez d'abord le contrat API dans OpenAPI, puis le code est
généré automatiquement.

### 1. Design - Définir l'API

Modifiez `api/spec/openapi.yaml` pour ajouter ou modifier un endpoint.

### 2. Generate - Générer les interfaces, routes, et types

```bash
npm run generate
```

Cette commande génère automatiquement dans `api/` :

- Types TypeScript (`GetUser`, `GetUserResponder`)
- Schémas de validation Zod v4 (dans `schemas.ts`)
- Interface `Implementation` pour assembler les handlers

### 3. Implement - Implémenter la logique métier

Créez votre handler dans le sous-répertoire approprié de `src/handler/` (public, authenticated, admin) en utilisant les types générés.

Enregistrez ensuite le handler dans `src/handler/index.ts`.

### 4. Secure - Configurer la sécurité

Toute nouvelle route doit être déclarée dans `src/middleware/routes.config.ts` pour définir son niveau d'accès (public, authenticated, admin).

---

## Structure du projet

```
back/
├── api/
│   ├── spec/
│   │   └── openapi.yaml    # Source de vérité - Contrat API
│   ├── generated.ts        # Routeur Express généré
│   ├── models.ts           # Types TypeScript générés
│   └── schemas.ts          # Validations Zod générées
├── src/
│   ├── handler/            # Logique métier par niveau d'accès
│   │   ├── public/         # Routes publiques (login, reg)
│   │   ├── authenticated/  # Routes utilisateurs connectés
│   │   └── admin/          # Routes administrateurs
│   ├── repository/         # Accès aux données (In-memory & Postgres)
│   ├── database/           # Schémas et migrations (Drizzle)
│   ├── middleware/         # Auth et sécurité des routes
│   └── index.ts            # Point d'entrée Express
├── docs/                   # Documentation et ADRs
└── test/                   # Tests unitaires et intégration
```

---

## Technologies utilisées

- **Runtime** : Node.js + TypeScript
- **API Framework** : Express
- **ORM** : [Drizzle ORM](https://orm.drizzle.team/)
- **Base de données** : SQLite in-memory (dev/tests) & PostgreSQL (prod)
- **Validation** : Zod
- **Tests** : [Vitest](https://vitest.dev/)
- **Générateur** : [@nahkies/openapi-code-generator](https://openapi-code-generator.nahkies.co.nz)

---

## Support

Pour toute question ou problème, ouvrez une [issue sur GitHub](https://github.com/ERP-CNAM/back/issues).
