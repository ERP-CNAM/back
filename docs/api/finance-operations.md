# Finance et Opérations

Cette section décrit les fonctions critiques liées à la facturation, aux exports vers les systèmes tiers et aux rapports financiers.

*Note : Tous les endpoints de cette section nécessitent un token **Administrateur**.*

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
  "message": "Factures générées",
  "payload": {
    "billingDate": "2026-06-30",
    "invoices": [
      {
        "id": "inv-001",
        "invoiceRef": "FAC-2026-06-001",
        "amountInclVat": 19.99,
        "status": "PENDING"
      }
    ]
  }
}
```

## Exports Tiers

### Logiciel MONEY (Comptabilité)
Génère un fichier d'écritures comptables pour le groupe Money.

- **Méthode** : `GET`
- **Chemin** : `/exports/accounting/monthly-invoices`
- **Accès** : Admin
- **Paramètre (Query)** : `billingMonth` (Format: YYYY-MM, ex: `2026-06`)

### Logiciel BANK (Banque)
Génère la liste des ordres de prélèvement pour le groupe Bank.

- **Méthode** : `GET`
- **Chemin** : `/exports/banking/direct-debits`
- **Accès** : Admin
- **Paramètre (Query)** : `executionDate` (Format: YYYY-MM-DD, ex: `2026-07-01`)

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

## Rapports

### Chiffre d'Affaires Mensuel
Récupère le CA (HT, TVA, TTC) agrégé par mois.

- **Méthode** : `GET`
- **Chemin** : `/reports/revenue/monthly`
- **Accès** : Admin
- **Paramètres (Query)** :
    - `from` : Mois de début (YYYY-MM).
    - `to` : Mois de fin (YYYY-MM).

### Exemple de Réponse
```json
{
  "success": true,
  "payload": [
    {
      "month": "2026-06",
      "revenueExclVat": 1000.00,
      "vatAmount": 200.00,
      "revenueInclVat": 1200.00
    }
  ]
}
```
