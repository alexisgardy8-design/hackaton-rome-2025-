# 🔒 Security Guide - XRPL Crowdfunding Platform

## Table des matières
1. [Aperçu de la sécurité](#aperçu-de-la-sécurité)
2. [Gestion des secrets](#gestion-des-secrets)
3. [Wallets XRPL](#wallets-xrpl)
4. [Configuration production](#configuration-production)
5. [Rate Limiting](#rate-limiting)
6. [Validation & Sanitization](#validation--sanitization)
7. [Logging & Monitoring](#logging--monitoring)
8. [Checklist déploiement](#checklist-déploiement)
9. [Incident Response](#incident-response)

---

## Aperçu de la sécurité

### Architecture de sécurité

```
┌─────────────────────────────────────────────┐
│           Couches de sécurité               │
├─────────────────────────────────────────────┤
│ 1. Rate Limiting (express-rate-limit)      │
│ 2. Security Headers (Helmet)               │
│ 3. Input Validation (express-validator)    │
│ 4. Authentication (JWT + bcrypt)           │
│ 5. Authorization (Role-based)              │
│ 6. XRPL Wallet Security                    │
│ 7. Structured Logging (Winston)            │
│ 8. Monitoring & Health Checks              │
└─────────────────────────────────────────────┘
```

### Principes de sécurité
- **Defense in Depth**: Plusieurs couches de protection
- **Least Privilege**: Chaque composant a uniquement les permissions nécessaires
- **Fail Secure**: En cas d'erreur, le système refuse l'accès
- **Security by Design**: Sécurité intégrée dès la conception

---

## Gestion des secrets

### Variables d'environnement critiques

#### ⚠️ **JAMAIS COMMITER** ces secrets dans Git

```bash
# .env (NE PAS COMMITER)
DATABASE_URL="postgresql://..."
JWT_SECRET="votre-secret-tres-long-et-aleatoire-minimum-32-caracteres"
XRPL_PLATFORM_SEED="sXXXXXXXXXXXXXXXXXXXXXXXXX"
```

### Rotation des secrets

#### 1. JWT_SECRET

**Fréquence recommandée**: Tous les 3-6 mois

```bash
# Générer un nouveau secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Procédure de rotation
1. Générer nouveau JWT_SECRET_NEW
2. Modifier code pour accepter JWT_SECRET et JWT_SECRET_NEW
3. Déployer
4. Attendre expiration des anciens tokens (24h par défaut)
5. Supprimer JWT_SECRET, renommer JWT_SECRET_NEW -> JWT_SECRET
6. Redéployer
```

#### 2. XRPL_PLATFORM_SEED

**Fréquence recommandée**: Annuellement ou si compromis

```bash
# Procédure de rotation wallet
1. Créer nouveau wallet XRPL
2. Transférer tous les fonds vers nouveau wallet
3. Mettre à jour XRPL_PLATFORM_SEED
4. Archiver ancien seed de manière sécurisée
5. Redéployer application
```

⚠️ **Attention**: La rotation du wallet nécessite la mise à jour de tous les tokens émis (issuer change)

### Stockage des secrets en production

#### Option 1: Services de gestion de secrets (Recommandé)

```bash
# AWS Secrets Manager
aws secretsmanager create-secret --name prod/xrpl/platform-seed --secret-string "sXXX..."

# HashiCorp Vault
vault kv put secret/xrpl platform-seed="sXXX..."

# Azure Key Vault
az keyvault secret set --vault-name xrpl-vault --name platform-seed --value "sXXX..."
```

#### Option 2: Variables d'environnement système

```bash
# Via systemd service file
Environment="XRPL_PLATFORM_SEED=sXXX..."
Environment="JWT_SECRET=xxx..."

# Via Docker secrets
docker secret create jwt_secret jwt_secret.txt
docker service create --secret jwt_secret myapp
```

#### Option 3: Fichiers chiffrés

```bash
# Chiffrer avec GPG
gpg --symmetric --cipher-algo AES256 .env.production

# Déchiffrer au déploiement
gpg --decrypt .env.production.gpg > .env.production
```

### Audit des accès aux secrets

```javascript
// Logger tout accès aux secrets
logger.security('Secret accessed', {
  secret: 'XRPL_PLATFORM_SEED',
  user: 'deployment-script',
  timestamp: new Date().toISOString()
});
```

---

## Wallets XRPL

### Séparation des wallets

#### 🎯 **OBLIGATOIRE**: Wallets séparés par environnement

```
Development  → Wallet Testnet/Devnet (funding via faucet)
Staging      → Wallet Testnet avec fonds de test limités
Production   → Wallet Mainnet avec sécurité maximale
```

### Configuration par environnement

```bash
# .env.development
XRPL_SERVER="wss://s.altnet.rippletest.net:51233"
XRPL_PLATFORM_SEED="sXXX...testnet"  # Testnet wallet

# .env.production
XRPL_SERVER="wss://xrplcluster.com"
XRPL_PLATFORM_SEED="sXXX...mainnet"  # Production wallet - ULTRA SÉCURISÉ
```

### Sécurité du wallet production

#### 1. Génération sécurisée

```bash
# Générer offline sur machine sécurisée
node generate-wallet-offline.js

# Output
# Address: rXXXXXXXXXXXXXXXXXXXXXXXXXX
# Seed: sXXXXXXXXXXXXXXXXXXXXXXXXX (GARDER SECRET)
# Public Key: 0xXXXX...
```

#### 2. Backup du seed

**Méthode 1: Paper Wallet** (Recommandé pour cold storage)
- Écrire seed sur papier
- Stocker dans coffre-fort physique
- Faire 2-3 copies dans lieux différents

**Méthode 2: Hardware Security Module (HSM)**
```bash
# Pour grandes entreprises
# Stocker seed dans HSM dédié
# Exemple: AWS CloudHSM, Azure Dedicated HSM
```

**Méthode 3: Multi-signature** (Pour sécurité maximale)
```javascript
// Wallet multi-sig requiert plusieurs signatures
// 2-of-3 ou 3-of-5 configuration
// Protège contre compromission d'une seule clé
```

#### 3. Monitoring du wallet

```javascript
// Alertes automatiques
if (walletBalance < LOW_BALANCE_THRESHOLD) {
  logger.warn('Low wallet balance', { balance, threshold });
  sendAlertEmail('admin@company.com', 'Wallet balance low');
}

// Détection transactions suspectes
if (transaction.amount > LARGE_AMOUNT_THRESHOLD) {
  logger.security('Large transaction detected', {
    amount: transaction.amount,
    destination: transaction.destination
  });
  requireManualApproval();
}
```

### Limites opérationnelles

```javascript
// backend/config/limits.js
export const WALLET_LIMITS = {
  // Montant maximum par transaction
  MAX_TRANSACTION_AMOUNT: 1000, // XRP
  
  // Nombre maximum de transactions par jour
  MAX_DAILY_TRANSACTIONS: 100,
  
  // Balance minimale à maintenir
  MIN_WALLET_BALANCE: 10, // XRP (pour fees)
  
  // Alerte si balance < threshold
  LOW_BALANCE_THRESHOLD: 100 // XRP
};
```

---

## Configuration production

### Variables d'environnement

```bash
# .env.production

# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public&connection_limit=10"

# CORS (domaines autorisés uniquement)
CORS_ORIGIN="https://app.example.com,https://admin.example.com"

# JWT
JWT_SECRET="secret-ultra-securise-64-caracteres-minimum-rotation-trimestrielle"
JWT_EXPIRES_IN="24h"

# XRPL
XRPL_SERVER="wss://xrplcluster.com"  # Production Mainnet
XRPL_PLATFORM_SEED="sXXXXXXXXXXXXXXXXXXXXXXXXX"  # ULTRA SECRET

# Logging
LOG_LEVEL="info"  # production: info | debug: development
LOG_TO_FILE="true"
LOGS_DIR="/var/log/xrpl-platform"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="900000"  # 15 minutes
RATE_LIMIT_MAX="100"  # 100 requêtes par fenêtre

# Monitoring
SENTRY_DSN="https://xxx@sentry.io/xxx"  # Optional
```

### Helmet configuration

```javascript
// server.js
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
}));
```

### CORS strict

```javascript
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGIN.split(',');
    
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.security('CORS rejected', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## Rate Limiting

### Configuration recommandée

```javascript
// src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

// Global rate limiter (modéré)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoints (strict)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 tentatives de login par 15min
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later'
});

// Investment endpoints (modéré)
export const investmentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 investissements par minute
  message: 'Too many investment requests'
});

// Dividend distribution (très strict)
export const dividendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5, // 5 distributions par heure
  message: 'Too many dividend distribution requests'
});
```

### Application dans routes

```javascript
// authRoutes.js
router.post('/login', authLimiter, loginValidation, login);
router.post('/register', authLimiter, registerValidation, register);

// investmentRoutes.js
router.post('/', authenticate, investmentLimiter, createInvestment);

// dividendRoutes.js
router.post('/:campaignId/distribute', authenticate, authorize('STARTUP'), dividendLimiter, distributeDividends);
```

---

## Validation & Sanitization

### express-validator best practices

```javascript
import { body, param, query, validationResult } from 'express-validator';
import createDOMPurify from 'isomorphic-dompurify';

const DOMPurify = createDOMPurify();

// Validation + sanitization
export const campaignValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title required')
    .isLength({ min: 3, max: 100 })
    .customSanitizer(value => DOMPurify.sanitize(value)), // XSS protection
  
  body('description')
    .trim()
    .notEmpty()
    .isLength({ min: 10, max: 5000 })
    .customSanitizer(value => DOMPurify.sanitize(value)),
  
  body('goal')
    .isFloat({ min: 0.01 }).withMessage('Goal must be positive')
    .toFloat(),
  
  body('deadline')
    .isISO8601().withMessage('Invalid date format')
    .custom(value => {
      const deadline = new Date(value);
      const now = new Date();
      if (deadline <= now) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),
  
  body('walletAddress')
    .trim()
    .matches(/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/)
    .withMessage('Invalid XRPL address')
];

// Error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation errors', {
      path: req.path,
      errors: errors.array(),
      userId: req.user?.id
    });
    return res.status(400).json({ 
      error: 'Validation Error',
      errors: errors.array() 
    });
  }
  next();
};
```

### Validation personnalisée XRPL

```javascript
// utils/xrplValidation.js
import { isValidAddress } from '../lib/xrplClient.js';

