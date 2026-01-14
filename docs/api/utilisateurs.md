# Gestion des Utilisateurs

Cette section détaille les opérations relatives aux comptes utilisateurs (joueurs).

## Inscription

Création d'un nouveau compte joueur. Cet endpoint est généralement appelé lors d'une inscription sur la plateforme Gamers.

- **Méthode** : `POST`
- **Chemin** : `/users`
- **Accès** : Public

### Exemple de Requête

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

### Exemple de Réponse (201 Created)

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

### Consulter un utilisateur

Détails complets d'un joueur par son ID.

- **Méthode** : `GET`
- **Chemin** : `/users/{userId}`
- **Accès** : Admin

### Modifier un statut financier/accès

Permet de suspendre ou bloquer un utilisateur (souvent suite à un incident de paiement).

- **Méthode** : `PATCH`
- **Chemin** : `/users/{userId}/status`
- **Accès** : Admin

**Exemple de Requête :**

```json
{
  "status": "BLOCKED"
}
```

### Suppression Logique

Désactive le compte d'un utilisateur sans supprimer les données historiques.

- **Méthode** : `DELETE`
- **Chemin** : `/users/{userId}`
- **Accès** : Admin
