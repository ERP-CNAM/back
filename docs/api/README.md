# Documentation de l'API

Bienvenue dans la documentation détaillée de l'API Gamers ERP. Cette documentation est organisée par domaine métier pour faciliter son exploitation par les consommateurs et les développeurs.

## Domaines Métiers

L'API est divisée en quatre piliers principaux :

### 1. [Authentification](authentification.md)
Gestion des jetons JWT pour les utilisateurs et les administrateurs.

### 2. [Gestion des Utilisateurs](utilisateurs.md)
Inscription des joueurs, consultation des profils et administration des comptes par les équipes de support.

### 3. [Gestion des Abonnements](abonnements.md)
Cycle de vie des abonnements mensuels, de la création à la résiliation.

### 4. [Finance et Opérations](finance-operations.md)
Processus de facturation mensuelle, exports vers les logiciels **MONEY** (Comptabilité) et **BANK** (Banque), rapports de chiffre d'affaires.

---

## Niveaux de Sécurité

Chaque endpoint de l'API appartient à l'un des trois niveaux suivants :

- **Public** : Aucune authentification requise.
- **Authentifié** : Nécessite un jeton JWT valide (Joueur ou Admin).
- **Admin** : Réservé exclusivement aux administrateurs.

---

## Format des Réponses

Toutes les réponses de l'API suivent un format standardisé :

```json
{
  "success": true,
  "message": "Description optionnelle du résultat",
  "payload": {
    "data": "..." 
  }
}
```