export const validateXRPLAddress = async (address) => {
  if (!isValidAddress(address)) {
    throw new Error('Invalid XRPL address format');
  }
  
  // Vérifier si compte existe sur ledger (optional)
  try {
    await getAccountBalance(address);
    return true;
  } catch (error) {
    if (error.message.includes('actNotFound')) {
      throw new Error('XRPL account does not exist on ledger');
    }
    throw error;
  }
};
```

---

## Logging & Monitoring

### Niveaux de logs

```javascript
// Production: info level
logger.info('Campaign created', { campaignId, userId, goal });

// Development: debug level
logger.debug('Request details', { headers: req.headers, body: req.body });

// Errors
logger.error('Payment failed', { error: error.message, stack: error.stack });

// Security events
logger.security('Multiple failed login attempts', { 
  email, 
  ip: req.ip, 
  attempts: 5 
});

// XRPL operations
logger.xrpl('Token distribution', {
  operation: 'sendTokenPayment',
  campaignId,
  investorAddress,
  amount,
  txHash,
  validated: true
});
```

### Logs à persister obligatoirement

```javascript
// 1. Transactions XRPL (30 jours)
logger.xrpl('XRPL transaction', {
  type: 'payment',
  txHash: result.hash,
  from: wallet.address,
  to: destination,
  amount,
  currency,
  timestamp: new Date().toISOString(),
  validated: result.validated
});

