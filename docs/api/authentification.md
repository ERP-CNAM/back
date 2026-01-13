# Authentification

Cette section décrit comment s'authentifier auprès de l'API Gamers ERP pour obtenir un jeton d'accès (JWT).

## Niveaux d'Accès

| Niveau | Description |
| :--- | :--- |
| **Public** | Accessible à tous sans jeton. |
| **Authentifié** | Nécessite un jeton JWT valide porté par l'en-tête `Authorization`. |
| **Admin** | Nécessite un jeton JWT possédant des droits d'administrateur. |

## Connexion Utilisateur

Permet à un joueur de se connecter pour gérer ses abonnements.

- **Méthode** : `POST`
- **Chemin** : `/auth/login`
- **Accès** : Public

### Exemple de Requête
```json
{
  "email": "john.doe@example.com",
  "password": "Password123!"
}
```

### Exemple de Réponse (200 OK)
```json
{
  "success": true,
  "message": "Connexion réussie",
  "payload": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "status": "OK"
    }
  }
}
```

## Connexion Administrateur

Permet à un administrateur d'accéder aux fonctions de gestion globale, facturation et exports.

- **Méthode** : `POST`
- **Chemin** : `/auth/admin/login`
- **Accès** : Public

### Exemple de Requête
```json
{
  "email": "admin@gamers-erp.com",
  "password": "AdminPassword123!"
}
```

### Exemple de Réponse (200 OK)
```json
{
  "success": true,
  "message": "Connexion réussie",
  "payload": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "admin-uuid",
      "email": "admin@gamers-erp.com",
      "firstName": "Super",
      "lastName": "Admin"
    }
  }
}
```

## Utilisation du Token

Une fois le token obtenu, il doit être inclus dans chaque requête protégée via l'en-tête `Authorization`.

**Exemple :**
`Authorization: Bearer <votre_token_jwt>`
