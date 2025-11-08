# 🚀 XRPL Platform - Deployment Guide

Complete guide for deploying the XRPL Platform to production.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Platforms](#deployment-platforms)
- [CI/CD Pipeline](#cicd-pipeline)
- [Deployment Process](#deployment-process)
- [Post-Deployment](#post-deployment)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)
- [Monitoring](#monitoring)

---

## Overview

### Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  GitHub Repo    │─────▶│  GitHub Actions  │─────▶│  Render/Heroku  │
│  (Source Code)  │      │  (CI/CD)         │      │  (Backend API)  │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                │                            │
                                │                            ▼
                                │                   ┌─────────────────┐
                                │                   │  PostgreSQL DB  │
                                │                   └─────────────────┘
                                │
                                ▼
                         ┌──────────────────┐
                         │  Vercel          │
                         │  (Frontend)      │
                         └──────────────────┘
```

### Deployment Environments

| Environment | Branch    | URL                              | Purpose                |
|-------------|-----------|----------------------------------|------------------------|
| Development | `develop` | http://localhost:3000            | Local development      |
| Staging     | `staging` | https://xrpl-staging.onrender.com| Pre-production testing |
| Production  | `main`    | https://xrpl-api.onrender.com    | Production users       |

---

## Prerequisites

### Required Accounts

- **GitHub** account with repository access
- **Render** account (free tier available)
- **Vercel** account (free tier available)
- **XRPL Testnet** wallet with funded account

### Required Tools

```bash
# Node.js 18+
node --version  # v18.17.0 or higher

# npm 9+
npm --version   # 9.0.0 or higher

# Git
git --version   # 2.0.0 or higher

# PostgreSQL client (optional, for local testing)
psql --version  # 14.0 or higher

# jq (for smoke tests)
jq --version    # 1.6 or higher

# curl (for smoke tests)
curl --version  # 7.0 or higher
```

---

## Environment Setup

### 1. GitHub Secrets

Configure the following secrets in GitHub repository settings:

#### CI Secrets (for testing)

```
DATABASE_URL=postgresql://test_user:test_password@localhost:5432/test_xrpl_platform
JWT_SECRET=test-jwt-secret-min-32-chars-long-for-testing
XRPL_SERVER=wss://s.altnet.rippletest.net:51233
XRPL_PLATFORM_SEED=sEdTxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Render Deployment Secrets

```
RENDER_API_KEY=rnd_xxxxxxxxxxxxxxxxxxxxxxxx
RENDER_STAGING_SERVICE_ID=srv-xxxxxxxxxxxxxxxx
RENDER_PRODUCTION_SERVICE_ID=srv-yyyyyyyyyyyyyyyy
STAGING_DATABASE_URL=postgresql://user:pass@host:5432/staging_db
PRODUCTION_DATABASE_URL=postgresql://user:pass@host:5432/production_db
```

**To add secrets:**

1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret from the list above

### 2. Render Environment Variables

Configure in Render dashboard for each service:

#### Required Variables

```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://...  # Auto-populated from database
JWT_SECRET=<generate-secure-32-char-secret>
JWT_EXPIRES_IN=7d
XRPL_SERVER=wss://s.altnet.rippletest.net:51233
XRPL_PLATFORM_SEED=sEdTxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CORS_ORIGIN=https://xrpl-platform.vercel.app,http://localhost:5173
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

#### Optional Variables

```bash
# Logging
LOG_DIR=/var/log/xrpl-platform
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d

# Database
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Rate Limiting
AUTH_RATE_LIMIT_MAX=5
AUTH_RATE_LIMIT_WINDOW_MS=900000
```

### 3. Generate Secrets

```bash
# Generate JWT Secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate XRPL Wallet (for platform operations)
# Use XRPL Testnet Faucet: https://xrpl.org/xrp-testnet-faucet.html
# Save the seed securely!
```

---

## Deployment Platforms

### Option 1: Render (Recommended)

#### Advantages
- ✅ Free tier available (750 hours/month)
- ✅ PostgreSQL included
- ✅ Auto-deploy from Git
- ✅ Easy configuration
- ✅ Built-in health checks

#### Setup Steps

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create Web Service**
   ```
   1. Click "New +" → "Web Service"
   2. Connect your GitHub repository
   3. Configure:
      - Name: xrpl-platform-api
      - Environment: Node
      - Build Command: npm ci && npx prisma generate
      - Start Command: npm start
      - Plan: Free
   ```

3. **Create PostgreSQL Database**
   ```
   1. Click "New +" → "PostgreSQL"
   2. Configure:
      - Name: xrpl-platform-db
      - Database: xrpl_platform
      - Plan: Free
   3. Copy DATABASE_URL after creation
   ```

4. **Configure Environment Variables**
   - Go to service → Environment
   - Add all variables from "Render Environment Variables" section

5. **Enable Auto-Deploy**
   - Settings → Auto-Deploy: ON
   - Branch: `main` (production) or `staging`

#### Using render.yaml (Infrastructure as Code)

```bash
# The render.yaml file defines all infrastructure
# Render will auto-detect and create services

1. Push render.yaml to repository
2. Render auto-creates:
   - Web service (API)
   - PostgreSQL database
   - Environment variables (except secrets)
3. Manually add secrets in dashboard
```

### Option 2: Heroku

#### Advantages
- ✅ Simple deployment
- ✅ Well-documented
- ✅ Add-ons ecosystem

#### Setup Steps

1. **Create Heroku Account**
   - Go to https://heroku.com
   - Sign up

2. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku

   # Linux
   curl https://cli-assets.heroku.com/install.sh | sh

   # Login
   heroku login
   ```

3. **Create Application**
   ```bash
   # Create app
   heroku create xrpl-platform-api

   # Add PostgreSQL
   heroku addons:create heroku-postgresql:mini

   # Set environment variables
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=<your-secret>
   heroku config:set XRPL_SERVER=wss://s.altnet.rippletest.net:51233
   # ... add all variables
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

#### Using Procfile

The `Procfile` defines how Heroku runs the app:

```
web: npm start
release: npx prisma migrate deploy && npx prisma generate
```

- `web`: Main process (API server)
- `release`: Runs before deployment (migrations)

---

## CI/CD Pipeline

### GitHub Actions Workflows

#### 1. CI Pipeline (`.github/workflows/ci.yml`)

**Triggered on:**
- Pull requests to `main`, `develop`, `staging`
- Pushes to `main`, `develop`

**Jobs:**
1. **Lint**: ESLint, code formatting
2. **Test**: Unit + integration tests (157 tests)
3. **Security Audit**: npm audit
4. **Build**: Prisma validation, client generation
5. **Code Quality**: File structure, documentation checks
6. **Summary**: Aggregate results

**Duration:** ~5-8 minutes

#### 2. CD Pipeline (`.github/workflows/cd.yml`)

**Triggered on:**
- Push to `staging` → Deploy to staging
- Push to `main` → Deploy to production
- Manual trigger via workflow_dispatch

**Jobs:**

**Staging Deployment:**
1. Run migrations
2. Deploy to Render
3. Wait 60s
4. Smoke tests (health checks)
5. Notify success/failure

**Production Deployment:**
1. Create database backup
2. Run migrations
3. Deploy to Render
4. Wait 90s
5. Comprehensive smoke tests (7 tests)
6. Create deployment tag
7. Rollback on failure

**Duration:** ~3-5 minutes

### Workflow Status

Check workflow status:
- GitHub repository → Actions tab
- View logs for each job
- Re-run failed workflows

---

## Deployment Process

### Staging Deployment

**Automatic (recommended):**

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push and create PR to staging
git push origin feature/my-feature
# Create PR on GitHub targeting 'staging' branch

# 4. CI runs automatically on PR
# Review test results

# 5. Merge PR to staging
# CD pipeline deploys to staging automatically

# 6. Verify deployment
curl https://xrpl-staging.onrender.com/health
```

**Manual:**

```bash
# Deploy specific commit to staging
git checkout staging
git merge feature/my-feature
git push origin staging

# Monitor deployment
# GitHub → Actions → CD workflow
```

### Production Deployment

**Automatic (recommended):**

```bash
# 1. Staging must be deployed and tested first

# 2. Create PR from staging to main
git checkout staging
git pull origin staging
# Create PR on GitHub: staging → main

# 3. Code review required
# Team reviews changes

# 4. Merge PR to main
# CD pipeline deploys to production automatically

# 5. Verify deployment
curl https://xrpl-api.onrender.com/health

# 6. Monitor logs
# Render dashboard → Logs
```

**Manual (emergency only):**

```bash
# Only use for hotfixes

# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# 2. Fix and commit
git add .
git commit -m "fix: critical bug"

# 3. Push and deploy
git push origin hotfix/critical-bug
# Create PR: hotfix/critical-bug → main
# Fast-track review and merge

# 4. Verify
curl https://xrpl-api.onrender.com/health
```

### Pre-Deployment Checklist

**Before deploying to production:**

- [ ] All tests pass (157/157)
- [ ] Code review approved
- [ ] Staging tested successfully
- [ ] Database migrations tested
- [ ] Environment variables updated
- [ ] Secrets configured
- [ ] Breaking changes documented
- [ ] Rollback plan prepared
- [ ] Monitoring configured
- [ ] Team notified

### Post-Deployment Checklist

**After deployment:**

- [ ] Health checks pass
- [ ] Smoke tests pass
- [ ] Database migrations complete
- [ ] Logs show no errors
- [ ] Metrics normal
- [ ] Critical paths tested
- [ ] Team notified
- [ ] Documentation updated

---

## Post-Deployment

### 1. Run Smoke Tests

**Automated (included in CD):**
```bash
# Runs automatically after deployment
# Check GitHub Actions logs
```

**Manual:**
```bash
# Test staging
API_URL=https://xrpl-staging.onrender.com ./backend/scripts/smoke-tests.sh

# Test production
API_URL=https://xrpl-api.onrender.com ./backend/scripts/smoke-tests.sh
```

**Expected output:**
```
╔════════════════════════════════════════╗
║     XRPL Platform - Smoke Tests        ║
╚════════════════════════════════════════╝

1. Health Checks
Testing Liveness probe... ✓ PASS (HTTP 200)
Testing Readiness probe... ✓ PASS (HTTP 200)
Testing Full health check... ✓ PASS (Found key: status)

2. Security Headers
Testing HSTS header... ✓ PASS (Header found: Strict-Transport-Security)
...

Total tests:  20
Passed:       20
Failed:       0

✅ All tests passed! (100%)
```

### 2. Verify Core Functionality

```bash
API_URL=https://xrpl-api.onrender.com

# 1. Health endpoint
curl $API_URL/health | jq

# 2. Campaigns list
curl $API_URL/api/campaigns | jq

# 3. XRPL balance
curl $API_URL/api/xrpl/balance | jq

# 4. Register test user
curl -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "name": "Test User",
    "role": "INVESTOR"
  }' | jq
```

### 3. Check Logs

**Render:**
```
1. Go to Render dashboard
2. Select service
3. Click "Logs" tab
4. Filter by level (info, error, warn)
```

**Look for:**
- ✅ Server started on port 10000
- ✅ Database connected successfully
- ✅ XRPL client connected
- ❌ No error messages
- ❌ No warnings about missing env vars

### 4. Monitor Metrics

**Response Times:**
```bash
# Test endpoint speed
time curl https://xrpl-api.onrender.com/health

# Should be < 1 second for health checks
```

**Database:**
- Check connection pool usage
- Monitor query performance
- Verify no connection leaks

**XRPL:**
- Verify wallet balance
- Check transaction history
- Monitor connection status

---

## Rollback Procedures

### Automatic Rollback

CD pipeline includes automatic rollback on deployment failure:

```yaml
# If smoke tests fail, deployment is marked failed
# Render keeps previous version running
```

### Manual Rollback

#### Option 1: Render Dashboard

```
1. Go to Render dashboard
2. Select service
3. Click "Events" tab
4. Find previous successful deployment
5. Click "Rollback to this version"
6. Confirm rollback
```

#### Option 2: Git Revert

```bash
# 1. Identify problematic commit
git log --oneline

# 2. Revert commit
git revert <commit-hash>

# 3. Push revert
git push origin main

# 4. CD pipeline deploys reverted version
```

#### Option 3: Redeploy Previous Tag

```bash
# 1. Find deployment tag
git tag --list "deploy-production-*"

# 2. Checkout tag
git checkout deploy-production-20250108-120000

# 3. Create rollback branch
git checkout -b rollback/to-20250108-120000

# 4. Force push to main (EMERGENCY ONLY)
git push --force origin rollback/to-20250108-120000:main
```

### Rollback Checklist

- [ ] Identify issue and commit
- [ ] Notify team
- [ ] Initiate rollback
- [ ] Verify rollback successful
- [ ] Run smoke tests
- [ ] Monitor logs
- [ ] Document incident
- [ ] Plan fix

### Database Rollback

**If migrations need to be reverted:**

```bash
# 1. Identify migration to revert
ls backend/prisma/migrations/

# 2. Create down migration (manual)
# Edit migration file to add revert steps

# 3. Connect to database
psql $DATABASE_URL

# 4. Manually revert changes
# Run SQL from down migration

# 5. Update migration history
DELETE FROM "_prisma_migrations" WHERE migration_name = 'MIGRATION_NAME';
```

**⚠️ Database rollbacks are dangerous! Always:**
- Create backup first
- Test on staging
- Have DBA review
- Document all steps

---

## Troubleshooting

### Common Issues

#### 1. Deployment Fails

**Symptom:** CD pipeline shows red X

**Diagnosis:**
```bash
# Check GitHub Actions logs
# Look for error messages in deploy job
```

**Solutions:**
- Check environment variables
- Verify database connection
- Check Render service status
- Review migration errors

#### 2. Migrations Fail

**Symptom:** "Migration failed" error

**Diagnosis:**
```bash
# Check migration file
cat backend/prisma/migrations/MIGRATION_NAME/migration.sql

# Test migration locally
DATABASE_URL=... npx prisma migrate deploy
```

**Solutions:**
- Fix SQL syntax errors
- Resolve data conflicts
- Revert problematic migration
- Create new migration

#### 3. Health Checks Fail

**Symptom:** `/health` returns 503 or timeout

**Diagnosis:**
```bash
# Test each health component
curl https://xrpl-api.onrender.com/health/live  # Should work
curl https://xrpl-api.onrender.com/health/ready # Check DB
curl https://xrpl-api.onrender.com/health       # Full check
```

**Solutions:**
- Check database connection
- Verify XRPL connectivity
- Review error logs
- Increase timeout limits

#### 4. Rate Limiting Issues

**Symptom:** "Too Many Requests" (429)

**Diagnosis:**
```bash
# Check rate limit headers
curl -I https://xrpl-api.onrender.com/api/campaigns

# Look for:
# RateLimit-Limit: 100
# RateLimit-Remaining: 99
# RateLimit-Reset: 1704722400
```

**Solutions:**
- Adjust rate limits in environment
- Whitelist IPs if needed
- Scale to multiple instances

#### 5. XRPL Connection Issues

**Symptom:** "XRPL connection failed"

**Diagnosis:**
```bash
# Test XRPL server
curl https://xrpl-api.onrender.com/api/xrpl/balance

# Check XRPL server status
# https://xrpl.org/rippled-api-tool.html
```

**Solutions:**
- Check `XRPL_SERVER` URL
- Verify testnet status
- Try alternative server
- Check wallet seed

#### 6. Out of Memory

**Symptom:** Service crashes with "out of memory"

**Diagnosis:**
```bash
# Check Render logs for memory usage
# Look for "JavaScript heap out of memory"
```

**Solutions:**
- Upgrade Render plan
- Optimize database queries
- Add pagination
- Reduce log retention

### Debug Mode

**Enable verbose logging:**

```bash
# Set in Render environment
LOG_LEVEL=debug

# Redeploy service
# Check logs for detailed output
```

### Support Channels

- **Render Support:** https://render.com/docs
- **GitHub Issues:** Create issue in repository
- **XRPL Discord:** https://discord.gg/xrpl
- **Team Chat:** Slack/Discord

---

## Monitoring

### Render Metrics

**Available in dashboard:**
- Request count
- Response time (p50, p95, p99)
- Error rate
- CPU usage
- Memory usage
- Database connections

### Custom Monitoring

**Health Check Endpoint:**
```bash
# Monitor health every 5 minutes
*/5 * * * * curl -f https://xrpl-api.onrender.com/health/live || alert
```

**Uptime Monitoring Services:**
- UptimeRobot (free)
- Pingdom
- StatusCake

### Log Monitoring

**Winston logs include:**
- Timestamp
- Level (info, error, warn)
- Message
- Context (userId, requestId, etc.)

**Log locations:**
- Render dashboard → Logs
- File: `/var/log/xrpl-platform/` (if configured)

### Alerting

**Set up alerts for:**
- Health check failures
- High error rate (> 1%)
- High response time (> 2s)
- Database connection failures
- XRPL connection issues

### Dashboards

**Create dashboard with:**
- Uptime (target: 99.9%)
- Response time (target: < 500ms p95)
- Error rate (target: < 0.1%)
- Request count
- Active users
- Database performance

---

## Security Checklist

**Before production deployment:**

- [ ] All secrets in GitHub Secrets (not in code)
- [ ] CORS configured with exact origins
- [ ] Rate limiting enabled
- [ ] Helmet security headers active
- [ ] HTTPS enforced
- [ ] Database encrypted at rest
- [ ] Passwords hashed (bcrypt)
- [ ] JWT tokens secure
- [ ] XRPL wallet seed secure
- [ ] npm audit clean
- [ ] No console.log in production
- [ ] Error messages don't leak info
- [ ] Input validation everywhere
- [ ] SQL injection prevented (Prisma)
- [ ] XSS prevented (Helmet)

---

## Maintenance

### Regular Tasks

**Weekly:**
- [ ] Review error logs
- [ ] Check security alerts
- [ ] Update dependencies (patch versions)
- [ ] Review performance metrics

**Monthly:**
- [ ] Update dependencies (minor versions)
- [ ] Review and rotate secrets
- [ ] Database maintenance (vacuum, reindex)
- [ ] Review access logs for anomalies

**Quarterly:**
- [ ] Update dependencies (major versions)
- [ ] Security audit
- [ ] Load testing
- [ ] Disaster recovery drill

### Backup Strategy

**Database backups:**
- Render: Automatic daily backups (7-day retention)
- Manual: `pg_dump` before major changes

**Code backups:**
- Git repository (primary)
- GitHub (remote)
- Local clones (team members)

### Disaster Recovery

**RTO (Recovery Time Objective):** 1 hour  
**RPO (Recovery Point Objective):** 24 hours

**Recovery steps:**
1. Identify incident
2. Notify team
3. Assess damage
4. Restore from backup
5. Verify data integrity
6. Resume service
7. Post-mortem

---

## Appendix

### Useful Commands

```bash
# Check deployment status
git log --oneline -n 5

# View environment variables
heroku config  # Heroku
# Render: Use dashboard

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# View database
npx prisma studio

# Test locally with production build
NODE_ENV=production npm start

# Load test
ab -n 1000 -c 10 https://xrpl-api.onrender.com/health
```

### Environment Variable Reference

See [SECURITY_GUIDE.md](./SECURITY_GUIDE.md) for complete list.

### Migration Guide

See [BACKEND_COMPLETE.md](./BACKEND_COMPLETE.md) for migration details.

### API Documentation

See Postman collection: `backend/postman_collection.json`

---

## Support

Need help? Check these resources:

1. **Documentation**
   - [README.md](./README.md)
   - [BACKEND_COMPLETE.md](./BACKEND_COMPLETE.md)
   - [SECURITY_GUIDE.md](./SECURITY_GUIDE.md)
   - [OPS_GUIDE.md](./OPS_GUIDE.md)

2. **GitHub Issues**
   - Bug reports
   - Feature requests
   - Questions

3. **Team Communication**
   - Slack/Discord
   - Email

4. **External Resources**
   - [Render Docs](https://render.com/docs)
   - [XRPL Docs](https://xrpl.org/docs)
   - [Prisma Docs](https://www.prisma.io/docs)

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-08  
**Maintained By:** DevOps Team
