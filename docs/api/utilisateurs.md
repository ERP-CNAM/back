# Gestion des utilisateurs

Cette section détaille les opérations relatives aux comptes utilisateurs (joueurs).

## Inscription

Création d'un nouveau compte joueur. Cet endpoint est généralement appelé lors d'une inscription sur la plateforme Gamers.

- **Méthode** : `POST`
- **Chemin** : `/users`
- **Accès** : Public

### Exemple de requête

```json
{
  "firstName": "Alice",
  "lastName": "Smith",
  "email": "alice.smith@example.com",
  "password": "SecurePassword123!",
  "phone": "+33600000000",
  "address": "10 Rue de Rivoli",
  "city": "Paris",
  "postalCode": "75004",
  "country": "FR",
  "dateOfBirth": "1992-08-24"
}
```

### Exemple de réponse (201 Created)

```json
{
  "success": true,
  "message": "Utilisateur créé",
  "payload": {
    "id": "a1b2c3d4-e5f6-4g7h-8i9j-k1l2m3n4o5p6",
    "firstName": "Alice",
    "lastName": "Smith",
    "email": "alice.smith@example.com",
    "status": "OK",
    "createdAt": "2026-01-13T20:00:00Z"
    ...
  }
}
```

---

## Administration des Utilisateurs

_Note : Les endpoints suivants nécessitent un token **Administrateur**._

### Lister les utilisateurs

Récupère la liste de tous les joueurs inscrits.

- **Méthode** : `GET`
- **Chemin** : `/users`
- **Accès** : Admin
- **Paramètres (Query)** :
  - `status` : Filtrer par statut (`OK`, `SUSPENDED`, `BLOCKED`, `DELETED`).

#### Exemple de réponse (200 OK)

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "payload": [
    {
      "id": "a1b2c3d4-e5f6-4g7h-8i9j-k1l2m3n4o5p6",
      "firstName": "Alice",
      "lastName": "Smith",
      "email": "alice.smith@example.com",
      "phone": "+33600000000",
      "status": "OK",
      "createdAt": "2026-01-13T20:00:00Z"
      ...
    },
    {
      "id": "b2c3d4e5-f6g7-5h8i-9j0k-l1m2n3o4p5q6",
      "firstName": "Bob",
      "lastName": "Martin",
      "email": "bob.martin@example.com",
      "phone": "+33611111111",
      "status": "OK",
      "createdAt": "2026-01-14T10:00:00Z"
      ...
    }
  ]
}
```

### Consulter un utilisateur

Détails complets d'un joueur par son ID.

- **Méthode** : `GET`
- **Chemin** : `/users/{userId}`
- **Accès** : Authentifié (propre compte) ou Admin

#### Exemple de Réponse (200 OK)

```json
{
  "success": true,
  "message": "User details retrieved successfully",
  "payload": {
    "id": "a1b2c3d4-e5f6-4g7h-8i9j-k1l2m3n4o5p6",
    "firstName": "Alice",
    "lastName": "Smith",
    "email": "alice.smith@example.com",
    "phone": "+33600000000",
    "address": "10 Rue de Rivoli",
    "city": "Paris",
    "postalCode": "75004",
    "country": "FR",
    "dateOfBirth": "1992-08-24",
    "status": "OK",
    "paymentMethod": {
      "type": "SEPA",
      "iban": "FR76****************1234"
    },
    "createdAt": "2026-01-13T20:00:00Z",
    "updatedAt": "2026-01-13T20:00:00Z"
  }
}
```

### Mettre à jour un utilisateur

Mise à jour des informations personnelles du joueur.

- **Méthode** : `PUT`
- **Chemin** : `/users/{userId}`
- **Accès** : Authentifié (propre compte) ou Admin

_Note : Le champ `status` ne peut pas être modifié via cet endpoint. Utilisez `PATCH /users/{userId}/status` pour modifier le statut (Admin uniquement)._

#### Exemple de requête

```json
{
  "firstName": "Alice",
  "address": "12 Avenue des Champs-Élysées"
}
```

#### Exemple de réponse (200 OK)

```json
{
  "success": true,
  "message": "User updated successfully",
  "payload": {
    "id": "a1b2c3d4-e5f6-4g7h-8i9j-k1l2m3n4o5p6",
    "firstName": "Alice",
    ...
  }
}
```

### Modifier un statut financier/accès

Permet de suspendre ou bloquer un utilisateur (souvent suite à un incident de paiement).

- **Méthode** : `PATCH`
- **Chemin** : `/users/{userId}/status`
- **Accès** : Admin

#### Exemple de requête

```json
{
  "status": "BLOCKED"
}
```

#### Exemple de réponse (200 OK)

```json
{
  "success": true,
  "message": "User status updated successfully",
  "payload": {
    "id": "a1b2c3d4-e5f6-4g7h-8i9j-k1l2m3n4o5p6",
    "firstName": "Alice",
    "lastName": "Smith",
    "email": "alice.smith@example.com",
    "status": "BLOCKED"
  }
}
```

### Suppression logique

Désactive le compte d'un utilisateur sans supprimer les données historiques.

- **Méthode** : `DELETE`
- **Chemin** : `/users/{userId}`
- **Accès** : Admin

#### Exemple de réponse (200 OK)

```json
{
  "success": true,
  "message": "User deleted successfully",
  "payload": null
}
```
