# Gestion des abonnements

Cette section concerne le cycle de vie des abonnements aux services Gamers ERP.

## Principes généraux

- Les abonnements sont mensuels.
- Tout mois commencé est dû intégralement (pas de prorata).
- Un abonnement lie un utilisateur à une offre via un `contractCode`.

---

## Opérations d'abonnement

_Note : Ces endpoints sont accessibles aux utilisateurs (pour leur propre compte) et aux administrateurs._

### Créer un abonnement

Active un nouvel abonnement pour un joueur.

- **Méthode** : `POST`
- **Chemin** : `/subscriptions`
- **Accès** : Authentifié

#### Exemple de requête

```json
{
  "userId": "a1b2c3d4-e5f6-4g7h-8i9j-k1l2m3n4o5p6",
  "contractCode": "GAMER_GOLD_2026",
  "startDate": "2026-02-01",
  "monthlyAmount": 19.99,
  "promoCode": "WELCOME2026"
}
```

#### Exemple de réponse (201 Created)

```json
{
  "success": true,
  "message": "Subscription created successfully",
  "payload": {
    "id": "sub-uuid-123",
    "userId": "a1b2c3d4-e5f6-4g7h-8i9j-k1l2m3n4o5p6",
    "contractCode": "GAMER_GOLD_2026",
    "status": "ACTIVE",
    "monthlyAmount": 19.99,
    "startDate": "2026-02-01",
    "promoCode": "WELCOME2026"
  }
}
```

### Lister les abonnements

Liste les abonnements actifs ou passés.

- **Méthode** : `GET`
- **Chemin** : `/subscriptions`
- **Accès** : Authentifié
- **Paramètres (Query)** :
  - `userId` : (Optionnel) Filtrer par utilisateur.
  - `status` : (Optionnel) Filtrer par statut (`ACTIVE`, `CANCELLED`).

#### Exemple de réponse (200 OK)

```json
{
  "success": true,
  "message": "Subscriptions retrieved successfully",
  "payload": [
    {
      "id": "sub-uuid-123",
      "userId": "a1b2c3d4-e5f6-4g7h-8i9j-k1l2m3n4o5p6",
      "contractCode": "GAMER_GOLD_2026",
      "status": "ACTIVE",
      "monthlyAmount": 19.99,
      "startDate": "2026-02-01",
      "endDate": null,
      "user": {
        "id": "a1b2c3d4-e5f6-4g7h-8i9j-k1l2m3n4o5p6",
        "firstName": "Alice",
        "lastName": "Smith",
        "email": "alice.smith@example.com"
      }
    }
  ]
}
```

### Consulter un abonnement

Récupère les détails d'un abonnement spécifique, incluant les informations de l'utilisateur rattaché.

- **Méthode** : `GET`
- **Chemin** : `/subscriptions/{subscriptionId}`
- **Accès** : Authentifié

#### Exemple de réponse (200 OK)

```json
{
  "success": true,
  "message": "Subscription retrieved successfully",
  "payload": {
    "id": "sub-uuid-123",
    "userId": "a1b2c3d4-e5f6-4g7h-8i9j-k1l2m3n4o5p6",
    "contractCode": "GAMER_GOLD_2026",
    "status": "ACTIVE",
    "monthlyAmount": 19.99,
    "startDate": "2026-02-01",
    "endDate": null,
    "promoCode": "WELCOME2026",
    "user": {
      "id": "a1b2c3d4-e5f6-4g7h-8i9j-k1l2m3n4o5p6",
      "firstName": "Alice",
      "lastName": "Smith",
      "email": "alice.smith@example.com",
      "status": "OK"
    }
  }
}
```

### Mettre à jour un abonnement

Modifie les détails d'un abonnement existant.

- **Méthode** : `PUT`
- **Chemin** : `/subscriptions/{subscriptionId}`
- **Accès** : Authentifié

#### Exemple de requête

```json
{
  "monthlyAmount": 24.99,
  "promoCode": null
}
```

#### Exemple de réponse (200 OK)

```json
{
  "success": true,
  "message": "Subscription updated successfully",
  "payload": {
    "id": "sub-uuid-123",
    "contractCode": "GAMER_GOLD_2026",
    "status": "ACTIVE",
    "monthlyAmount": 24.99,
    "startDate": "2026-02-01",
    "promoCode": null
  }
}
```

### Résilier un abonnement

Met fin à un abonnement à la fin de la période en cours.

- **Méthode** : `DELETE`
- **Chemin** : `/subscriptions/{subscriptionId}`
- **Accès** : Authentifié

#### Exemple de réponse (200 OK)

```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "payload": {
    "id": "sub-uuid-123",
    "contractCode": "GAMER_GOLD_2026",
    "status": "CANCELLED",
    "monthlyAmount": 19.99,
    "startDate": "2026-02-01",
    "endDate": "2026-02-28"
  }
}
```
