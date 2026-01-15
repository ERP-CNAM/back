# Finance et Opérations

Cette section décrit les fonctions critiques liées à la facturation, aux exports vers les systèmes tiers et aux rapports financiers.

_Note : Tous les endpoints de cette section nécessitent un token **Administrateur**._

---

## Facturation Mensuelle

Déclenche la génération des factures pour tous les abonnements actifs. Cette opération doit être effectuée une fois par mois.

- **Méthode** : `POST`
- **Chemin** : `/billing/monthly`
- **Accès** : Admin

### Exemple de Requête

```json
{
  "billingDate": "2026-06-30"
}
```

### Exemple de Réponse (200 OK)

```json
{
  "success": true,
  "message": "Generated 3 invoices successfully",
  "payload": {
    "billingDate": "2026-06-30",
    "invoices": [
      {
        "id": "inv-001",
        "invoiceRef": "INV-2026-06-C001",
        "subscriptionId": "sub-uuid-123",
        "userId": "user-uuid-456",
        "amountExclVat": 19.99,
        "vatAmount": 4.0,
        "amountInclVat": 23.99,
        "status": "PENDING"
      }
    ]
  }
}
```

---

## Liste des Factures

Récupère toutes les factures avec filtres optionnels.

- **Méthode** : `GET`
- **Chemin** : `/invoices`
- **Accès** : Admin
- **Paramètres (Query)** :
  - `userId` : Filtrer par utilisateur.
  - `subscriptionId` : Filtrer par abonnement.
  - `status` : Filtrer par statut (`PENDING`, `SENT`, `PAID`, `FAILED`).

### Exemple de Réponse (200 OK)

```json
{
  "success": true,
  "message": "Invoices retrieved successfully",
  "payload": [
    {
      "id": "inv-001",
      "invoiceRef": "INV-2026-06-C001",
      "subscriptionId": "sub-uuid-123",
      "userId": "user-uuid-456",
      "billingDate": "2026-06-30",
      "periodStart": "2026-06-01",
      "periodEnd": "2026-06-30",
      "amountExclVat": 19.99,
      "vatAmount": 4.0,
      "amountInclVat": 23.99,
      "status": "PAID",
      "subscription": {
        "contractCode": "GAMER_GOLD_2026",
        "user": {
          "firstName": "Alice",
          "lastName": "Smith"
        }
      }
    }
  ]
}
```

---

## Exports Tiers

### Logiciel MONEY (Comptabilité)

Génère un fichier d'écritures comptables pour le groupe Money.

- **Méthode** : `GET`
- **Chemin** : `/exports/accounting/monthly-invoices`
- **Accès** : Admin
- **Paramètre (Query)** : `billingMonth` (Format: YYYY-MM, ex: `2026-06`)

#### Exemple de Réponse (200 OK)

```json
{
  "success": true,
  "message": "Export generated for 2026-06",
  "payload": [
    {
      "date": "2026-06-30",
      "generalAccount": "411",
      "clientAccount": "AUX_SMITH",
      "invoiceRef": "INV-2026-06-C001",
      "description": "Facturation abonnement mensuel - Alice Smith",
      "debit": 23.99,
      "credit": null,
      "customerName": "Alice Smith"
    },
    {
      "date": "2026-06-30",
      "generalAccount": "700",
      "clientAccount": null,
      "invoiceRef": "INV-2026-06-C001",
      "description": "Prestation de service HT",
      "debit": null,
      "credit": 19.99,
      "customerName": "Alice Smith"
    },
    {
      "date": "2026-06-30",
      "generalAccount": "445",
      "clientAccount": null,
      "invoiceRef": "INV-2026-06-C001",
      "description": "TVA collectée 20%",
      "debit": null,
      "credit": 4.0,
      "customerName": "Alice Smith"
    }
  ]
}
```

### Logiciel BANK (Banque)

Génère la liste des ordres de prélèvement pour le groupe Bank.

- **Méthode** : `GET`
- **Chemin** : `/exports/banking/direct-debits`
- **Accès** : Admin
- **Paramètre (Query)** : `executionDate` (Format: YYYY-MM-DD, ex: `2026-07-01`)

#### Exemple de Réponse (200 OK)

```json
{
  "success": true,
  "message": "Generated 2 direct debit orders for execution on 2026-07-01",
  "payload": [
    {
      "id": "dd-001",
      "invoiceId": "inv-001",
      "userId": "user-uuid-456",
      "executionDate": "2026-07-01",
      "amount": 23.99,
      "status": "TO_SEND",
      "paymentMethod": "SEPA"
    },
    {
      "id": "dd-002",
      "invoiceId": "inv-002",
      "userId": "user-uuid-789",
      "executionDate": "2026-07-01",
      "amount": 19.99,
      "status": "TO_SEND",
      "paymentMethod": "CARD"
    }
  ]
}
```

---

## Webhook Banque (Retour de Paiement)

Permet à la banque de notifier le système du succès ou du rejet des prélèvements.

- **Méthode** : `POST`
- **Chemin** : `/bank/payment-updates`
- **Accès** : Admin (IP filtrée ou signature secret dans un scénario réel)

### Exemple de Requête

```json
[
  {
    "invoiceId": "inv-001",
    "status": "EXECUTED"
  },
  {
    "invoiceId": "inv-002",
    "status": "REJECTED",
    "rejectionReason": "Solde insuffisant"
  }
]
```

### Exemple de Réponse (200 OK)

```json
{
  "success": true,
  "message": "Payment statuses updated",
  "payload": {
    "updatedCount": 2
  }
}
```

---

## Rapports

### Chiffre d'Affaires Mensuel

Récupère le CA (HT, TVA, TTC) agrégé par mois.

- **Méthode** : `GET`
- **Chemin** : `/reports/revenue/monthly`
- **Accès** : Admin
- **Paramètres (Query)** :
  - `from` : Mois de début (YYYY-MM).
  - `to` : Mois de fin (YYYY-MM).

### Exemple de Réponse (200 OK)

```json
{
  "success": true,
  "message": "Revenue report generated from 2026-01 to 2026-06",
  "payload": [
    {
      "month": "2026-01",
      "revenueExclVat": 500.0,
      "vatAmount": 100.0,
      "revenueInclVat": 600.0
    },
    {
      "month": "2026-02",
      "revenueExclVat": 750.0,
      "vatAmount": 150.0,
      "revenueInclVat": 900.0
    },
    {
      "month": "2026-06",
      "revenueExclVat": 1000.0,
      "vatAmount": 200.0,
      "revenueInclVat": 1200.0
    }
  ]
}
```