// 2. Authentification (14 jours)
logger.auth('User login', {
  userId: user.id,
  email: user.email,
  ip: req.ip,
  userAgent: req.get('user-agent'),
  timestamp: new Date().toISOString()
});

// 3. Paiements/Dividendes (30 jours)
logger.payment('Dividend distributed', {
  campaignId,
  dividendId,
  totalAmount,
  recipientsCount,
  txHashes: results.map(r => r.hash),
  timestamp: new Date().toISOString()
});

// 4. Erreurs (14 jours)
logger.error('Critical error', {
  error: error.message,
  stack: error.stack,
  userId: req.user?.id,
  endpoint: req.path,
  timestamp: new Date().toISOString()
});
```

### Métriques à monitorer

```javascript
// Health checks
- Database connection status
- XRPL connection status
- Platform wallet balance
- API response times
- Error rates

// Business metrics
- Nombre de campagnes actives
- Volume total d'investissements
- Nombre de transactions XRPL/jour
- Solde wallet platform
- Dividendes distribués
```

### Alertes recommandées

```javascript
// 1. Wallet balance bas
if (balance < 10) {
  sendAlert('URGENT: Wallet balance < 10 XRP');
}

// 2. Taux d'erreur élevé
if (errorRate > 5%) {
  sendAlert('WARNING: Error rate above 5%');
}

// 3. XRPL déconnecté
if (!client.isConnected()) {
  sendAlert('CRITICAL: XRPL connection lost');
}

// 4. Database slow queries
if (queryTime > 1000) { // 1 seconde
  logger.warn('Slow query detected', { query, time: queryTime });
}
```

---

## Checklist déploiement

### Pré-déploiement

- [ ] **Secrets configurés** dans gestionnaire de secrets (AWS/Vault/Azure)
- [ ] **Wallet production** généré et testé sur Testnet
- [ ] **Backup wallet seed** stocké dans 3 lieux sécurisés
- [ ] **Variables d'environnement** validées (`.env.production`)
- [ ] **CORS_ORIGIN** configuré avec domaines production uniquement
- [ ] **Rate limits** ajustés pour charge production attendue
- [ ] **Database** migrations appliquées
- [ ] **SSL/TLS** certificats configurés
- [ ] **Firewall** règles configurées (ports 443, 5432 uniquement)
- [ ] **Tests** Phase 1-6 tous passés (136+ tests)

### Post-déploiement

- [ ] **Health checks** tous verts (`/health`, `/health/ready`, `/health/live`)
- [ ] **Logs** générés correctement (`/var/log/xrpl-platform/`)
- [ ] **XRPL connection** stable (check wallet balance)
- [ ] **Test transaction** réussie sur Mainnet
- [ ] **Monitoring** actif (Sentry/Datadog/Prometheus)
- [ ] **Alertes** configurées (email/Slack/PagerDuty)
- [ ] **Backup automatique** DB configuré (quotidien)
- [ ] **Documentation** mise à jour avec IPs/endpoints production

### Validation production

```bash
# 1. Health check
curl https://api.example.com/health

