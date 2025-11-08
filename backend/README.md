# Backend - Hackathon Rome 2025

Backend API pour la plateforme de crowdfunding avec authentification JWT et intégration XRPL.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ et npm
- PostgreSQL (ou compte Supabase)
- Git

### Installation

1. **Installer les dépendances** :
```bash
cd backend
npm install
```

2. **Configurer les variables d'environnement** :
```bash
cp .env.example .env
```

Puis éditez `.env` avec vos valeurs :
```env
DATABASE_URL="postgresql://user:password@localhost:5432/hackathon_rome"
JWT_SECRET="your-super-secret-jwt-key-change-this"
XRPL_SERVER="wss://s.altnet.rippletest.net:51233"
PORT=3000
NODE_ENV=development
```

3. **Initialiser la base de données** :
```bash
# Générer le client Prisma
npm run prisma:generate

# Créer la base de données et appliquer les migrations
npm run migrate

# (Optionnel) Seed la base avec des données de test
npm run db:seed
```

4. **Démarrer le serveur de développement** :
```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

## 📋 Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Démarre le serveur en mode développement avec auto-reload |
| `npm start` | Démarre le serveur en mode production |
| `npm run migrate` | Crée et applique une nouvelle migration Prisma |
| `npm run migrate:prod` | Applique les migrations en production |
| `npm run prisma:generate` | Génère le client Prisma |
| `npm run prisma:studio` | Ouvre Prisma Studio (interface visuelle de la DB) |
| `npm run db:push` | Synchronise le schéma Prisma avec la DB sans migration |
| `npm run db:seed` | Remplit la DB avec des données de test |

## 🔑 Endpoints API

### Authentification

#### POST /api/auth/register
Créer un nouveau compte utilisateur.

**Body** :
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "role": "INVESTOR"
}
```

