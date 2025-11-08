# Phase 7 Testing Guide — CI/CD & Deployment

Complete testing and validation guide for Phase 7 CI/CD implementation.

## Table of Contents

- [Testing Overview](#testing-overview)
- [CI Pipeline Tests](#ci-pipeline-tests)
- [CD Pipeline Tests](#cd-pipeline-tests)
- [Smoke Tests](#smoke-tests)
- [Manual Validation](#manual-validation)
- [Troubleshooting](#troubleshooting)

---

## Testing Overview

### Test Categories

| Category           | Type      | Count | Duration | Automated |
|-------------------|-----------|-------|----------|-----------|
| Lint              | CI        | 1     | 2 min    | ✅        |
| Unit Tests        | CI        | 157   | 4 min    | ✅        |
| Security Audit    | CI        | 1     | 1 min    | ✅        |
| Build             | CI        | 1     | 2 min    | ✅        |
| Code Quality      | CI        | 5     | 1 min    | ✅        |
| Smoke Tests       | CD        | 20    | 2 min    | ✅        |
| Integration Tests | CD        | 3     | 1 min    | ✅        |
| Manual Tests      | Manual    | 15    | 10 min   | ❌        |

**Total:** 203 tests

### Prerequisites

```bash
# Required tools
node --version    # v18.17.0+
npm --version     # 9.0.0+
git --version     # 2.0.0+
curl --version    # 7.0.0+
jq --version      # 1.6+

# GitHub account with repo access
# Render account (optional for deployment tests)
```

---

## CI Pipeline Tests

### Test 1: Lint Check

**Purpose:** Validate code quality and style

**Trigger:**
```bash
git push origin feature/my-feature
# CI runs automatically on PR
```

**Manual run:**
```bash
cd backend
npm run lint
```

**Expected Output:**
```
✔ 0 problems (0 errors, 0 warnings)
```

**What's Tested:**
- ESLint rules
- Code formatting
- Import order
- Unused variables
- Console statements

**Pass Criteria:** ✅ No errors or warnings

---

### Test 2: Unit & Integration Tests

**Purpose:** Run all 157 automated tests

**Trigger:**
```bash
git push origin feature/my-feature
# CI runs automatically
```

**Manual run:**
```bash
cd backend

# Start test database
docker run -d -p 5432:5432 \
  -e POSTGRES_USER=test_user \
  -e POSTGRES_PASSWORD=test_password \
  -e POSTGRES_DB=test_xrpl_platform \
  postgres:14

# Run tests
DATABASE_URL=postgresql://test_user:test_password@localhost:5432/test_xrpl_platform \
JWT_SECRET=test-jwt-secret-at-least-32-chars \
XRPL_SERVER=wss://s.altnet.rippletest.net:51233 \
npm test
```

**Expected Output:**
```
Test Suites: 12 passed, 12 total
Tests:       157 passed, 157 total
Snapshots:   0 total
Time:        45.678 s
```

**What's Tested:**
- Auth: Registration, login, JWT (12 tests)
- Campaigns: CRUD, validation (18 tests)
- Investments: Creation, XRPL (22 tests)
- Dividends: Calculation, distribution (25 tests)
- Tokens: Issuance, balance (15 tests)
- XRPL: Connection, transactions (20 tests)
- Health: All endpoints (8 tests)
- Middleware: Auth, rate limiting (12 tests)
- Utils: JWT, logger (10 tests)
- Controllers: All endpoints (15 tests)

**Pass Criteria:** ✅ All 157 tests pass

---

### Test 3: Security Audit

**Purpose:** Check for vulnerable dependencies

**Trigger:**
```bash
git push origin feature/my-feature
# CI runs automatically
```

**Manual run:**
```bash
cd backend
npm audit
```

**Expected Output:**
```
found 0 vulnerabilities
```

**What's Tested:**
- Known vulnerabilities in dependencies
- High/critical severity issues
- Outdated packages with security fixes

**Pass Criteria:** ✅ No high or critical vulnerabilities

---

### Test 4: Build Validation

**Purpose:** Verify production build

**Trigger:**
```bash
git push origin feature/my-feature
# CI runs automatically
```

**Manual run:**
```bash
cd backend

# Validate Prisma schema
npx prisma validate

# Generate Prisma client
npx prisma generate

# Verify artifacts
ls -la node_modules/.prisma/client
```

**Expected Output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ The schema is valid
✔ Generated Prisma Client
```

**What's Tested:**
- Prisma schema syntax
- Client generation
- TypeScript types
- Database schema

**Pass Criteria:** ✅ Schema valid, client generated

---

### Test 5: Code Quality Checks

**Purpose:** Validate project structure

**Trigger:**
```bash
git push origin feature/my-feature
# CI runs automatically
```

**Manual run:**
```bash
cd backend

# Check file structure
ls -la package.json src/server.js prisma/schema.prisma

# Check environment documentation
cat .env.example

# Check documentation
ls -la README.md BACKEND_COMPLETE.md
```

**Expected Output:**
```
✅ package.json exists
✅ src/server.js exists
✅ prisma/schema.prisma exists
✅ .env.example exists
✅ README.md exists
✅ BACKEND_COMPLETE.md exists
```

**What's Tested:**
- Required files present
- Environment variables documented
- Documentation complete
- Folder structure correct

**Pass Criteria:** ✅ All files present and valid

---

## CD Pipeline Tests

### Test 6: Staging Deployment

**Purpose:** Deploy to staging environment

**Trigger:**
```bash
git push origin staging
# CD runs automatically
```

**What Happens:**
1. Checkout code
2. Install dependencies
3. Run migrations
4. Deploy to Render
5. Wait 60 seconds
6. Run smoke tests

**Manual verification:**
```bash
# Check deployment
curl https://xrpl-staging.onrender.com/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-01-08T12:00:00.000Z",
  "uptime": 123.45,
  "database": "connected",
  "xrpl": "connected"
}
```

**Pass Criteria:**
- ✅ Deployment successful
- ✅ Migrations applied
- ✅ Service running
- ✅ Smoke tests pass

---

### Test 7: Production Deployment

**Purpose:** Deploy to production environment

**Trigger:**
```bash
git push origin main
# CD runs automatically
```

**What Happens:**
1. Create database backup
2. Run migrations
3. Deploy to Render
4. Wait 90 seconds
5. Run comprehensive smoke tests
6. Create deployment tag

**Manual verification:**
```bash
# Check deployment
curl https://xrpl-api.onrender.com/health

# Check deployment tag
git tag --list "deploy-production-*"
# Should show new tag: deploy-production-20250108-120000
```

**Pass Criteria:**
- ✅ Backup created
- ✅ Migrations applied
- ✅ Deployment successful
- ✅ All smoke tests pass
- ✅ Tag created

---

## Smoke Tests

### Running Smoke Tests

**Automated (part of CD):**
```bash
# Runs automatically after deployment
# Check GitHub Actions logs
```

**Manual:**
```bash
cd backend

# Test staging
API_URL=https://xrpl-staging.onrender.com ./scripts/smoke-tests.sh

# Test production
API_URL=https://xrpl-api.onrender.com ./scripts/smoke-tests.sh

# Test local
API_URL=http://localhost:3000 ./scripts/smoke-tests.sh
```

### Smoke Test Suite

#### Test 8: Health Checks (3 tests)

```bash
# 8.1: Liveness probe
curl https://xrpl-api.onrender.com/health/live
# Expected: {"status":"alive"}

# 8.2: Readiness probe
curl https://xrpl-api.onrender.com/health/ready
# Expected: {"status":"ready"}

# 8.3: Full health check
curl https://xrpl-api.onrender.com/health
# Expected: {"status":"ok","database":"connected","xrpl":"connected"}
```

**Pass Criteria:** ✅ All 3 endpoints return 200

#### Test 9: Security Headers (4 tests)

```bash
# 9.1: HSTS header
curl -I https://xrpl-api.onrender.com/health | grep "Strict-Transport-Security"
# Expected: Strict-Transport-Security: max-age=31536000

# 9.2: X-Frame-Options
curl -I https://xrpl-api.onrender.com/health | grep "X-Frame-Options"
# Expected: X-Frame-Options: DENY

# 9.3: X-Content-Type-Options
curl -I https://xrpl-api.onrender.com/health | grep "X-Content-Type-Options"
# Expected: X-Content-Type-Options: nosniff

# 9.4: X-XSS-Protection
curl -I https://xrpl-api.onrender.com/health | grep "X-XSS-Protection"
# Expected: X-XSS-Protection: 0
```

**Pass Criteria:** ✅ All 4 headers present

#### Test 10: Public API Endpoints (3 tests)

```bash
# 10.1: Campaigns list
curl https://xrpl-api.onrender.com/api/campaigns
# Expected: Array of campaigns (200)

# 10.2: Campaign details (404)
curl -o /dev/null -w "%{http_code}" https://xrpl-api.onrender.com/api/campaigns/999999
# Expected: 404

# 10.3: Nonexistent route
curl -o /dev/null -w "%{http_code}" https://xrpl-api.onrender.com/api/nonexistent
# Expected: 404
```

**Pass Criteria:** ✅ Correct status codes

#### Test 11: Rate Limiting (1 test)

```bash
# Check rate limit headers
curl -I https://xrpl-api.onrender.com/api/campaigns | grep "RateLimit"
# Expected:
# RateLimit-Limit: 100
# RateLimit-Remaining: 99
# RateLimit-Reset: 1704722400
```

**Pass Criteria:** ✅ Rate limit headers present

#### Test 12: Database Connectivity (1 test)

```bash
curl https://xrpl-api.onrender.com/health | jq '.database'
# Expected: "connected"
```

**Pass Criteria:** ✅ Database connected

#### Test 13: XRPL Connectivity (2 tests)

```bash
# 13.1: XRPL status
curl https://xrpl-api.onrender.com/health | jq '.xrpl'
# Expected: "connected"

# 13.2: XRPL balance
curl https://xrpl-api.onrender.com/api/xrpl/balance
# Expected: {"balance": "...", "address": "..."}
```

**Pass Criteria:** ✅ XRPL connected and balance retrieved

#### Test 14: Authentication Flow (2 tests)

```bash
# 14.1: User registration
TIMESTAMP=$(date +%s)
curl -X POST https://xrpl-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test-${TIMESTAMP}@example.com\",
    \"password\": \"Test123456\",
    \"name\": \"Smoke Test User\",
    \"role\": \"INVESTOR\"
  }"
# Expected: {"token": "...", "user": {...}}

# 14.2: Profile with token
TOKEN="<token-from-above>"
curl -H "Authorization: Bearer $TOKEN" \
  https://xrpl-api.onrender.com/api/auth/profile
# Expected: {"id": "...", "email": "...", "name": "..."}
```

**Pass Criteria:** ✅ Registration successful, token works

#### Test 15: Additional Validation (4 tests)

```bash
# 15.1: Response time
time curl https://xrpl-api.onrender.com/health
# Expected: < 2 seconds

# 15.2: JSON format
curl https://xrpl-api.onrender.com/health | jq .
# Expected: Valid JSON

# 15.3: Error handling
curl https://xrpl-api.onrender.com/api/campaigns/invalid-id
# Expected: Error message in JSON

# 15.4: CORS headers
curl -I -H "Origin: https://xrpl-platform.vercel.app" \
  https://xrpl-api.onrender.com/api/campaigns | grep "Access-Control-Allow-Origin"
# Expected: Access-Control-Allow-Origin: https://xrpl-platform.vercel.app
```

**Pass Criteria:** ✅ All validations pass

### Smoke Test Summary

**Expected Output:**
```bash
╔════════════════════════════════════════╗
║     XRPL Platform - Smoke Tests        ║
╚════════════════════════════════════════╝

Target: https://xrpl-api.onrender.com
Timeout: 5s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Health Checks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Testing Liveness probe... ✓ PASS (HTTP 200)
Testing Readiness probe... ✓ PASS (HTTP 200)
Testing Full health check... ✓ PASS (Found key: status)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. Security Headers
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Testing HSTS header... ✓ PASS (Header found: Strict-Transport-Security)
Testing X-Frame-Options... ✓ PASS (Header found: X-Frame-Options)
Testing X-Content-Type-Options... ✓ PASS (Header found: X-Content-Type-Options)
Testing X-XSS-Protection... ✓ PASS (Header found: X-XSS-Protection)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. Public API Endpoints
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Testing Campaigns list... ✓ PASS (HTTP 200)
Testing Campaign details (404)... ✓ PASS (HTTP 404)
Testing Nonexistent route (404)... ✓ PASS (HTTP 404)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. Rate Limiting
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Testing Rate limit headers... ✓ PASS (Header found: RateLimit)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. Database Connectivity
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Testing Database status... ✓ PASS (Found key: database)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. XRPL Connectivity
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Testing XRPL status... ✓ PASS (Found key: xrpl)
Testing XRPL balance... ✓ PASS (HTTP 200)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. Authentication
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Testing user registration... ✓ PASS
Testing authenticated profile... ✓ PASS

╔════════════════════════════════════════╗
║          Test Summary                  ║
╚════════════════════════════════════════╝

Total tests:  20
Passed:       20
Failed:       0

✅ All tests passed! (100%)

🎉 Deployment is healthy and ready for production!
```

---

## Manual Validation

### Test 16: CI Workflow

**Purpose:** Verify CI pipeline works end-to-end

**Steps:**
```bash
# 1. Create feature branch
git checkout -b test/ci-validation

# 2. Make a small change
echo "// Test CI" >> backend/src/server.js

# 3. Commit
git add .
git commit -m "test: validate CI pipeline"

# 4. Push
git push origin test/ci-validation

# 5. Create PR on GitHub
# Target: staging

# 6. Wait for CI to complete
# Check GitHub Actions tab

# 7. Verify all jobs pass
# ✅ lint
# ✅ test
# ✅ security-audit
# ✅ build
# ✅ code-quality
# ✅ summary
```

**Pass Criteria:** ✅ All CI jobs pass

---

### Test 17: CD Staging Workflow

**Purpose:** Verify staging deployment

**Steps:**
```bash
# 1. Merge PR to staging
# (from Test 16)

# 2. Wait for CD to trigger
# Check GitHub Actions

# 3. Monitor deployment
# Logs should show:
# - Dependencies installed
# - Migrations run
# - Render deployment triggered
# - Service started
# - Smoke tests passed

# 4. Verify deployment
curl https://xrpl-staging.onrender.com/health

# 5. Check Render dashboard
# Service should be "Running"
```

**Pass Criteria:**
- ✅ CD workflow successful
- ✅ Staging accessible
- ✅ Smoke tests pass

---

### Test 18: CD Production Workflow

**Purpose:** Verify production deployment

**Steps:**
```bash
# 1. Create PR: staging → main
git checkout staging
git pull origin staging

# Create PR on GitHub
# Title: "Release: <description>"
# Target: main

# 2. Code review
# Get approval from team

# 3. Merge PR

# 4. Monitor CD pipeline
# Check GitHub Actions

# 5. Verify steps:
# ✅ Backup created
# ✅ Migrations run
# ✅ Deployment successful
# ✅ Smoke tests passed
# ✅ Tag created

# 6. Verify production
curl https://xrpl-api.onrender.com/health

# 7. Check deployment tag
git pull origin main
git tag --list "deploy-production-*"
```

**Pass Criteria:**
- ✅ Production deployment successful
- ✅ All smoke tests pass
- ✅ Tag created

---

### Test 19: Rollback

**Purpose:** Verify rollback capability

**Steps:**
```bash
# Option 1: Render Dashboard
# 1. Go to Render dashboard
# 2. Select service
# 3. Events tab
# 4. Find previous deployment
# 5. Click "Rollback"
# 6. Verify service runs old version

# Option 2: Git Revert
# 1. Identify commit to revert
git log --oneline -n 5

# 2. Revert commit
git revert <commit-hash>

# 3. Push
git push origin main

# 4. CD deploys reverted version
# Monitor GitHub Actions

# 5. Verify rollback
curl https://xrpl-api.onrender.com/health
```

**Pass Criteria:**
- ✅ Rollback successful
- ✅ Previous version running
- ✅ Service healthy

---

### Test 20: Manual Deployment

**Purpose:** Verify manual deployment workflow

**Steps:**
```bash
# 1. Go to GitHub repository
# 2. Actions tab
# 3. CD workflow
# 4. Click "Run workflow"
# 5. Select branch: main
# 6. Select environment: staging
# 7. Click "Run workflow"

# 8. Monitor execution
# Check logs

# 9. Verify deployment
curl https://xrpl-staging.onrender.com/health
```

**Pass Criteria:** ✅ Manual deployment successful

---

## Troubleshooting

### CI Failures

#### Lint Errors

**Symptom:** Lint job fails

**Fix:**
```bash
cd backend
npm run lint -- --fix
git add .
git commit -m "style: fix linting errors"
git push
```

#### Test Failures

**Symptom:** Tests fail

**Diagnosis:**
```bash
# Run tests locally
npm test

# Check specific test
npm test -- --testNamePattern="test name"

# Check logs
```

**Fix:**
- Fix failing test
- Update test if behavior changed
- Check environment variables

#### Security Vulnerabilities

**Symptom:** npm audit fails

**Fix:**
```bash
# Update dependencies
npm audit fix

# Check specific vulnerability
npm audit --json | jq

# Update manually if needed
npm update <package>
```

### CD Failures

#### Deployment Timeout

**Symptom:** Deployment exceeds 10 minutes

**Fix:**
- Check Render service logs
- Verify migrations complete
- Increase timeout in workflow

#### Smoke Tests Fail

**Symptom:** Tests fail after deployment

**Diagnosis:**
```bash
# Run manually
API_URL=https://... ./scripts/smoke-tests.sh

# Check specific test
curl -v https://xrpl-api.onrender.com/health
```

**Fix:**
- Check environment variables
- Verify database connection
- Review application logs

---

## Summary

### Phase 7 Test Checklist

**CI Tests:**
- [ ] Test 1: Lint Check (Pass)
- [ ] Test 2: Unit Tests (157/157)
- [ ] Test 3: Security Audit (0 vulnerabilities)
- [ ] Test 4: Build Validation (Success)
- [ ] Test 5: Code Quality (Pass)

**CD Tests:**
- [ ] Test 6: Staging Deployment (Success)
- [ ] Test 7: Production Deployment (Success)

**Smoke Tests:**
- [ ] Test 8: Health Checks (3/3)
- [ ] Test 9: Security Headers (4/4)
- [ ] Test 10: API Endpoints (3/3)
- [ ] Test 11: Rate Limiting (1/1)
- [ ] Test 12: Database (1/1)
- [ ] Test 13: XRPL (2/2)
- [ ] Test 14: Authentication (2/2)
- [ ] Test 15: Additional (4/4)

**Manual Tests:**
- [ ] Test 16: CI Workflow (End-to-end)
- [ ] Test 17: CD Staging (End-to-end)
- [ ] Test 18: CD Production (End-to-end)
- [ ] Test 19: Rollback (Capability)
- [ ] Test 20: Manual Deployment (Workflow)

### Success Criteria

**Phase 7 Complete when:**
- ✅ All CI jobs pass (5/5)
- ✅ All smoke tests pass (20/20)
- ✅ Staging deployment works
- ✅ Production deployment works
- ✅ Rollback tested
- ✅ Documentation complete

### Final Validation

```bash
# Run complete test suite
./scripts/smoke-tests.sh

# Expected: 20/20 tests pass
# Status: ✅ Production Ready
```

---

**Test Suite Version:** 1.0  
**Last Updated:** 2025-01-08  
**Total Tests:** 203  
**Automated:** 188 (93%)  
**Manual:** 15 (7%)