# 2. Test auth
curl -X POST https://api.example.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secure123","name":"Test"}'

# 3. Test rate limiting
for i in {1..10}; do
  curl https://api.example.com/api/campaigns
done

# 4. Vérifier logs
tail -f /var/log/xrpl-platform/combined-$(date +%Y-%m-%d).log
```

---

## Incident Response

### Types d'incidents

#### 1. Compromission du wallet

**Signes**:
- Transactions non autorisées
- Balance wallet diminue rapidement
- Alertes activité suspecte

**Actions immédiates**:
```bash
# 1. Arrêter l'application
systemctl stop xrpl-platform

# 2. Créer nouveau wallet
node scripts/generate-new-wallet.js

# 3. Transférer fonds restants vers nouveau wallet
node scripts/emergency-transfer.js

# 4. Mettre à jour XRPL_PLATFORM_SEED
# 5. Redémarrer application

# 6. Investigation
grep "XRPL transaction" logs/xrpl-*.log | grep -v "expected-address"
```

#### 2. Attaque DDoS

**Signes**:
- Rate limit triggered massivement
- Logs HTTP nombreuses requêtes même IP
- CPU/RAM élevé

**Actions**:
```bash
# 1. Identifier IPs malveillantes
grep "Rate limit exceeded" logs/http-*.log | awk '{print $5}' | sort | uniq -c | sort -rn

# 2. Bloquer IPs au firewall
iptables -A INPUT -s 1.2.3.4 -j DROP

# 3. Activer Cloudflare/AWS Shield
# 4. Réduire temporairement rate limits
```

#### 3. Database compromission

**Signes**:
- Données modifiées sans logs
- Utilisateurs non autorisés créés
- Queries SQL suspectes

**Actions**:
```bash
# 1. Isoler database
# 2. Restore depuis backup
pg_restore -d xrpl_platform backup_latest.dump

# 3. Changer tous les credentials
# 4. Audit complet logs
# 5. Renforcer accès DB (IP whitelist, VPN)
```

### Contacts d'urgence

```yaml
# contacts.yml
security_team:
  - name: "Security Lead"
    email: "security@company.com"
    phone: "+XX XXX XXX XXX"
    
devops_team:
  - name: "DevOps Lead"
    email: "devops@company.com"
    phone: "+XX XXX XXX XXX"

escalation:
  - level: 1
    response_time: "15 minutes"
    team: "DevOps"
  
  - level: 2
    response_time: "30 minutes"
    team: "Security + CTO"
  
  - level: 3
    response_time: "1 hour"
    team: "All hands + CEO"
```

### Post-incident

1. **Root Cause Analysis** (RCA)
   - Que s'est-il passé ?
   - Comment est-ce arrivé ?
   - Pourquoi n'a-t-on pas détecté plus tôt ?

2. **Remediation**
   - Corriger la vulnérabilité
   - Améliorer monitoring
   - Mettre à jour procédures

3. **Documentation**
   - Incident report complet
   - Timeline détaillée
   - Leçons apprises

4. **Communication**
   - Transparence avec utilisateurs
   - Notification si données exposées
   - Plan d'amélioration publié

---

## Ressources additionnelles

### Documentation officielle
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [XRPL Security](https://xrpl.org/security.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

### Outils recommandés
- **Snyk**: Scan vulnérabilités dependencies
- **OWASP ZAP**: Security testing
- **Helmet**: Security headers
- **express-rate-limit**: Rate limiting
- **Winston**: Structured logging

### Audits de sécurité

**Interne** (mensuel):
```bash
# 1. Scan dependencies
npm audit

# 2. Update packages
npm update

# 3. Review logs
grep "error\|security\|warn" logs/combined-*.log
```

**Externe** (annuel):
- Penetration testing
- Code review sécurité
- Infrastructure audit
- Compliance check (RGPD, PCI-DSS si applicable)

---

## Conclusion

La sécurité est un processus continu, pas un état final. Cette guide doit être mis à jour régulièrement avec :
- Nouvelles menaces identifiées
- Incidents résolus
- Améliorations implémentées
- Nouvelles best practices

**Questions ?** Contactez l'équipe sécurité: security@company.com

**Dernière mise à jour**: Phase 6 - $(date +%Y-%m-%d)
