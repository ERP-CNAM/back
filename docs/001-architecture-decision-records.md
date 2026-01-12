# Architecture Decision Records

Date: 09/01/2026
Statut: En attente

## Contexte

Le projet "Gamers ERP" nécessite une API robuste pour gérer des utilisateurs, des abonnements, et des exports comptables/bancaires. L'application doit être maintenable, testable, et supporter potentiellement plusieurs types de bases de données (dev/prod). Il est nécessaire de définir une stratégie claire pour l'exposition de l'API, la sécurité, et l'accès aux données.

## Décisions

### 1. Approche "Contract-First" avec OpenAPI

Nous utilisons la spécification OpenAPI (`openapi.yaml`) comme source unique de vérité pour notre API.

- **Pourquoi** : garantit que la documentation est toujours à jour avec le code.
- **Implémentation** : génération automatique du routeur Express et des types TypeScript via `openapi-code-generator` de @nahkies/openapi-code-generator.
- **Validation** : la validation des entrées (Schema Validation) est déléguée aux validateurs générés (Zod).

### 2. Architecture en Couches

Nous adoptons une architecture en couches pour séparer les responsabilités :

- **API Layer (`/api`)** : définition des contrats et routage.
- **Handler Layer (`/handler`)** : orchestration des requêtes HTTP (les "Contrôleurs").
- **Middleware Layer (`/middleware`)** : fonctions transverses (Auth, Logs) exécutées avant les handlers.
- **Repository Layer (`/repository`)** : abstraction de l'accès aux données.
- **Database Layer (`/database`)** : implémentations concrètes (Drizzle ORM).

### 3. Stratégie d'Authentification : Bearer JWT

Nous utilisons des **JSON Web Tokens (JWT)** transmis via l'en-tête `Authorization: Bearer`.

- **Pourquoi** :
    - **Stateless** : le serveur ne stocke pas de session en mémoire, idéal pour la scalabilité.
    - **Standard** : compatible avec tout type de client (Web, mobile, tiers).
- **Sécurité** :
    - les mots de passe sont hachés avec `bcrypt` (Salt Rounds = 10) avant stockage.
    - les mots de passe ne sont **jamais** renvoyés dans les réponses API (suppression explicite dans les handlers).

### 4. Abstraction de la Base de Données

Nous utilisons le pattern Repository pour découpler la logique métier de la base de données.

- **Interface** : `UserRepository` définit les contrats.
- **Implémentations** :
    - `InMemoryUserRepository` : pour les tests unitaires rapides et le développement local sans dépendances (SQLite en mémoire).
    - `PostgresUserRepository` : pour la production (PostgreSQL via Drizzle ORM).

## Bénéfices

- Tests facilités par l'injection de dépendances.
- Logique métier protégée des détails d'implémentation HTTP ou SQL.
- Documentation API claire et interactive (Swagger UI) disponible par défaut.

## Points de vigilance

- Léger complexité ajoutée par l'étape de génération de code (`npm run generate`).
- Nécessité de maintenir la synchro entre `openapi.yaml` et le code (le build échoue si désynchronisé, ce qui est une sécurité).
