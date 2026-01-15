# Architecture d'authentification

**Statut :** Accepté  
**Date :** 15/01/2026

## Contexte

Le backend sert trois types de clients avec différents modèles de confiance :

1. **Utilisateurs externes** via Connect Gateway
2. **Services internes** (communication S2S)
3. **Admin SPA** (accès direct Backoffice)

Nous avions besoin d'un flux d'authentification unifié gérant les trois sans duplication de code.

## Décision

### Flux d'authentification

```
┌────────────────────────────────────────────────────────────────────────┐
│                           REQUÊTE REÇUE                                │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                  ┌────────────────────────────────────┐
                  │   apiKey présente dans le body ?   │
                  └────────────────────────────────────┘
                          │                   │
                         OUI                 NON
                          │                   │
                          ▼                   ▼
            ┌──────────────────────┐   ┌──────────────────────┐
            │  CONNECT MIDDLEWARE  │   │   BYPASS (direct)    │
            │  1. Valide apiKey    │   │                      │
            │  2. Extrait userData │   │                      │
            └──────────────────────┘   └──────────────────────┘
                          │                   │
                          ▼                   ▼
            ┌──────────────────────┐   ┌──────────────────────┐
            │ isConnectRequest=true│   │ isConnectRequest=    │
            │ req.user = userData  │   │    undefined         │
            └──────────────────────┘   └──────────────────────┘
                          │                   │
                          └─────────┬─────────┘
                                    ▼
                  ┌────────────────────────────────────┐
                  │          AUTH MIDDLEWARE           │
                  └────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
  ┌────────────────┐        ┌────────────────┐        ┌────────────────┐
  │isConnectRequest│        │   req.user     │        │     Aucun      │
  │    = true      │        │    existe      │        │                │
  └────────────────┘        └────────────────┘        └────────────────┘
          │                         │                         │
          ▼                         ▼                         ▼
  ┌────────────────┐        ┌────────────────┐        ┌────────────────┐
  │ CONFIANCE S2S  │        │  VÉRIF PERMS   │        │  VALIDER JWT   │
  │  Accès total   │        │ (admin/user)   │        │ depuis header  │
  └────────────────┘        └────────────────┘        └────────────────┘
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

### Flux SPA Direct (Sans apiKey)

```
Requête : GET /users
Headers : { Authorization: "Bearer <jwt>" }
Body : { } (pas d'apiKey)
              │
              ▼
┌────────────────────────────────────────────────────────────────┐
│                    connect.middleware.ts                       │
│  1. shouldBypassConnect(req)                                   │
│  2. req.body?.apiKey → undefined                               │
│  3. Retourne TRUE → SAUTE ce middleware                        │
│  4. isConnectRequest = undefined, req.user = undefined         │
└────────────────────────────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────────────┐
│                      auth.middleware.ts                        │
│  1. isConnectRequest? → NON                                    │
│  2. req.user? → NON                                            │
│  3. Appelle authenticateWithToken()                            │
│  4. Extrait JWT de l'en-tête Authorization                     │
│  5. Appelle security.verifyToken(jwt)                          │
│  6. Définit req.user depuis le payload décodé                  │
│  7. Vérifie les permissions → Autorise ou Refuse               │
└────────────────────────────────────────────────────────────────┘
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
