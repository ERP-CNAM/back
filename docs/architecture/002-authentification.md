# Architecture d'authentification

## Contexte

Le backend sert trois types de clients avec différents modèles de confiance :

1. **Utilisateurs externes** via Connect Gateway
2. **Services internes** (communication S2S)
3. **Admin SPA** (accès direct Backoffice)

Nous avions besoin d'un flux d'authentification unifié gérant les trois sans duplication de code.

## Décision

### Flux d'authentification

```mermaid
flowchart TD
    Start([REQUÊTE REÇUE]) --> APIKey{apiKey présente dans le body ?}
    APIKey -- "OUI" --> Connect["CONNECT MIDDLEWARE<br/>1. Valide apiKey<br/>2. Extrait userData"]
    APIKey -- "NON" --> Bypass["BYPASS direct"]

    Connect --> SetConnect["isConnectRequest=true<br/>req.user = userData"]
    Bypass --> SetNormal["isConnectRequest=undefined"]

    SetConnect --> Auth["AUTH MIDDLEWARE"]
    SetNormal --> Auth

    Auth --> CheckCase{Cas}
    CheckCase -- "isConnectRequest = true" --> S2S["CONFIANCE S2S<br/>Accès total"]
    CheckCase -- "req.user existe" --> Perms["VÉRIF PERMS<br/>(admin/user)"]
    CheckCase -- "Aucun" --> JWT["VALIDER JWT<br/>depuis header"]
```

### Chemins d'accès

| Chemin  | Client              | apiKey | JWT validé par | `isConnectRequest` | `req.user`      |
| ------- | ------------------- | ------ | -------------- | ------------------ | --------------- |
| Gateway | Utilisateur externe | Oui    | Connect        | `true`             | Depuis userData |
| S2S     | Service interne     | Oui    | N/A            | `true`             | `undefined`     |
| Direct  | Admin SPA           | Non    | Backend        | `undefined`        | Depuis JWT      |

### Détails d'implémentation

1. **`shouldBypassConnect()`** - Retourne `true` si pas d'`apiKey`, saute le middleware connect.

2. **Flag `isConnectRequest`** - Défini à `true` uniquement avec une `apiKey` valide.

3. **Contexte utilisateur** - Peut provenir de :
   - `userData` de Connect (chemin Gateway)
   - JWT dans l'en-tête Authorization (chemin Direct)

### Flux SPA Direct (sans apiKey de Connect)

```mermaid
sequenceDiagram
    participant SPA as Admin SPA
    participant CM as connect.middleware.ts
    participant AM as auth.middleware.ts
    SPA->>CM: GET /users (sans apiKey)
    Note over CM: shouldBypassConnect(req) returns TRUE
    Note over CM: SAUTE ce middleware
    CM->>AM: isConnectRequest = undefined
    Note over AM: authenticateWithToken()
    Note over AM: Extrait & Vérifie JWT de l'en-tête
    Note over AM: Définit req.user
    AM-->>SPA: "Autorisé ou Refusé (Permissions)"
```

### Cycle de vie du token

- **Génération :** Backend (`security.generateToken()`, `security.generateAdminToken()`)
- **Validation (Gateway) :** Connect Gateway
- **Validation (Direct) :** Backend (`security.verifyToken()`)

Les deux doivent utiliser le même `JWT_SECRET` / `CONNECT_JWT_SECRET`.

## Conséquences

### Positives

- Une seule pile middleware gère tous les patterns d'accès
- Pas de validation JWT redondante
- Les services S2S ont un accès complet avec la clé API
- Séparation claire des frontières de confiance

### Négatives

- `JWT_SECRET` doit être synchronisé entre Connect et Backend
- L'accès SPA direct nécessite de maintenir `verifyToken()` dans le Backend

## Fichiers Concernés

- `src/middleware/connect.middleware.ts`
- `src/middleware/auth.middleware.ts`
- `src/utils/security.ts`
