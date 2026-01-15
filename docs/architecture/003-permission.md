# Permissions & Autorisations

## Vue d'Ensemble

Le Backend applique les permissions à deux niveaux :

1. **Connect (Gateway)** - Vérifie l'accès AVANT de transférer au Backend
2. **Backend** - Vérifie à nouveau en backup (défense en profondeur)

## Niveaux de Permission (Bitmask)

| Permission  | Valeur | Binaire | Description                     |
| ----------- | ------ | ------- | ------------------------------- |
| Public      | 0      | 00      | Aucune authentification requise |
| Authentifié | 1      | 01      | Utilisateurs connectés          |
| Admin       | 3      | 11      | Accès total (auth + admin)      |

> **Note :** Admin = 3 (pas 2) pour avoir accès aux routes authenticated ET admin.

## Vérification des Permissions

Connect et Backend utilisent le même check bitmask :

```
(user.permission & route.permission) === route.permission
```

### Exemples

| User Perm | Route Perm | Calcul    | Résultat |
| --------- | ---------- | --------- | -------- |
| 1 (user)  | 1 (auth)   | 1 & 1 = 1 | Autorisé |
| 3 (admin) | 1 (auth)   | 3 & 1 = 1 | Autorisé |
| 3 (admin) | 2 (admin)  | 3 & 2 = 2 | Autorisé |
| 1 (user)  | 2 (admin)  | 1 & 2 = 0 | Refusé   |

## Flux : Requête vers Route Protégée

```
Utilisateur (permission=1) demande GET /users (route admin, permission=2)
              │
              ▼
┌────────────────────────────────────────────────────────────────┐
│                       CONNECT GATEWAY                          │
│  1. Décode JWT → permission: 1                                 │
│  2. Route /users GET requiert permission: 2                    │
│  3. Vérifie : (1 & 2) === 2 ? → 0 !== 2 → NON                  │
│  4. REFUSÉ - Retourne 403                                      │
└────────────────────────────────────────────────────────────────┘
```

Admin (permission=3) accède à la même route :

```
Admin (permission=3) demande GET /users (route admin, permission=2)
              │
              ▼
┌────────────────────────────────────────────────────────────────┐
│                       CONNECT GATEWAY                          │
│  1. Décode JWT → permission: 3                                 │
│  2. Route /users GET requiert permission: 2                    │
│  3. Vérifie : (3 & 2) === 2 ? → 2 === 2 → OUI                  │
│  4. AUTORISÉ - Transfère au Backend                            │
└────────────────────────────────────────────────────────────────┘
```

## Configuration des Routes

Définie dans `src/middleware/routes.config.ts` :

```typescript
export const ROUTES: Route[] = [
  // PUBLIC (permission: 0)
  { path: '/auth/login', method: 'POST', access: 'public' },

  // AUTHENTIFIÉ (permission: 1)
  { path: '/subscriptions', method: 'GET', access: 'authenticated' },

  // ADMIN (permission: 2 - mais user doit avoir 3 pour y accéder)
  { path: '/users', method: 'GET', access: 'admin' },
];
```

## Fichiers Concernés

- `src/middleware/routes.config.ts` - Définitions d'accès aux routes
- `src/middleware/auth.middleware.ts` - Logique d'autorisation (bitmask)
- `src/utils/security.ts` - Génération des tokens (user=1, admin=3)
