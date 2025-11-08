# CI/CD Configuration

Complete documentation for Continuous Integration and Continuous Deployment pipelines.

## Table of Contents

- [Overview](#overview)
- [CI Pipeline](#ci-pipeline)
- [CD Pipeline](#cd-pipeline)
- [GitHub Secrets](#github-secrets)
- [Workflows](#workflows)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

### Architecture

```
┌──────────────┐
│   Developer  │
│   git push   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│               GitHub Repository                      │
│  ┌──────────────┐        ┌──────────────┐          │
│  │    main      │        │   staging    │          │
│  │   (prod)     │        │   (staging)  │          │
│  └──────┬───────┘        └──────┬───────┘          │
└─────────┼──────────────────────┼───────────────────┘
          │                      │
          │                      │
    ┌─────▼──────────────────────▼─────┐
    │      GitHub Actions              │
    │  ┌────────────┐  ┌────────────┐ │
    │  │ CI Pipeline│  │ CD Pipeline│ │
    │  └─────┬──────┘  └─────┬──────┘ │
    └────────┼───────────────┼────────┘
             │               │
             │               │
    ┌────────▼───────┐  ┌───▼──────────┐
    │   Lint, Test   │  │   Deploy     │
    │   Security     │  │   Smoke Test │
    │   Build        │  │   Monitor    │
    └────────────────┘  └──────────────┘
```

### Principles

1. **Automation First**: Every deployment automated
2. **Test Everything**: 157 automated tests + smoke tests
3. **Fast Feedback**: CI runs in < 8 minutes
4. **Safety**: Staging before production
5. **Rollback Ready**: Automatic rollback on failure
6. **Visibility**: Clear logs and notifications

---

## CI Pipeline

### Trigger Events

```yaml
on:
  pull_request:
    branches: [main, develop, staging]
  push:
    branches: [main, develop]
  paths:
    - 'backend/**'
    - '.github/workflows/ci.yml'
```

**Triggers on:**
- Any PR to main/develop/staging
- Direct push to main/develop
- Changes to backend code or CI workflow

### Jobs

#### 1. Lint (`lint`)

**Purpose:** Code quality and style checks

**Steps:**
1. Checkout code
2. Setup Node.js 18
3. Install dependencies (`npm ci`)
4. Run ESLint
5. Check code formatting

**Duration:** ~2 minutes

**Fail conditions:**
- ESLint errors
- Formatting violations

#### 2. Test (`test`)

**Purpose:** Run full test suite

**Environment:**
- PostgreSQL 14 service
- Test database: `test_xrpl_platform`

**Steps:**
1. Checkout code
2. Setup Node.js 18
3. Start PostgreSQL service
4. Install dependencies
5. Run Prisma migrations
6. Seed test data
7. Run npm test (157 tests)
8. Verify server starts

**Duration:** ~4 minutes

**Fail conditions:**
- Any test fails
- Migration errors
- Server won't start

#### 3. Security Audit (`security-audit`)

**Purpose:** Check for vulnerable dependencies

**Steps:**
1. Checkout code
2. Setup Node.js 18
3. Install dependencies
4. Run `npm audit`

**Duration:** ~1 minute

**Fail conditions:**
- High or critical vulnerabilities

#### 4. Build (`build`)

**Purpose:** Verify production build

**Steps:**
1. Checkout code
2. Setup Node.js 18
3. Install dependencies
4. Validate Prisma schema
5. Generate Prisma client
6. Verify artifacts

**Duration:** ~2 minutes

**Fail conditions:**
- Schema validation errors
- Client generation fails

#### 5. Code Quality (`code-quality`)

**Purpose:** Check project structure

**Steps:**
1. Verify file structure
2. Check environment documentation
3. Validate documentation completeness

**Duration:** ~30 seconds

**Fail conditions:**
- Missing required files
- Incomplete documentation

#### 6. Summary (`summary`)

**Purpose:** Aggregate all results

**Steps:**
1. Check all job results
2. Generate summary
3. Report overall status

**Depends on:** All other jobs

**Fail conditions:**
- Any job failed

### Success Criteria

**All jobs must pass:**
- ✅ No linting errors
- ✅ All 157 tests pass
- ✅ No security vulnerabilities
- ✅ Build successful
- ✅ Code quality checks pass

### Failure Handling

**If CI fails:**
1. PR cannot be merged
2. GitHub shows red X
3. Review logs to identify issue
4. Fix and push again
5. CI runs automatically

---

## CD Pipeline

### Deployment Environments

| Environment | Branch    | Trigger           | Approval |
|-------------|-----------|-------------------|----------|
| Staging     | `staging` | Push to staging   | No       |
| Production  | `main`    | Push to main      | Yes      |

### Staging Deployment (`deploy-staging`)

**Trigger:**
- Push to `staging` branch
- Manual dispatch with environment: staging

**Steps:**
1. Checkout code
2. Setup Node.js 18
3. Install production dependencies
4. Run migrations (`prisma migrate deploy`)
5. Trigger Render deployment
6. Wait 60 seconds
7. Run smoke tests
8. Notify success/failure

**Duration:** ~3 minutes

**Environment:** `staging`  
**URL:** https://xrpl-staging.onrender.com

**Smoke tests (3 tests):**
- ✅ Liveness check
- ⚠️ Readiness check (warning only)
- ⚠️ Full health check (warning only)

### Production Deployment (`deploy-production`)

**Trigger:**
- Push to `main` branch
- Manual dispatch with environment: production

**Steps:**
1. Checkout code
2. Setup Node.js 18
3. Install production dependencies
4. **Create database backup** 🔒
5. Run migrations (`prisma migrate deploy`)
6. Trigger Render deployment
7. Wait 90 seconds
8. Run comprehensive smoke tests
9. Create deployment tag
10. Notify success/failure

**Duration:** ~5 minutes

**Environment:** `production`  
**URL:** https://xrpl-api.onrender.com

**Comprehensive smoke tests (7 tests):**
1. ✅ Liveness check (must pass)
2. ✅ Readiness check
3. ✅ Full health check
4. ✅ Security headers present
5. ✅ Rate limiting active
6. ✅ 404 handling works
7. ✅ Response times acceptable

**Fail conditions:**
- Any critical test fails (liveness, security headers)
- Response time > 2 seconds
- Database not ready

### Integration Tests (`integration-tests`)

**Trigger:** After staging deployment

**Tests:**
1. User registration
2. Campaigns endpoint
3. Authentication flow

**Duration:** ~1 minute

### Deployment Summary (`deployment-summary`)

**Trigger:** Always (after all deployments)

**Purpose:**
- Aggregate deployment results
- Show summary
- Mark overall success/failure

---

## GitHub Secrets

### Required Secrets

#### CI Secrets

```bash
# Testing
DATABASE_URL=postgresql://test_user:test_password@localhost:5432/test_xrpl_platform
JWT_SECRET=test-jwt-secret-at-least-32-characters-long-for-security
XRPL_SERVER=wss://s.altnet.rippletest.net:51233
XRPL_PLATFORM_SEED=sEdTxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### CD Secrets

```bash
# Render API
RENDER_API_KEY=rnd_xxxxxxxxxxxxxxxxxxxxxxxx

# Render Service IDs
RENDER_STAGING_SERVICE_ID=srv-xxxxxxxxxxxxxxxx
RENDER_PRODUCTION_SERVICE_ID=srv-yyyyyyyyyyyyyyyy

# Database URLs
STAGING_DATABASE_URL=postgresql://user:pass@dpg-xxx.frankfurt-postgres.render.com/staging_db
PRODUCTION_DATABASE_URL=postgresql://user:pass@dpg-yyy.frankfurt-postgres.render.com/production_db
```

### How to Add Secrets

1. Go to GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `SECRET_NAME`
5. Value: `secret_value`
6. Click "Add secret"

### Secret Security

**Best practices:**
- ✅ Never commit secrets to code
- ✅ Use different secrets for each environment
- ✅ Rotate secrets regularly (every 90 days)
- ✅ Limit access to secrets
- ✅ Use minimum required permissions
- ❌ Don't log secrets
- ❌ Don't echo secrets in workflows

---

## Workflows

### File Structure

```
.github/
├── workflows/
│   ├── ci.yml              # Continuous Integration
│   └── cd.yml              # Continuous Deployment
├── ISSUE_TEMPLATE/
│   ├── bug_report.yml      # Bug report template
│   └── feature_request.yml # Feature request template
└── PULL_REQUEST_TEMPLATE.md # PR template
```

### CI Workflow (ci.yml)

**File:** `.github/workflows/ci.yml`

**Key configuration:**

```yaml
name: CI - Lint, Test, Build

on:
  pull_request:
    branches: [main, develop, staging]
  push:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: test_xrpl_platform
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm test
```

### CD Workflow (cd.yml)

**File:** `.github/workflows/cd.yml`

**Key configuration:**

```yaml
name: CD - Deploy to Staging/Production

on:
  push:
    branches: [staging, main]
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [staging, production]

jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/staging'
    environment:
      name: staging
      url: https://xrpl-staging.onrender.com
    steps:
      - uses: actions/checkout@v4
      - run: npx prisma migrate deploy
      - run: curl -X POST $RENDER_DEPLOY_HOOK
      - run: ./scripts/smoke-tests.sh

  deploy-production:
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://xrpl-api.onrender.com
    steps:
      - uses: actions/checkout@v4
      - run: # Create backup
      - run: npx prisma migrate deploy
      - run: curl -X POST $RENDER_DEPLOY_HOOK
      - run: ./scripts/smoke-tests.sh
      - run: git tag deploy-$(date +%Y%m%d-%H%M%S)
```

### Manual Workflow Dispatch

**Trigger manual deployment:**

1. Go to GitHub repository
2. Actions → CD workflow
3. Click "Run workflow"
4. Select environment (staging/production)
5. Click "Run workflow"

**Use cases:**
- Emergency deployment
- Rollback to specific commit
- Test deployment process

---

## Best Practices

### Branch Strategy

```
main (production)
 ├── staging (pre-production)
 │    ├── feature/XYZ-123-add-feature
 │    ├── bugfix/XYZ-456-fix-bug
 │    └── hotfix/XYZ-789-critical-fix
 └── develop (development)
```

**Branch naming:**
- `feature/<issue>-short-description`
- `bugfix/<issue>-short-description`
- `hotfix/<issue>-short-description`

### Commit Messages

**Format:** `type(scope): description`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

**Examples:**
```bash
feat(auth): add JWT refresh tokens
fix(campaigns): correct investment calculation
docs(api): update endpoint documentation
```

### Pull Request Process

1. **Create feature branch**
   ```bash
   git checkout -b feature/123-my-feature
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

3. **Push and create PR**
   ```bash
   git push origin feature/123-my-feature
   # Create PR on GitHub
   ```

4. **CI runs automatically**
   - Wait for green checkmarks
   - Fix any failures

5. **Code review**
   - Request review from team
   - Address feedback

6. **Merge to staging**
   - Squash and merge
   - Delete branch

7. **Test on staging**
   - Verify functionality
   - Run smoke tests

8. **Create PR to main**
   - staging → main
   - Final review

9. **Deploy to production**
   - Merge to main
   - Monitor deployment

### Code Review Guidelines

**Reviewers check:**
- [ ] Code logic correct
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Security implications
- [ ] Performance impact
- [ ] Breaking changes noted
- [ ] Migration safety

**Review time:** < 24 hours

### Testing Strategy

**Test pyramid:**

```
       ┌─────────┐
       │   E2E   │  (Integration tests: 10%)
       ├─────────┤
       │ Integration│  (API tests: 30%)
       ├─────────┤
       │   Unit    │  (Unit tests: 60%)
       └─────────┘
```

**Coverage targets:**
- Unit: 80%+
- Integration: 70%+
- E2E: Critical paths

### Deployment Frequency

**Targets:**
- Staging: Multiple times per day
- Production: 1-2 times per week
- Hotfixes: As needed (< 1 hour)

**Metrics:**
- Lead time: < 1 day
- MTTR: < 1 hour
- Change failure rate: < 5%
- Deployment success rate: > 95%

---

## Troubleshooting

### CI Failures

#### Lint Errors

**Symptom:** ESLint job fails

**Diagnosis:**
```bash
# Run locally
npm run lint
```

**Fix:**
```bash
# Auto-fix
npm run lint -- --fix

# Commit fixes
git add .
git commit -m "style: fix linting errors"
git push
```

#### Test Failures

**Symptom:** Test job fails

**Diagnosis:**
```bash
# Run locally with same DB
docker run -d -p 5432:5432 \
  -e POSTGRES_USER=test_user \
  -e POSTGRES_PASSWORD=test_password \
  -e POSTGRES_DB=test_xrpl_platform \
  postgres:14

# Run tests
DATABASE_URL=postgresql://test_user:test_password@localhost:5432/test_xrpl_platform \
npm test
```

**Fix:**
- Fix failing tests
- Update tests if behavior changed
- Commit and push

#### Security Vulnerabilities

**Symptom:** npm audit fails

**Diagnosis:**
```bash
# Check vulnerabilities
npm audit

# See details
npm audit --json
```

**Fix:**
```bash
# Update dependencies
npm audit fix

# If can't auto-fix
npm update <package>

# Commit lockfile
git add package-lock.json
git commit -m "chore: update dependencies for security"
git push
```

### CD Failures

#### Migration Errors

**Symptom:** Prisma migrate deploy fails

**Diagnosis:**
```bash
# Check migration file
cat prisma/migrations/MIGRATION/migration.sql

# Test locally
DATABASE_URL=<staging-url> npx prisma migrate deploy
```

**Fix:**
- Fix SQL errors
- Test on staging first
- Create new migration if needed

#### Deployment Timeout

**Symptom:** Deployment takes too long

**Diagnosis:**
- Check Render service logs
- Look for startup errors
- Verify migrations complete

**Fix:**
- Increase timeout in workflow
- Optimize migrations
- Split large migrations

#### Smoke Tests Fail

**Symptom:** Smoke tests fail after deployment

**Diagnosis:**
```bash
# Run manually
API_URL=https://xrpl-staging.onrender.com \
./backend/scripts/smoke-tests.sh
```

**Fix:**
- Check specific test failure
- Verify environment variables
- Check database connection
- Review application logs

### Rollback

**If deployment fails:**

```bash
# 1. Find previous successful deployment
git log --oneline

# 2. Revert to that commit
git revert <commit-hash>

# 3. Push (triggers new deployment)
git push origin main

# Or use Render dashboard to rollback
```

---

## Monitoring

### Workflow Status

**Check status:**
- GitHub repository → Actions tab
- View workflow runs
- Click run for details

**Status badges:**
```markdown
![CI](https://github.com/USER/REPO/workflows/CI/badge.svg)
![CD](https://github.com/USER/REPO/workflows/CD/badge.svg)
```

### Notifications

**GitHub notifications:**
- Workflow failures
- PR status checks
- Review requests

**Configure:**
1. GitHub Settings → Notifications
2. Enable workflow notifications
3. Choose email/web/mobile

### Metrics

**Track:**
- Build duration (target: < 8 min)
- Test pass rate (target: 100%)
- Deployment frequency (target: daily)
- MTTR (target: < 1 hour)
- Change failure rate (target: < 5%)

**View in:**
- GitHub Actions dashboard
- GitHub Insights
- Custom dashboard (optional)

---

## Resources

### Documentation

- [GitHub Actions Docs](https://docs.github.com/actions)
- [Render Deployment Docs](https://render.com/docs/deploys)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)

### Tools

- [act](https://github.com/nektos/act) - Run GitHub Actions locally
- [actionlint](https://github.com/rhysd/actionlint) - Lint workflows
- [GitHub CLI](https://cli.github.com/) - Manage workflows from terminal

### Templates

- [CI Workflow](./.github/workflows/ci.yml)
- [CD Workflow](./.github/workflows/cd.yml)
- [PR Template](./.github/PULL_REQUEST_TEMPLATE.md)

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-08  
**Maintained By:** DevOps Team
