# 🚀 Guide : Émission de Tokens sur XRPL Testnet

Ce guide explique comment émettre des tokens sur XRPL Testnet de bout en bout.

## 📋 Prérequis

1. **Backend en cours d'exécution** : `cd backend && npm run dev`
2. **XRPL_PLATFORM_SEED configuré** dans `.env`
3. **Base de données configurée** avec Prisma

## 🔄 Workflow complet

### Étape 1 : Créer une campagne et l'activer

```bash
# 1. Créer un utilisateur Startup
POST /api/auth/register
{
  "email": "startup@test.com",
  "password": "Password123!",
  "name": "Test Startup",
  "role": "STARTUP"
}

# 2. Se connecter
POST /api/auth/login
{
  "email": "startup@test.com",
  "password": "Password123!"
}

# 3. Créer une campagne
POST /api/campaigns
Authorization: Bearer <STARTUP_TOKEN>
{
  "title": "My Campaign",
  "description": "Description...",
  "goalAmount": 10000,
  "startDate": "2025-11-09T00:00:00.000Z",
  "endDate": "2025-12-09T00:00:00.000Z"
}

# 4. Activer la campagne (changer status de DRAFT à ACTIVE)
PUT /api/campaigns/<CAMPAIGN_ID>
Authorization: Bearer <STARTUP_TOKEN>
{
  "status": "ACTIVE"
}
```

### Étape 2 : Créer un investissement

```bash
# 1. Créer un utilisateur Investor
POST /api/auth/register
{
  "email": "investor@test.com",
  "password": "Password123!",
  "name": "Test Investor",
  "role": "INVESTOR"
}

# 2. Se connecter
POST /api/auth/login
{
  "email": "investor@test.com",
  "password": "Password123!"
}

# 3. Générer un wallet Testnet
POST /api/xrpl/wallet/generate
# Réponse contient : address, seed, publicKey

# 4. Créer un investissement
POST /api/investments/invest
Authorization: Bearer <INVESTOR_TOKEN>
{
  "campaignId": "<CAMPAIGN_ID>",
  "amount": 1000
}
# Réponse contient : investment.id, depositAddress
```

### Étape 3 : Envoyer une transaction XRPL Testnet

**Option A : Utiliser le script Node.js**

```bash
cd backend
node scripts/send-xrpl-payment.js <SEED> <DEPOSIT_ADDRESS> <AMOUNT>
```

**Option B : Utiliser le client XRPL directement**

```javascript
const { Client, Wallet, xrpToDrops } = require('xrpl');

(async () => {
  const client = new Client('wss://s.altnet.rippletest.net:51233');
  await client.connect();
  
  const wallet = Wallet.fromSeed('<SEED>');
  const payment = {
    TransactionType: 'Payment',
    Account: wallet.address,
    Destination: '<DEPOSIT_ADDRESS>',
    Amount: xrpToDrops(1000)
  };
  
  const prepared = await client.autofill(payment);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);
  
  console.log('Transaction Hash:', result.result.hash);
  await client.disconnect();
})();
```

### Étape 4 : Confirmer l'investissement

```bash
POST /api/investments/confirm
Authorization: Bearer <INVESTOR_TOKEN>
{
  "investmentId": "<INVESTMENT_ID>",
  "transactionHash": "<TX_HASH>"
}
```

Cette route :
- ✅ Vérifie la transaction sur XRPL Testnet
- ✅ Vérifie que le montant correspond
- ✅ Vérifie que la destination est correcte
- ✅ Met à jour l'investissement avec le transactionHash
- ✅ Met à jour le montant collecté de la campagne

### Étape 5 : Émettre le token

```bash
POST /api/campaigns/<CAMPAIGN_ID>/issue-token
Authorization: Bearer <STARTUP_TOKEN>
{
  "totalSupply": 1000000,
  "metadata": {
    "name": "My Token",
    "description": "Token description"
  }
}
```

**Conditions requises :**
- ✅ Campagne ACTIVE ou COMPLETED
- ✅ Campagne a des investissements confirmés (avec transactionHash)
- ✅ Vous êtes le propriétaire de la campagne

### Étape 6 : Distribuer les tokens (optionnel)

```bash
POST /api/campaigns/<CAMPAIGN_ID>/distribute-tokens
Authorization: Bearer <STARTUP_TOKEN>
```

**Prérequis :**
- ✅ Token émis
- ✅ Investisseurs ont créé des trustlines pour le token

## 🧪 Script de test automatique

Un script complet est disponible pour tester tout le workflow :

```bash
cd backend
./scripts/test-token-xrpl-testnet.sh
```

Ce script :
1. Crée les utilisateurs (Startup + Investor)
2. Génère un wallet Testnet
3. Crée et active une campagne
4. Crée un investissement
5. Vous guide pour envoyer la transaction XRPL
6. Confirme l'investissement
7. Émet le token

## 📝 Notes importantes

1. **XRPL Testnet** : Utilise `wss://s.altnet.rippletest.net:51233`
2. **Faucet** : Les wallets générés sont automatiquement financés avec 1000 XRP
3. **Frais** : Chaque transaction coûte ~0.000012 XRP en frais
4. **Trustlines** : Les investisseurs doivent créer des trustlines avant de recevoir des tokens
5. **Transaction Hash** : Doit être exactement 64 caractères hexadécimaux

## 🔍 Vérification

```bash
# Vérifier le token émis
GET /api/campaigns/<CAMPAIGN_ID>/token

# Vérifier les investissements
GET /api/investments
Authorization: Bearer <TOKEN>

# Vérifier le solde XRPL
GET /api/xrpl/balance/<ADDRESS>
```

## ❓ Problèmes courants

**Erreur : "Campaign must be ACTIVE or COMPLETED"**
- Solution : Activez la campagne avec `PUT /api/campaigns/<ID>` et `{"status": "ACTIVE"}`

**Erreur : "Campaign must have confirmed investments"**
- Solution : Confirmez l'investissement avec un transactionHash valide

**Erreur : "Transaction not found on XRPL"**
- Solution : Vérifiez que la transaction a été validée (attendez quelques secondes)

**Erreur : "Amount Mismatch"**
- Solution : Le montant de la transaction doit correspondre exactement au montant de l'investissement

