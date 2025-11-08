# 🎬 Démo XRPL Testnet - Connexion Wallet & Tokenisation

Guide pratique pour démontrer la connexion d'un wallet XRPL Testnet et la tokenisation.

## 🚀 Démarrage rapide

### 1. Démarrer le backend
```bash
cd hackaton-rome-2025-/backend
npm run dev
```

### 2. Préparer les données de test
```bash
cd scripts
./demo-setup.sh
```

## 🎯 Démo : Connexion Wallet & Tokenisation (5-7 minutes)

### Étape 1 : Générer un wallet XRPL Testnet (1 min)

**Via l'API :**
```bash
curl -X POST http://localhost:3000/api/xrpl/wallet/generate \
  -H "Content-Type: application/json" \
  -d "{}"
```

**Résultat :**
```json
{
  "message": "Testnet wallet created and funded successfully",
  "wallet": {
    "address": "rN8X3Z5V1R3W6nSGzS4LJesXorLaNFzF9c",
    "seed": "sEdVKpyNGBtp1QANFazhX33G7BmriyJ",
    "publicKey": "EDA55B0AC611722F821A4C7D9BA371290F2DDA6D756CFDB66F13565B4261CEB16E"
  },
  "warning": "⚠️ Store the seed securely!",
  "faucet": "Wallet has been funded with 1000 XRP from Testnet faucet"
}
```

**À dire :**
> "Je génère un wallet XRPL Testnet qui est automatiquement financé avec 1000 XRP depuis le faucet Testnet."

### Étape 2 : Vérifier le wallet sur XRPL Explorer (1 min)

**Ouvrir dans le navigateur :**
```
https://testnet.xrpl.org/accounts/rN8X3Z5V1R3W6nSGzS4LJesXorLaNFzF9c
```

**À montrer :**
- Le solde du wallet (1000 XRP)
- L'historique des transactions
- Les détails du compte

**À dire :**
> "Le wallet est visible sur XRPL Explorer, démontrant la transparence de la blockchain."

### Étape 3 : Créer une campagne et investir (2 min)

**3.1 Créer une campagne (Startup)**
```bash
# Se connecter en tant que Startup
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo-startup@test.com","password":"Demo123!"}'

# Créer une campagne
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <STARTUP_TOKEN>" \
  -d '{
    "title": "Projet Tokenisé - Démo XRPL",
    "description": "Démonstration de tokenisation sur XRPL Testnet",
    "goalAmount": 10000,
    "startDate": "2025-11-09T00:00:00.000Z",
    "endDate": "2025-12-09T00:00:00.000Z"
  }'

# Activer la campagne
curl -X PUT http://localhost:3000/api/campaigns/<CAMPAIGN_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <STARTUP_TOKEN>" \
  -d '{"status": "ACTIVE"}'
```

**3.2 Investir avec le wallet XRPL**
```bash
# Créer un investissement
curl -X POST http://localhost:3000/api/investments/invest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <INVESTOR_TOKEN>" \
  -d '{
    "campaignId": "<CAMPAIGN_ID>",
    "amount": 1000
  }'

# Envoyer une transaction XRPL Testnet
cd backend
node scripts/send-xrpl-payment.js <WALLET_SEED> <DEPOSIT_ADDRESS> 1000

# Confirmer l'investissement avec le transaction hash
curl -X POST http://localhost:3000/api/investments/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <INVESTOR_TOKEN>" \
  -d '{
    "investmentId": "<INVESTMENT_ID>",
    "transactionHash": "<TX_HASH>"
  }'
```

**À dire :**
> "Un investisseur utilise son wallet XRPL pour investir. La transaction est envoyée sur XRPL Testnet et vérifiée automatiquement par notre système."

### Étape 4 : TOKENISER - Émettre un token XRPL (2 min) ⭐ POINT CLÉ

**4.1 Émettre le token**
```bash
curl -X POST http://localhost:3000/api/campaigns/<CAMPAIGN_ID>/issue-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <STARTUP_TOKEN>" \
  -d '{
    "totalSupply": 1000000,
    "metadata": {
      "name": "Demo Token",
      "description": "Token émis pour la démo XRPL Hackathon",
      "campaignTitle": "Projet Tokenisé - Démo XRPL"
    }
  }'
```

