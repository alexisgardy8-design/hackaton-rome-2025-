# 🚀 Quick Start — CI/CD & Deployment

Guide rapide pour déployer le backend XRPL Platform avec CI/CD automatisé.

## 📋 Prérequis

- [x] Compte GitHub avec accès au repository
- [x] Compte Render (gratuit: https://render.com)
- [x] Git installé localement
- [x] Node.js 18+ (pour tests locaux)

## ⚡ Déploiement Rapide (10 minutes)

### 1. Fork/Clone du Repository

```bash
git clone https://github.com/YOUR_USERNAME/hackaton-rome-2025-.git
cd hackaton-rome-2025-/backend
```

### 2. Configurer GitHub Secrets

1. Aller sur GitHub: **Settings** → **Secrets and variables** → **Actions**
2. Cliquer **New repository secret**
3. Ajouter ces secrets:

```bash
# Secrets CI (pour tests)
DATABASE_URL=postgresql://test_user:test_password@localhost:5432/test_xrpl_platform
JWT_SECRET=votre-secret-jwt-32-caracteres-minimum
XRPL_SERVER=wss://s.altnet.rippletest.net:51233
XRPL_PLATFORM_SEED=sEdTxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Secrets CD (pour déploiement)
RENDER_API_KEY=votre-api-key-render
RENDER_STAGING_SERVICE_ID=srv-xxx
RENDER_PRODUCTION_SERVICE_ID=srv-yyy
STAGING_DATABASE_URL=postgresql://...
PRODUCTION_DATABASE_URL=postgresql://...
```

**💡 Astuce:** Générer JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**💡 Astuce:** Obtenir XRPL wallet:
- Aller sur https://xrpl.org/xrp-testnet-faucet.html
- Cliquer "Generate Testnet Credentials"
- Copier le "Secret" (commence par sEd...)

### 3. Setup Render

#### Créer Service Web

1. Aller sur https://render.com/dashboard
2. Cliquer **New +** → **Web Service**
3. Connecter GitHub repository
4. Configuration:
   ```
   Name: xrpl-platform-api
   Environment: Node
   Build Command: npm ci && npx prisma generate
   Start Command: npm start
   Plan: Free
   ```

#### Créer Base de Données

1. **New +** → **PostgreSQL**
2. Configuration:
   ```
   Name: xrpl-platform-db
   Database: xrpl_platform
   Plan: Free
   ```
3. Copier le **Connection String** (DATABASE_URL)

#### Ajouter Variables d'Environnement

Dans votre service web, aller à **Environment**:

```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=<de la base créée ci-dessus>
JWT_SECRET=<votre-secret-32-chars>
JWT_EXPIRES_IN=7d
XRPL_SERVER=wss://s.altnet.rippletest.net:51233
XRPL_PLATFORM_SEED=<votre-xrpl-seed>
CORS_ORIGIN=https://votre-frontend.vercel.app,http://localhost:5173
LOG_LEVEL=info
```

#### Activer Auto-Deploy

1. **Settings** → **Auto-Deploy**: **ON**
2. **Branch**: `main`

### 4. Premier Déploiement

```bash
# Créer branches
git checkout -b staging
git push origin staging

git checkout main
git push origin main
```

✅ **Les workflows CI/CD s'exécutent automatiquement!**

### 5. Vérifier le Déploiement

```bash
# Attendre ~5 minutes puis:
curl https://votre-service.onrender.com/health

# Devrait retourner:
{
  "status": "ok",
  "timestamp": "2025-01-08T12:00:00.000Z",
  "uptime": 123.45,
  "database": "connected",
  "xrpl": "connected"
}
```

### 6. Tester avec Smoke Tests

```bash
cd backend
API_URL=https://votre-service.onrender.com ./scripts/smoke-tests.sh
```

✅ **Si tous les tests passent: déploiement réussi! 🎉**

---

## 🔄 Workflow de Développement

### Feature Development

```bash
# 1. Créer feature branch
git checkout -b feature/123-my-feature

# 2. Développer
# ... faire des changements ...

# 3. Commit
git add .
git commit -m "feat(auth): add refresh tokens"

# 4. Push et créer PR
git push origin feature/123-my-feature
# Créer PR sur GitHub vers 'staging'

# 5. CI s'exécute automatiquement
# Attendre ✅ (lint, tests, security, build)

# 6. Merger vers staging
# CD déploie automatiquement sur staging

# 7. Tester staging
curl https://xrpl-staging.onrender.com/health

# 8. Créer PR: staging → main
# 9. Review et merger

# 10. CD déploie en production automatiquement
# avec backup + smoke tests
```

### Hotfix

```bash
# 1. Créer depuis main
git checkout main
git pull origin main
git checkout -b hotfix/urgent-bug

# 2. Fixer
git commit -m "fix: critical bug"

# 3. PR vers main (fast-track review)
# 4. Merge → déploiement immédiat
```

---

## 📊 Monitoring

### GitHub Actions

1. Aller sur repository GitHub
2. **Actions** tab
3. Voir les workflows en cours/terminés

### Render Dashboard

1. https://render.com/dashboard
2. Sélectionner votre service
3. **Logs** tab pour les logs en temps réel
4. **Events** tab pour l'historique des déploiements

### Health Checks

```bash
# Liveness (doit toujours être up)
curl https://votre-service.onrender.com/health/live

# Readiness (vérifie DB + XRPL)
curl https://votre-service.onrender.com/health/ready

# Full health (détails complets)
curl https://votre-service.onrender.com/health
```

---

## 🐛 Troubleshooting

### CI échoue

**Lint errors:**
```bash
npm run lint -- --fix
git commit -am "style: fix linting"
git push
```

**Tests échouent:**
```bash
# Tester localement
npm test
# Fixer les tests
git commit -am "test: fix failing tests"
git push
```

### Déploiement échoue

**Vérifier logs Render:**
1. Render Dashboard → Service → Logs
2. Chercher les erreurs

**Variables d'environnement manquantes:**
1. Render Dashboard → Service → Environment
2. Vérifier toutes les variables

**Migrations échouent:**
```bash
# Tester localement
DATABASE_URL=<staging-url> npx prisma migrate deploy
```

### Rollback

**Option 1: Render Dashboard**
1. Service → Events
2. Trouver déploiement précédent
3. "Rollback"

**Option 2: Git Revert**
```bash
git revert <commit-hash>
git push origin main
# Nouveau déploiement automatique
```

---

## 📚 Documentation Complète

Pour plus de détails, consulter:

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guide complet de déploiement (30KB)
- **[CI_CD.md](./CI_CD.md)** - Documentation CI/CD (15KB)
- **[PHASE7_SUMMARY.md](./PHASE7_SUMMARY.md)** - Résumé Phase 7 (20KB)
- **[TEST_PHASE7.md](./TEST_PHASE7.md)** - Tests Phase 7 (15KB)
- **[SECURITY_GUIDE.md](./SECURITY_GUIDE.md)** - Sécurité (27KB)
- **[OPS_GUIDE.md](./OPS_GUIDE.md)** - Operations (39KB)

---

## 🎯 Checklist Post-Déploiement

- [ ] Health checks passent (`/health`)
- [ ] Smoke tests passent (20/20)
- [ ] Logs ne montrent pas d'erreurs
- [ ] Database connectée
- [ ] XRPL connecté
- [ ] Authentication fonctionne
- [ ] Security headers présents
- [ ] Rate limiting actif
- [ ] Monitoring configuré
- [ ] Équipe notifiée

---

## 🆘 Support

### Problème avec CI/CD?
→ Voir [CI_CD.md](./CI_CD.md) section Troubleshooting

### Problème avec déploiement?
→ Voir [DEPLOYMENT.md](./DEPLOYMENT.md) section Troubleshooting

### Problème avec Render?
→ https://render.com/docs

### Autre problème?
→ Créer une issue sur GitHub avec le template Bug Report

---

## ✅ Success!

Si vous voyez:
```
✅ All tests passed! (100%)
🎉 Deployment is healthy and ready for production!
```

**Félicitations! Votre backend XRPL Platform est déployé! 🚀**

---

**Version:** 1.0  
**Dernière mise à jour:** 8 janvier 2025  
**Temps d'installation:** ~10 minutes
