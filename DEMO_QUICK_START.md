# 🚀 Guide de Démonstration Rapide - XRise

Guide rapide pour démarrer une démonstration en 5 minutes.

## ⚡ Démarrage rapide

### 1. Préparer l'environnement (2 min)

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend Startup
cd frontend-startuper && npm run dev

# Terminal 3: Frontend User
cd frontend-user && npm run dev
```

### 2. Préparer les données de test (1 min)

```bash
# Exécuter le script de préparation
./scripts/demo-setup.sh
```

### 3. Vérifier que tout fonctionne (1 min)

```bash
# Vérifier le backend
curl http://localhost:3000/health

# Vérifier les frontends
# Ouvrir http://localhost:8080 (Startup)
# Ouvrir http://localhost:8081 (User)
```

## 🎬 Scénario de démo rapide (5 min)

### Étape 1: Créer une campagne (1 min)
1. Ouvrir http://localhost:8080
2. Se connecter: `demo-startup@test.com` / `Demo123!`
3. Créer une nouvelle campagne
4. Activer la campagne

### Étape 2: Investir (2 min)
1. Ouvrir http://localhost:8081
2. Se connecter: `demo-investor@test.com` / `Demo123!`
3. Parcourir les campagnes
4. Investir dans une campagne
5. Générer un wallet XRPL Testnet
6. Envoyer la transaction XRPL
7. Confirmer l'investissement

### Étape 3: Émettre un token (2 min)
1. Retourner sur le frontend Startup
2. Émettre un token pour la campagne
3. Vérifier sur XRPL Explorer: https://testnet.xrpl.org/
4. Montrer la transaction blockchain

## 📋 Checklist rapide

- [ ] Backend démarré (port 3000)
- [ ] Frontend Startup démarré (port 8080)
- [ ] Frontend User démarré (port 8081)
- [ ] Script de préparation exécuté
- [ ] Comptes de démo créés
- [ ] Campagne de démo créée
- [ ] Wallet Testnet généré

## 🎯 Points clés à mentionner

1. **Intégration blockchain réelle** : Transactions XRPL Testnet vérifiables
2. **Architecture moderne** : API RESTful, séparation frontend/backend
3. **Expérience utilisateur** : Interfaces distinctes pour User/Startup
4. **Sécurité** : JWT, rate limiting, validation

## 🔗 URLs importantes

- **Frontend User**: http://localhost:8081
- **Frontend Startup**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **XRPL Explorer**: https://testnet.xrpl.org/

## 📚 Scripts disponibles

- `./scripts/demo-setup.sh` - Préparer les données de test
- `./scripts/demo-presentation.sh` - Guide de présentation interactif
- `./scripts/demo-checklist.md` - Checklist complète

## 💡 Conseils

1. **Testez avant** : Vérifiez que tout fonctionne avant la présentation
2. **Préparez les données** : Utilisez le script de préparation
3. **Soyez flexible** : Adaptez-vous aux questions
4. **Montrez le code** : Si possible, montrez l'architecture
5. **Restez simple** : Expliquez les concepts de manière accessible

## 🆘 En cas de problème

### Backend ne démarre pas
```bash
# Libérer le port 3000
lsof -ti:3000 | xargs kill -9
cd backend && npm run dev
```

### Frontend ne démarre pas
```bash
# Libérer les ports
lsof -ti:8080,8081 | xargs kill -9
cd frontend-startuper && npm run dev
cd frontend-user && npm run dev
```

### Transaction XRPL échoue
- Vérifier la connexion XRPL Testnet
- Vérifier le solde du wallet
- Utiliser le faucet XRPL Testnet si nécessaire

---

**Bon courage pour votre présentation ! 🎉**