**Résultat :**
```json
{
  "message": "Token issued successfully",
  "token": {
    "id": "...",
    "symbol": "53444D4F546F6B656E...",
    "issuerAddress": "rG31cLyErnqeVj2eomEjBZtq7PYaupGYzL",
    "totalSupply": "1000000",
    "status": "ISSUED"
  },
  "instructions": {
    "nextStep": "Investors must create trustlines before token distribution",
    "trustlineRequired": true
  }
}
```

**4.2 Vérifier le token sur XRPL Explorer**

**Ouvrir :**
```
https://testnet.xrpl.org/accounts/rG31cLyErnqeVj2eomEjBZtq7PYaupGYzL
```

**À montrer :**
- Le token émis dans le compte de l'émetteur
- Les détails du token (symbol, issuer)
- L'historique des transactions

**À dire :**
> "Le token est maintenant émis sur XRPL Testnet ! Vous pouvez le voir sur XRPL Explorer, prouvant que la tokenisation fonctionne réellement sur la blockchain."

### Étape 5 : Distribuer les tokens (1 min)

**5.1 Créer une trustline (Investor)**
```bash
# L'investisseur doit créer une trustline pour recevoir le token
# Cela se fait via XRPL directement ou via notre API
```

**5.2 Distribuer les tokens**
```bash
curl -X POST http://localhost:3000/api/campaigns/<CAMPAIGN_ID>/distribute-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <STARTUP_TOKEN>"
```

**À dire :**
> "Les tokens sont distribués aux investisseurs via des transactions XRPL. Chaque investisseur reçoit des tokens proportionnels à son investissement."

## 🎤 Script de présentation

### Introduction (30 sec)
> "Bonjour ! Je vais vous montrer comment notre plateforme utilise XRPL Testnet pour tokeniser des projets de crowdfunding. Vous verrez des transactions réelles sur la blockchain."

### Démo (5 min)
> "1. Je génère un wallet XRPL Testnet qui est automatiquement financé.
> 2. Je crée une campagne de crowdfunding.
> 3. Un investisseur investit avec une transaction XRPL réelle.
> 4. **POINT CLÉ** : Je tokenise la campagne en émettant un token personnalisé sur XRPL.
> 5. Le token est visible sur XRPL Explorer, prouvant l'intégration blockchain réelle."

### Conclusion (30 sec)
> "Notre plateforme démontre une intégration complète avec XRPL : transactions vérifiées, émission de tokens, et transparence blockchain totale."

## 📋 Checklist pour la démo

### Avant
- [ ] Backend démarré (`npm run dev`)
- [ ] Script de préparation exécuté (`./demo-setup.sh`)
- [ ] XRPL Explorer ouvert (https://testnet.xrpl.org/)
- [ ] Terminal prêt pour les commandes
- [ ] Wallet Testnet généré

### Pendant
- [ ] Générer un wallet XRPL
- [ ] Montrer le wallet sur XRPL Explorer
- [ ] Créer une campagne
- [ ] Faire un investissement avec transaction XRPL
- [ ] **ÉMETTRE UN TOKEN** ⭐
- [ ] Vérifier le token sur XRPL Explorer
- [ ] Distribuer les tokens

## 🎯 Points clés à mettre en avant

1. **Wallet XRPL réel** : Pas une simulation, vrai wallet Testnet
2. **Transaction vérifiée** : Transaction XRPL visible sur Explorer
3. **Tokenisation réelle** : Token émis sur la blockchain XRPL
4. **Transparence** : Tout est vérifiable publiquement
5. **Intégration complète** : Backend + Frontend + Blockchain

## 🔗 URLs importantes

- **XRPL Explorer**: https://testnet.xrpl.org/
- **XRPL Testnet Faucet**: https://xrpl.org/xrp-testnet-faucet.html
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 💡 Conseils pour la démo

1. **Testez avant** : Vérifiez que tout fonctionne
2. **Ayez un backup** : Screenshots ou vidéo de secours
3. **Soyez clair** : Expliquez chaque étape
4. **Montrez XRPL Explorer** : C'est la preuve que ça marche vraiment
5. **Restez calme** : Si quelque chose ne marche pas, expliquez le concept

## 🚨 En cas de problème

### Wallet non financé
- Utiliser le faucet : https://xrpl.org/xrp-testnet-faucet.html
- Ou générer un nouveau wallet via l'API

### Transaction échoue
- Vérifier le solde du wallet
- Attendre quelques secondes pour la validation
- Vérifier la connexion XRPL Testnet

### Token non visible
- Attendre quelques secondes
- Vérifier le symbol du token
- Vérifier l'adresse de l'émetteur

---

**Bonne démo ! 🚀**

