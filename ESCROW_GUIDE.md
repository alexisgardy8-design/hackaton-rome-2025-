# 🔒 Guide des Escrows XRPL - XRise

Guide complet sur le système d'escrow XRPL pour les investissements.

## 📋 Vue d'ensemble

Le système utilise des **escrows XRPL** au lieu de simples paiements pour sécuriser les investissements. Les fonds sont verrouillés dans un escrow jusqu'à ce que la campagne atteigne 100%, puis ils sont automatiquement libérés et envoyés au startup.

## 🔐 Comment ça fonctionne

### 1. Création de l'escrow

Quand un investisseur investit dans une campagne :

1. **Génération d'une condition cryptographique** :
   - Un preimage (secret) de 32 bytes est généré aléatoirement
   - Une condition SHA-256 est créée à partir du preimage
   - Cette condition est utilisée pour verrouiller l'escrow

2. **Création de l'escrow XRPL** :
   - Transaction `EscrowCreate` sur XRPL Testnet
   - Montant verrouillé dans l'escrow
   - Condition cryptographique (Preimage-SHA256)
   - Date `FinishAfter` : 30 jours (date minimum pour libération)

3. **Stockage des données** :
   - Hash de transaction
   - Sequence number de l'escrow
   - Condition (SHA-256 hash)
   - Preimage (secret pour libérer l'escrow)

### 2. Libération automatique

Quand la campagne atteint **100%** :

1. **Détection automatique** :
   - Le backend détecte que `currentAmount >= goalAmount`
   - La campagne passe au statut `FUNDED`

2. **Libération des escrows** :
   - Pour chaque investissement avec escrow :
     - Transaction `EscrowFinish` sur XRPL
     - Utilisation du preimage pour satisfaire la condition
     - Les fonds sont libérés et envoyés au wallet de la plateforme
   - L'investissement est marqué comme `escrowFinished: true`

3. **Résultat** :
   - Tous les fonds sont maintenant disponibles pour le startup
   - Les transactions sont visibles sur XRPL Explorer

## 🛠️ Utilisation

### Frontend (Investisseur)

1. **Connecter le wallet XRPL**
   - Cliquer sur "Connect Wallet" dans la navbar
   - Générer un nouveau wallet ou utiliser un seed existant

2. **Investir dans une campagne**
   - Aller sur la page d'un projet
   - Cliquer sur "Invest Now"
   - Entrer le montant
   - Un escrow XRPL est créé automatiquement
   - Le hash de transaction et le preimage sont affichés

3. **Voir la transaction**
   - Cliquer sur "View on XRPL Explorer"
   - Voir l'escrow sur https://testnet.xrpl.org/

### Backend (Automatique)

La libération des escrows se fait automatiquement quand :
- Un investissement est confirmé
- La campagne atteint 100%
- Le backend détecte le changement et libère tous les escrows

### API Endpoints

#### Libérer les escrows d'une campagne
```bash
POST /api/escrows/release/:campaignId
Authorization: Bearer <STARTUP_TOKEN>
```

#### Vérifier et libérer tous les escrows
```bash
POST /api/escrows/check-and-release
Authorization: Bearer <TOKEN>
```

## 📊 Structure des données

### Investment Model (Prisma)

```prisma
model Investment {
  id              String
  amount          Decimal
  transactionHash String?  // Hash de l'EscrowCreate
  escrowSequence  Int?     // Sequence number de l'escrow
  escrowCondition String? // Condition SHA-256
  escrowPreimage  String?  // Preimage (secret)
  escrowFinished  Boolean  // Si l'escrow a été libéré
  finishedAt      DateTime? // Date de libération
  // ...
}
```

### Escrow XRPL

- **TransactionType**: `EscrowCreate`
- **Account**: Adresse de l'investisseur
- **Destination**: Adresse de la plateforme
- **Amount**: Montant en drops (1 XRP = 1,000,000 drops)
- **Condition**: Hash SHA-256 du preimage
- **FinishAfter**: Date Unix (seconds) - minimum 30 jours

## 🔄 Workflow complet

```
1. Investisseur → Crée escrow XRPL avec condition
   ↓
2. Backend → Vérifie l'escrow et enregistre l'investissement
   ↓
3. Backend → Met à jour currentAmount de la campagne
   ↓
4. Backend → Vérifie si currentAmount >= goalAmount
   ↓
5. Si 100% → Backend libère tous les escrows automatiquement
   ↓
6. Fonds → Envoyés au wallet de la plateforme
   ↓
7. Startup → Reçoit les fonds
```

## 🎯 Points importants

### Sécurité

- ✅ Les fonds sont verrouillés dans l'escrow XRPL
- ✅ Impossible de libérer sans le preimage
- ✅ Condition cryptographique SHA-256
- ✅ Date minimum (FinishAfter) pour protection

### Automatisation

- ✅ Détection automatique quand 100% est atteint
- ✅ Libération automatique de tous les escrows
- ✅ Mise à jour automatique du statut de campagne
- ✅ Script de vérification périodique disponible

### Transparence

- ✅ Toutes les transactions sont sur XRPL Explorer
- ✅ Hash de transaction visible
- ✅ Condition et preimage stockés (pour libération)
- ✅ Statut de l'escrow traçable

## 📝 Scripts disponibles

### Libération automatique
```bash
# Libérer les escrows pour toutes les campagnes à 100%
node backend/scripts/release-escrows.js
```

### Vérification manuelle
```bash
# Via API
curl -X POST http://localhost:3000/api/escrows/check-and-release \
  -H "Authorization: Bearer <TOKEN>"
```

## 🔗 Ressources

- **XRPL Explorer**: https://testnet.xrpl.org/
- **Documentation XRPL Escrow**: https://xrpl.org/escrow.html
- **Preimage-SHA256 Condition**: https://xrpl.org/escrowcreate.html#escrowcreate-fields

## ⚠️ Notes importantes

1. **Preimage** : Le preimage doit être stocké en toute sécurité car il est nécessaire pour libérer l'escrow
2. **FinishAfter** : Les fonds peuvent être libérés après cette date même sans le preimage
3. **Testnet** : Actuellement sur XRPL Testnet pour la démo
4. **Production** : En production, utiliser XRPL Mainnet avec les vraies adresses

## 🎬 Pour la démo

1. Connecter un wallet XRPL
2. Investir dans une campagne
3. Voir l'escrow créé sur XRPL Explorer
4. Attendre que la campagne atteigne 100%
5. Les escrows sont libérés automatiquement
6. Voir les transactions EscrowFinish sur XRPL Explorer

---

**Le système d'escrow garantit que les fonds sont sécurisés jusqu'à ce que la campagne atteigne son objectif ! 🔒**

