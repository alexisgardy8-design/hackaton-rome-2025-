# ✅ Checklist de Démonstration

## 📋 Avant la démo

### Environnement
- [ ] Backend démarré (`cd backend && npm run dev`)
- [ ] Frontend User démarré (`cd frontend-user && npm run dev`)
- [ ] Frontend Startup démarré (`cd frontend-startuper && npm run dev`)
- [ ] Base de données configurée et migrée
- [ ] Variables d'environnement configurées (.env)
- [ ] XRPL_PLATFORM_SEED configuré

### Données de test
- [ ] Script de préparation exécuté (`./scripts/demo-setup.sh`)
- [ ] Comptes de démo créés (Startup + Investor)
- [ ] Campagne de démo créée et activée
- [ ] Wallet Testnet généré

### Vérifications
- [ ] Health check backend OK (`curl http://localhost:3000/health`)
- [ ] Frontends accessibles
- [ ] Connexion XRPL Testnet active
- [ ] Scripts de test fonctionnels

## 🎬 Pendant la démo

### Introduction (2 min)
- [ ] Présenter le concept
- [ ] Expliquer l'architecture
- [ ] Montrer la stack technologique

### Interface Utilisateur (5 min)
- [ ] Montrer le frontend User
- [ ] Montrer le frontend Startup
- [ ] Expliquer le design

### Fonctionnalités Backend (5 min)
- [ ] Authentification
- [ ] Création de campagne
- [ ] Système d'investissement

### Intégration XRPL (5 min)
- [ ] Générer un wallet
- [ ] Faire une transaction XRPL
- [ ] Émettre un token
- [ ] Vérifier sur XRPL Explorer

### Démo Live (3 min)
- [ ] Créer une campagne en direct
- [ ] Faire un investissement
- [ ] Émettre un token
- [ ] Montrer la transaction sur XRPL Explorer

## 📝 Points à mentionner

### Technique
- [ ] Architecture modulaire
- [ ] Sécurité (JWT, rate limiting)
- [ ] Validation des données
- [ ] Gestion d'erreurs

### Blockchain
- [ ] Transactions XRPL réelles
- [ ] Émission de tokens
- [ ] Distribution automatique
- [ ] Transparence blockchain

### Business
- [ ] Cas d'usage
- [ ] Avantages vs crowdfunding traditionnel
- [ ] Scalabilité
- [ ] Coûts

## 🎯 Après la démo

- [ ] Répondre aux questions
- [ ] Montrer le code source
- [ ] Expliquer l'architecture détaillée
- [ ] Discuter des améliorations futures
- [ ] Partager les ressources (GitHub, docs)

## 🚨 En cas de problème

### Backend ne démarre pas
```bash
# Vérifier le port 3000
lsof -ti:3000 | xargs kill -9

# Vérifier la base de données
cd backend && npm run prisma:generate
cd backend && npm run migrate
```

### Frontend ne démarre pas
```bash
# Vérifier les ports
lsof -ti:8080,8081 | xargs kill -9

# Réinstaller les dépendances
cd frontend-user && npm install
cd frontend-startuper && npm install
```

### Transaction XRPL échoue
- Vérifier la connexion XRPL Testnet
- Vérifier le solde du wallet
- Vérifier les frais de transaction

## 📚 Ressources de secours

- **Documentation**: `README.md`
- **Guide XRPL**: `backend/XRPL_TESTNET.md`
- **Guide Tokens**: `backend/TOKEN_GUIDE.md`
- **Scripts de test**: `backend/scripts/`

