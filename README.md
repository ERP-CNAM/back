# BACK - ERP CNAM API

Système intelligent de l'application ERP CNAM. API de gestion des joueurs abonnés.

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/ERP-CNAM/back.git
cd back
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration

Créer un fichier `.env` à la racine du projet selon vos besoins de configuration.

```bash
cp .env.example .env
```

### 4. Base de données

Le projet utilise SQLite avec Drizzle ORM. La base de données est configurée pour fonctionner en mémoire pour le moment.
Une intégration avec PostgreSQL sera réalisé prochainement.

## Développement

### Lancer l'API en mode développement

```bash
npm run dev
```

Le serveur se lancera avec nodemon et redémarrera automatiquement à chaque modification.

### Lancer l'API

```bash
npm start
```

L'API sera accessible sur le port configuré dans le fichier `.env` ou à défaut sur le port `:3000`.

## Génération du code depuis OpenAPI

Le projet utilise un générateur de code basé sur la spécification OpenAPI (`api/openapi.yaml`).

### Regénérer le code serveur

```bash
npm run generate
```

Cette commande génère le code TypeScript dans le dossier `server` à partir du fichier OpenAPI, en utilisant le
générateur [@nahkies/openapi-code-generator](https://openapi-code-generator.nahkies.co.nz/overview/about)

## Tests

Le projet utilise [Vitest](https://vitest.dev/) pour les tests.

### Lancer les tests

```bash
npm test
```

### Lancer les tests en mode watch pour le développement

```bash
npm run test:watch
```

### Générer le rapport de couverture

```bash
npm run test:coverage
```

## Structure du projet

```
back/
├── api/              # Spécification OpenAPI
│   └── openapi.yaml
├── database/         # Configuration base de données
├── server/           # Code généré (ne pas modifier manuellement)
├── utils/            # Utilitaires
└── index.ts          # Point d'entrée de l'application
```

## Comment contribuer au développement de l'API

### 1. Créer une branche

```bash
git checkout -b nom-de-votre-branche
```

### 2. Faire vos modifications

- Modifier le fichier `api/openapi.yaml` pour les changements d'API
- Regénérer le code avec `npm run generate`
- Implémenter la logique métier
- Ajouter des tests

### 3. Tester vos modifications

```bash
npm test
npm run dev  # Vérifier que tout fonctionne
```

### 4. Créer une Pull Request

Créez une Pull Request sur GitHub vers la branche `main`.

## Bonnes pratiques

- Toujours regénérer le code serveur après modification de `openapi.yaml`
- Ne jamais modifier directement les fichiers dans le dossier `server/`
- Écrire des tests pour toutes les nouvelles fonctionnalités
- Suivre les conventions de nommage TypeScript
- Vérifier que les tests passent avant de créer une PR

## Support

Pour toute question ou problème, ouvrez une issue sur GitHub.