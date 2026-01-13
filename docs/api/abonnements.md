# Gestion des Abonnements

Cette section concerne le cycle de vie des abonnements aux services Gamers ERP.

## Principes Généraux
- Les abonnements sont mensuels.
- Tout mois commencé est dû intégralement (pas de prorata).
- Un abonnement lie un utilisateur à une offre via un `contractCode`.

---

## Opérations d'Abonnement

*Note : Ces endpoints sont accessibles aux utilisateurs (pour leur propre compte) et aux administrateurs.*

### Créer un abonnement
Active un nouvel abonnement pour un joueur.

- **Méthode** : `POST`
- **Chemin** : `/subscriptions`
- **Accès** : Authentifié

### Exemple de Requête
```json
{
  "userId": "a1b2c3d4-e5f6-4g7h-8i9j-k1l2m3n4o5p6",
  "contractCode": "GAMER_GOLD_2026",
  "startDate": "2026-02-01",
  "monthlyAmount": 19.99,
  "promoCode": "WELCOME2026"
}
```

### Exemple de Réponse (201 Created)
```json
{
  "success": true,
  "message": "Abonnement créé",
  "payload": {
    "id": "sub-uuid-123",
    "contractCode": "GAMER_GOLD_2026",
    "status": "ACTIVE",
    "monthlyAmount": 19.99,
    "startDate": "2026-02-01"
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


### Consulter un abonnement
Récupère les détails d'un abonnement spécifique, incluant les informations de l'utilisateur rattaché.

- **Méthode** : `GET`
- **Chemin** : `/subscriptions/{subscriptionId}`
- **Accès** : Authentifié


### Résilier un abonnement
Met fin à un abonnement à la fin de la période en cours.

- **Méthode** : `DELETE`
- **Chemin** : `/subscriptions/{subscriptionId}`
- **Accès** : Authentifié