**Response** (201) :
```json
{
  "message": "User created successfully",
  "user": {
    "id": "cm123...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "INVESTOR"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /api/auth/login
Se connecter avec un compte existant.

**Body** :
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200) :
```json
{
  "message": "Login successful",
  "user": {
    "id": "cm123...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "INVESTOR"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### GET /api/auth/me
Récupérer le profil de l'utilisateur connecté (protégé).

**Headers** : `Authorization: Bearer <token>`

**Response** (200) :
```json
{
  "user": {
    "id": "cm123...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "INVESTOR"
  }
}
```

---

### Campaigns

#### POST /api/campaigns
Créer une nouvelle campagne (STARTUP uniquement).

**Headers** : `Authorization: Bearer <startup_token>`

**Body** :
```json
{
  "title": "Revolutionary AI Platform",
  "description": "Building the next generation of AI solutions...",
  "goalAmount": 50000,
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-04-01T00:00:00Z",
  "imageUrl": "https://example.com/image.jpg"
}
```

**Response** (201) :
```json
{
  "message": "Campaign created successfully",
  "campaign": {
    "id": "cm456...",
    "title": "Revolutionary AI Platform",
    "status": "DRAFT",
    "goalAmount": 50000,
    "currentAmount": 0,
    ...
  }
}
```

#### GET /api/campaigns
Récupérer toutes les campagnes (public).

**Query params** :
- `status` : Filtrer par statut (DRAFT, ACTIVE, COMPLETED, CANCELLED)
- `limit` : Nombre de résultats (défaut: 20)
- `offset` : Pagination (défaut: 0)

**Response** (200) :
```json
{
  "campaigns": [...],
  "pagination": {
    "total": 42,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### GET /api/campaigns/:id
Récupérer une campagne par ID (public).

**Response** (200) :
```json
{
  "campaign": {
    "id": "cm456...",
    "title": "Revolutionary AI Platform",
    "creator": {...},
    "investments": [...],
    "_count": { "investments": 5 }
  }
}
```

#### PUT /api/campaigns/:id
Mettre à jour une campagne (propriétaire uniquement).

**Headers** : `Authorization: Bearer <startup_token>`

**Body** (tous les champs optionnels) :
```json
{
  "title": "Updated Title",
  "status": "ACTIVE"
}
```

#### DELETE /api/campaigns/:id
Supprimer une campagne (propriétaire uniquement, sans investissements).

**Headers** : `Authorization: Bearer <startup_token>`

---

### Investments

#### POST /api/investments/invest
Créer une intention d'investissement (INVESTOR uniquement).

**Headers** : `Authorization: Bearer <investor_token>`

**Body** :
```json
{
  "campaignId": "cm456...",
  "amount": 1000
}
```

**Response** (201) :
```json
{
  "message": "Investment intent created successfully",
  "investment": {
    "id": "cm789...",
    "amount": 1000,
    "campaign": {...}
  },
  "depositAddress": "rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY",
  "instructions": {
    "step1": "Send exactly the investment amount to the deposit address",
    "step2": "Copy the transaction hash from XRPL",
    "step3": "Call POST /api/investments/confirm with the transaction hash"
  }
}
```

#### POST /api/investments/confirm
Confirmer un investissement avec le hash de transaction XRPL (INVESTOR uniquement).

**Headers** : `Authorization: Bearer <investor_token>`

**Body** :
```json
{
  "investmentId": "cm789...",
  "transactionHash": "0123456789ABCDEF..."
}
```

**Response** (200) :
```json
{
  "message": "Investment confirmed successfully",
  "investment": {
    "id": "cm789...",
    "transactionHash": "0123..."
  },
  "campaign": {
    "currentAmount": 1000,
    "goalAmount": 50000,
    "percentageFunded": "2.00"
  }
}
```

#### GET /api/investments
Récupérer mes investissements (protégé).

**Headers** : `Authorization: Bearer <investor_token>`

**Response** (200) :
```json
{
  "investments": [...],
  "summary": {
    "totalInvestments": 5,
    "totalInvested": "5000.00",
    "confirmedInvestments": 4,
    "pendingInvestments": 1
  }
}
```

#### GET /api/investments/:id
Récupérer un investissement par ID (investisseur ou créateur de campagne).

**Headers** : `Authorization: Bearer <token>`

---

### Tests complets

Voir le fichier [TEST_PHASE2.md](./TEST_PHASE2.md) pour des exemples complets de tests avec cURL.

## 🗄️ Modèle de données (Prisma)

### User
- `id` : Identifiant unique
- `email` : Email (unique)
- `password` : Hash du mot de passe
- `name` : Nom complet
- `role` : "startup" ou "investor"
- `walletAddress` : Adresse XRPL (optionnel)
- `createdAt`, `updatedAt`

### Campaign
- `id` : Identifiant unique
- `title` : Titre de la campagne
- `description` : Description
- `goalAmount` : Montant objectif
- `currentAmount` : Montant actuel collecté
- `startDate`, `endDate` : Dates de début et fin
- `status` : "draft", "active", "completed", "cancelled"
- `creatorId` : Référence vers User

### Investment
- `id` : Identifiant unique
- `amount` : Montant investi
- `investorId` : Référence vers User
- `campaignId` : Référence vers Campaign
- `transactionHash` : Hash XRPL
- `createdAt`

### Dividend
- `id` : Identifiant unique
- `amount` : Montant du dividende
- `campaignId` : Référence vers Campaign
- `distributionDate` : Date de distribution
- `status` : "pending", "distributed"

## 🧪 Tests locaux

### Avec Postman

1. Importez la collection Postman (à venir)
2. Testez les endpoints d'authentification
3. Vérifiez les tokens JWT

### Avec Thunder Client (VS Code)

1. Installez l'extension Thunder Client
2. Créez une nouvelle requête
3. Testez les endpoints

## 🔒 Sécurité

- Les mots de passe sont hashés avec **bcrypt** (10 rounds)
- L'authentification utilise des **JWT** avec expiration
- Les secrets doivent être forts et uniques (jamais dans Git)
- CORS configuré pour les domaines autorisés uniquement

## 📁 Structure du projet

```
backend/
├── src/
│   ├── controllers/       # Logique métier des routes
│   │   ├── authController.js
│   │   ├── campaignController.js
│   │   ├── investmentController.js
│   │   └── xrplController.js      # NEW: XRPL debug endpoints
│   ├── lib/                       # NEW: XRPL integration
│   │   └── xrplClient.js          # XRPL utilities
│   ├── middleware/        # Middlewares Express
│   │   ├── auth.js       # Vérification JWT
│   │   └── errorHandler.js
│   ├── routes/           # Définition des routes
│   │   ├── authRoutes.js
│   │   ├── campaignRoutes.js
│   │   ├── investmentRoutes.js
│   │   └── xrplRoutes.js         # NEW: XRPL debug routes
│   ├── utils/            # Fonctions utilitaires
│   │   └── jwt.js
│   └── server.js         # Point d'entrée
├── prisma/
│   ├── schema.prisma     # Schéma de la base de données
│   └── seed.js           # Données de test
├── .env.example          # Template des variables d'env
├── .gitignore
├── README.md             # Ce fichier
├── QUICKSTART.md         # Guide de démarrage rapide
├── TEST_PHASE2.md        # Tests de la Phase 2
└── XRPL_TESTNET.md       # NEW: Guide XRPL Testnet integration
```

## 🔗 Intégration XRPL (Phase 3)

Cette plateforme utilise le **XRPL Testnet** pour vérifier les transactions d'investissement en temps réel.

### Nouveaux Endpoints XRPL

#### GET /api/xrpl/tx/:hash
Vérifier les détails d'une transaction sur le Testnet.

**Exemple** :
```bash
curl http://localhost:3000/api/xrpl/tx/E3D9E4F14B6C8F5E7A1B8C9D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6A7B8C9D0E1F
```

**Response** :
```json
{
  "message": "Transaction found",
  "transaction": {
    "hash": "E3D9E4F14B6C8F5E...",
    "validated": true,
    "success": true,
    "result": "tesSUCCESS",
    "transactionType": "Payment",
    "account": "rN7n7otQDd6FczFgLdhmKRAWjESrzVXqXw",
    "destination": "rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY",
    "amount": "100",
    "ledgerIndex": 12345678
  }
}
```

#### GET /api/xrpl/balance/:address
Vérifier le solde XRP d'une adresse.

**Exemple** :
```bash
curl http://localhost:3000/api/xrpl/balance/rN7n7otQDd6FczFgLdhmKRAWjESrzVXqXw
```

#### POST /api/xrpl/wallet/generate
Générer un nouveau wallet Testnet avec 1000 XRP de faucet.

**⚠️ À retirer en production !**

### Workflow d'investissement avec XRPL

1. **L'investisseur crée une intention** → `POST /api/investments/intent`
2. **L'investisseur envoie XRP** vers l'adresse de la plateforme (Testnet)
3. **L'investisseur confirme avec le hash** → `POST /api/investments/confirm`
4. **Le backend vérifie sur XRPL** :
   - Transaction validée
   - Résultat = `tesSUCCESS`
   - Destination = wallet de la plateforme
   - Montant correspond à l'investissement (±0.01 XRP)
5. **Si OK** → Investissement confirmé, montant ajouté à la campagne

### Documentation complète

Consultez [XRPL_TESTNET.md](./XRPL_TESTNET.md) pour :
- Guide de configuration du Testnet
- Comment obtenir des XRP de test
- Tests end-to-end complets
- Résolution des problèmes courants
- Checklist avant production

### Variables d'environnement XRPL

```env
# XRPL Testnet server
XRPL_SERVER="wss://s.altnet.rippletest.net:51233"

# Platform wallet seed (généré via faucet ou API)
XRPL_PLATFORM_SEED="sEdTM1uX8pu2do5XvTnutH6HsouMaM2"

# Platform wallet address
PLATFORM_WALLET_ADDRESS="rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY"
```

**⚠️ Ne jamais commit les seeds réels !**

---

## 🐛 Troubleshooting

### Erreur : "Can't reach database server"
- Vérifiez que PostgreSQL est démarré
- Vérifiez votre `DATABASE_URL` dans `.env`

### Erreur : "Prisma Client not generated"
```bash
npm run prisma:generate
```

### Erreur de migration
```bash
# Reset la base de données (⚠️ perte de données)
npx prisma migrate reset
```

## 📝 Notes de développement

- Utilisez les branches feature selon les conventions (voir CONTRIBUTING.md)
- Testez toujours localement avant de pousser
- Mettez à jour ce README si vous ajoutez des endpoints

## 🚢 Déploiement

Instructions de déploiement à venir (Render, Railway, ou autre).

---

**Happy coding! 🚀**
