# ⚙️ Operations Guide - XRPL Crowdfunding Platform

## Table des matières
1. [Déploiement](#déploiement)
2. [Monitoring & Alertes](#monitoring--alertes)
3. [Backup & Recovery](#backup--recovery)
4. [Wallet Management](#wallet-management)
5. [Maintenance](#maintenance)
6. [Scaling](#scaling)
7. [Troubleshooting](#troubleshooting)
8. [Runbooks](#runbooks)

---

## Déploiement

### Architecture de déploiement

```
┌────────────────────────────────────────────┐
│              Load Balancer                 │
│         (nginx/AWS ALB/Cloudflare)        │
└────────────────┬───────────────────────────┘
                 │
       ┌─────────┴──────────┐
       │                    │
┌──────▼──────┐      ┌──────▼──────┐
│   Node.js   │      │   Node.js   │
│   Instance  │      │   Instance  │
│   (API)     │      │   (API)     │
└──────┬──────┘      └──────┬──────┘
       │                    │
       └─────────┬──────────┘
                 │
       ┌─────────▼──────────┐
       │                    │
┌──────▼──────┐      ┌──────▼──────┐
│  PostgreSQL │      │ XRPL Network│
│  (Primary)  │      │  (Mainnet)  │
└─────────────┘      └─────────────┘
```

### Prérequis

```bash
# Serveur requirements
- Ubuntu 22.04 LTS ou supérieur
- Node.js 18.x ou supérieur
- PostgreSQL 14.x ou supérieur
- Minimum 2GB RAM, 2 CPU cores
- 20GB SSD storage

# Réseau
- Port 443 (HTTPS) ouvert
- Port 5432 (PostgreSQL) fermé externe, ouvert interne
- Accès sortant vers XRPL Mainnet (wss://)
```

### Installation

#### 1. Préparation serveur

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 (process manager)
sudo npm install -g pm2

# Install nginx (reverse proxy)
sudo apt install -y nginx certbot python3-certbot-nginx
```

#### 2. Configuration PostgreSQL

```bash
# Create database and user
sudo -u postgres psql

postgres=# CREATE DATABASE xrpl_platform;
postgres=# CREATE USER xrpl_user WITH ENCRYPTED PASSWORD 'secure_password_here';
postgres=# GRANT ALL PRIVILEGES ON DATABASE xrpl_platform TO xrpl_user;
postgres=# \q

# Configure PostgreSQL for remote connections (si nécessaire)
sudo nano /etc/postgresql/14/main/postgresql.conf
# listen_addresses = 'localhost'  # Production: localhost only

sudo nano /etc/postgresql/14/main/pg_hba.conf
# local   xrpl_platform   xrpl_user   md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### 3. Déploiement application

```bash
# Clone repository (ou déploiement via CI/CD)
cd /opt
sudo git clone https://github.com/your-org/xrpl-platform.git
cd xrpl-platform/backend

# Install dependencies
npm ci --production

# Create .env.production
sudo nano .env.production
# (Copier configuration depuis SECURITY_GUIDE.md)

# Run migrations
npm run migrate:prod

# Build (si TypeScript)
npm run build

# Test configuration
npm run start:test
```

#### 4. Configuration PM2

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'xrpl-platform',
    script: './src/server.js',
    instances: 2,  // Cluster mode
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/xrpl-platform/pm2-error.log',
    out_file: '/var/log/xrpl-platform/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '500M',
    autorestart: true,
    watch: false
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 startup script
pm2 startup systemd
# Execute la commande générée

# Verify
pm2 status
pm2 logs xrpl-platform
```

#### 5. Configuration Nginx

```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/xrpl-platform

server {
    listen 80;
    server_name api.example.com;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/xrpl-platform /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Setup SSL with Let's Encrypt
sudo certbot --nginx -d api.example.com
```

### CI/CD Pipeline (GitHub Actions example)

```yaml
# .github/workflows/deploy-production.yml
name: Deploy Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to production
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          HOST: ${{ secrets.PRODUCTION_HOST }}
        run: |
          echo "$SSH_PRIVATE_KEY" > deploy_key
          chmod 600 deploy_key
          
          ssh -i deploy_key -o StrictHostKeyChecking=no user@$HOST << 'ENDSSH'
            cd /opt/xrpl-platform/backend
            git pull origin main
            npm ci --production
            npm run migrate:prod
            pm2 reload xrpl-platform
          ENDSSH
      
      - name: Health check
        run: |
          sleep 10
          curl -f https://api.example.com/health || exit 1
```

---

## Monitoring & Alertes

### Health Checks

#### Endpoints disponibles

```bash
# Full health check (DB + XRPL + Wallet)
curl https://api.example.com/health

# Readiness check (pour load balancer)
curl https://api.example.com/health/ready

# Liveness check (simple ping)
curl https://api.example.com/health/live
```

#### Configuration monitoring externe

**Uptime monitoring** (UptimeRobot, Pingdom, etc.)

```yaml
monitors:
  - name: "API Health Check"
    url: "https://api.example.com/health"
    interval: 5  # minutes
    expected_status: 200
    alert_contacts:
      - email: ops@company.com
      - sms: +XX XXX XXX XXX
    
  - name: "API Readiness"
    url: "https://api.example.com/health/ready"
    interval: 1  # minutes
    expected_status: 200
```

### Métriques clés

#### 1. Application Metrics

```javascript
// À monitorer via Prometheus/Datadog/New Relic

// API Performance
- requests_per_second
- average_response_time_ms
- error_rate_percent
- p95_response_time_ms
- p99_response_time_ms

// Business Metrics
- active_campaigns_count
- total_investments_value
- xrpl_transactions_count
- dividend_distributions_count

// Resource Usage
- cpu_usage_percent
- memory_usage_mb
- event_loop_lag_ms
- gc_pause_time_ms
```

#### 2. Database Metrics

```sql
-- Queries lentes
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '1 second'
ORDER BY duration DESC;

-- Connections actives
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Database size
SELECT pg_size_pretty(pg_database_size('xrpl_platform'));

-- Table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

#### 3. XRPL Metrics

```javascript
// À logger et monitorer
- wallet_balance_xrp
- transactions_per_day
- failed_transactions_count
- average_transaction_fee
- connection_uptime_percent
```

### Alertes recommandées

```yaml
alerts:
  # Critical (PagerDuty + SMS)
  - name: "API Down"
    condition: "health_check_fails > 2 consecutive"
    severity: "critical"
    notification: ["pagerduty", "sms"]
    
  - name: "Database Down"
    condition: "db_connection_fails"
    severity: "critical"
    notification: ["pagerduty", "sms"]
    
  - name: "XRPL Disconnected"
    condition: "xrpl_connection_down > 5 minutes"
    severity: "critical"
    notification: ["pagerduty", "sms"]
    
  - name: "Wallet Balance Critical"
    condition: "wallet_balance_xrp < 5"
    severity: "critical"
    notification: ["pagerduty", "email"]
  
  # Warning (Email + Slack)
  - name: "High Error Rate"
    condition: "error_rate > 5% for 5 minutes"
    severity: "warning"
    notification: ["email", "slack"]
    
  - name: "Slow Response Time"
    condition: "p95_response_time > 2000ms for 10 minutes"
    severity: "warning"
    notification: ["email", "slack"]
    
  - name: "Wallet Balance Low"
    condition: "wallet_balance_xrp < 50"
    severity: "warning"
    notification: ["email", "slack"]
    
  - name: "High Memory Usage"
    condition: "memory_usage > 80%"
    severity: "warning"
    notification: ["email", "slack"]
  
  # Info (Slack only)
  - name: "Daily Summary"
    schedule: "0 9 * * *"  # 9AM daily
    severity: "info"
    notification: ["slack"]
    metrics:
      - new_campaigns
      - total_investments
      - xrpl_transactions
      - error_count
```

### Dashboards

#### Grafana Dashboard Example

```json
{
  "dashboard": {
    "title": "XRPL Platform Production",
    "panels": [
      {
        "title": "Requests per Second",
        "type": "graph",
        "targets": [
          {"expr": "rate(http_requests_total[5m])"}
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {"expr": "rate(http_errors_total[5m]) / rate(http_requests_total[5m])"}
        ]
      },
      {
        "title": "Response Time (p95)",
        "type": "graph",
        "targets": [
          {"expr": "histogram_quantile(0.95, http_request_duration_seconds)"}
        ]
      },
      {
        "title": "Wallet Balance",
        "type": "singlestat",
        "targets": [
          {"expr": "xrpl_wallet_balance_xrp"}
        ]
      },
      {
        "title": "Active Campaigns",
        "type": "singlestat",
        "targets": [
          {"expr": "campaigns_active_count"}
        ]
      }
    ]
  }
}
```

---

## Backup & Recovery

### Strategy de backup

```
┌──────────────────────────────────────────┐
│         Backup Strategy 3-2-1            │
├──────────────────────────────────────────┤
│ 3 copies: Production + 2 backups         │
│ 2 types de média: Disk + Cloud          │
│ 1 copie off-site: S3/Azure/GCP          │
└──────────────────────────────────────────┘
```

### 1. Database Backup

#### Backup automatique quotidien

```bash
#!/bin/bash
# /opt/scripts/backup-database.sh

DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/backup/postgres"
S3_BUCKET="s3://xrpl-platform-backups"
DB_NAME="xrpl_platform"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump database
pg_dump -U xrpl_user -h localhost $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Verify backup
if [ $? -eq 0 ]; then
    echo "[$(date)] Backup successful: backup_$DATE.sql.gz"
    
    # Upload to S3
    aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz $S3_BUCKET/daily/
    
    # Remove old backups
    find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    # Log
    echo "[$(date)] Backup uploaded to S3 and old backups cleaned"
else
    echo "[$(date)] Backup FAILED!"
    # Send alert
    curl -X POST https://hooks.slack.com/services/XXX \
      -d '{"text":"Database backup FAILED!"}'
    exit 1
fi
```

#### Crontab configuration

```bash
# Edit crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /opt/scripts/backup-database.sh >> /var/log/backup.log 2>&1

# Weekly full backup (Sundays at 3 AM)
0 3 * * 0 /opt/scripts/backup-database-full.sh >> /var/log/backup.log 2>&1
```

### 2. Wallet Backup

#### Backup XRPL wallet seed

```bash
#!/bin/bash
# /opt/scripts/backup-wallet-seed.sh

# IMPORTANT: Ce script doit être exécuté manuellement et sécurisé

WALLET_SEED=$1
OUTPUT_FILE="wallet_backup_$(date +%Y%m%d).gpg"

if [ -z "$WALLET_SEED" ]; then
    echo "Usage: $0 <wallet_seed>"
    exit 1
fi

# Encrypt wallet seed with GPG
echo $WALLET_SEED | gpg --symmetric --cipher-algo AES256 --output $OUTPUT_FILE

echo "Wallet seed encrypted to: $OUTPUT_FILE"
echo "Store this file in 3 secure locations:"
echo "1. USB drive in safe"
echo "2. Encrypted cloud storage"
echo "3. Secondary secure location"

# Shred original input
shred -u -z input.txt 2>/dev/null || true
```

#### Paper Wallet (Recommandé)

```
┌────────────────────────────────────────┐
│     XRPL Platform - Production Wallet  │
├────────────────────────────────────────┤
│ Address:                               │
│ rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX    │
│                                        │
│ Seed: (ULTRA SECRET - NEVER SHARE)    │
│ sXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX    │
│                                        │
│ Created: 2025-01-XX                   │
│ Purpose: Production Platform Wallet    │
└────────────────────────────────────────┘

Instructions:
1. Store in fireproof safe
2. Make 3 copies, different locations
3. Never photograph or scan
4. Destroy if compromised
```

### 3. Application Logs Backup

```bash
#!/bin/bash
# /opt/scripts/backup-logs.sh

DATE=$(date +%Y-%m-%d)
LOGS_DIR="/var/log/xrpl-platform"
BACKUP_DIR="/backup/logs"
S3_BUCKET="s3://xrpl-platform-backups"

# Compress logs older than 1 day
find $LOGS_DIR -name "*.log" -mtime +1 -exec gzip {} \;

# Archive logs
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz $LOGS_DIR/*.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/logs_$DATE.tar.gz $S3_BUCKET/logs/

# Remove compressed logs older than 7 days
find $LOGS_DIR -name "*.log.gz" -mtime +7 -delete

# Remove archives older than 30 days
find $BACKUP_DIR -name "logs_*.tar.gz" -mtime +30 -delete
```

### Recovery Procedures

#### 1. Database Recovery

```bash
# Full database restore
#!/bin/bash

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    exit 1
fi

# Stop application
pm2 stop xrpl-platform

# Drop and recreate database
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS xrpl_platform;
CREATE DATABASE xrpl_platform;
GRANT ALL PRIVILEGES ON DATABASE xrpl_platform TO xrpl_user;
EOF

# Restore from backup
gunzip -c $BACKUP_FILE | sudo -u postgres psql -U xrpl_user xrpl_platform

# Verify
sudo -u postgres psql -U xrpl_user xrpl_platform -c "\dt"

# Restart application
pm2 start xrpl-platform

# Health check
sleep 5
curl http://localhost:3000/health
```

#### 2. Point-in-Time Recovery

```bash
# Restore to specific point (requires WAL archiving)
pg_restore -d xrpl_platform -t "2025-01-15 14:30:00" backup.dump
```

#### 3. Wallet Recovery

```bash
# Decrypt wallet seed
gpg --decrypt wallet_backup_20250115.gpg

# Update .env.production with recovered seed
nano /opt/xrpl-platform/backend/.env.production
# XRPL_PLATFORM_SEED="sXXXXXXXXXXXXXXXXXXX"

# Restart application
pm2 restart xrpl-platform

# Verify wallet
curl http://localhost:3000/health
# Check wallet.address and wallet.balance
```

### Backup Testing

```bash
#!/bin/bash
# /opt/scripts/test-backup-restore.sh

# Test database restore on staging environment
echo "Testing backup restore..."

# 1. Get latest backup
LATEST_BACKUP=$(ls -t /backup/postgres/backup_*.sql.gz | head -1)

# 2. Restore to staging database
gunzip -c $LATEST_BACKUP | psql -h staging-db -U xrpl_user xrpl_platform_staging

# 3. Verify data integrity
psql -h staging-db -U xrpl_user xrpl_platform_staging -c "SELECT COUNT(*) FROM users;"
psql -h staging-db -U xrpl_user xrpl_platform_staging -c "SELECT COUNT(*) FROM campaigns;"

# 4. Report
if [ $? -eq 0 ]; then
    echo "✅ Backup restore test PASSED"
else
    echo "❌ Backup restore test FAILED"
    # Send alert
fi
```

**Fréquence test restore**: Mensuel (1er de chaque mois)

---

## Wallet Management

### Daily Operations

#### 1. Check Wallet Balance

```bash
#!/bin/bash
# /opt/scripts/check-wallet-balance.sh

# Call API health endpoint
curl -s http://localhost:3000/health | jq '.checks.wallet'

# Or direct XRPL query
node << EOF
const { Client } = require('xrpl');
const client = new Client('wss://xrplcluster.com');

(async () => {
  await client.connect();
  const response = await client.request({
    command: 'account_info',
    account: 'rXXXXXXXXXXXXXXXXXXXXX',
    ledger_index: 'validated'
  });
  const balance = parseFloat(response.result.account_data.Balance) / 1000000;
  console.log(\`Wallet balance: \${balance} XRP\`);
  await client.disconnect();
})();
EOF
```

#### 2. Fund Wallet (Si balance bas)

```bash
# Manual funding process
1. Buy XRP on exchange (Coinbase, Kraken, Binance)
2. Withdraw to platform wallet address
3. Verify receipt: check-wallet-balance.sh
4. Update monitoring dashboard
```

#### 3. Monitor Transactions

```bash
# View recent transactions
tail -f /var/log/xrpl-platform/xrpl-$(date +%Y-%m-%d).log | jq '.'

# Count transactions today
grep "XRPL transaction" /var/log/xrpl-platform/xrpl-$(date +%Y-%m-%d).log | wc -l

# Failed transactions
grep "XRPL transaction" /var/log/xrpl-platform/xrpl-$(date +%Y-%m-%d).log | grep "success\":false"
```

### Wallet Rotation

```bash
#!/bin/bash
# /opt/scripts/rotate-wallet.sh
# IMPORTANT: Execute during maintenance window

echo "=== Wallet Rotation Procedure ==="
echo "1. Generate new wallet"
node scripts/generate-wallet.js > new_wallet.txt

NEW_ADDRESS=$(cat new_wallet.txt | grep "Address:" | awk '{print $2}')
NEW_SEED=$(cat new_wallet.txt | grep "Seed:" | awk '{print $2}')

echo "New wallet address: $NEW_ADDRESS"

echo "2. Transfer funds to new wallet"
read -p "Current platform wallet seed: " OLD_SEED

node << EOF
const { Client, Wallet, xrpToDrops } = require('xrpl');

(async () => {
  const client = new Client('wss://xrplcluster.com');
  await client.connect();
  
  const oldWallet = Wallet.fromSeed('$OLD_SEED');
  const newAddress = '$NEW_ADDRESS';
  
  // Get balance
  const accountInfo = await client.request({
    command: 'account_info',
    account: oldWallet.address,
    ledger_index: 'validated'
  });
  
  const balance = parseFloat(accountInfo.result.account_data.Balance) / 1000000;
  const transferAmount = balance - 1; // Keep 1 XRP for fees
  
  console.log(\`Transferring \${transferAmount} XRP from \${oldWallet.address} to \${newAddress}\`);
  
  // Transfer
  const payment = {
    TransactionType: 'Payment',
    Account: oldWallet.address,
    Destination: newAddress,
    Amount: xrpToDrops(transferAmount)
  };
  
  const prepared = await client.autofill(payment);
  const signed = oldWallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);
  
  console.log(\`Transfer complete. Hash: \${result.result.hash}\`);
  
  await client.disconnect();
})();
EOF

echo "3. Update .env.production"
sed -i "s/XRPL_PLATFORM_SEED=.*/XRPL_PLATFORM_SEED=\"$NEW_SEED\"/" /opt/xrpl-platform/backend/.env.production

echo "4. Restart application"
pm2 restart xrpl-platform

echo "5. Verify new wallet"
sleep 5
curl http://localhost:3000/health | jq '.checks.wallet'

echo "6. Backup new wallet seed"
echo $NEW_SEED | gpg --symmetric --cipher-algo AES256 --output wallet_backup_$(date +%Y%m%d).gpg

echo "✅ Wallet rotation complete!"
echo "⚠️  Store encrypted backup in 3 secure locations"
echo "⚠️  Shred old wallet seed securely"
```

---

## Maintenance

### Weekly Maintenance Tasks

```bash
#!/bin/bash
# /opt/scripts/weekly-maintenance.sh

echo "=== Weekly Maintenance - $(date) ==="

# 1. Update packages
echo "1. Checking for package updates..."
cd /opt/xrpl-platform/backend
npm outdated

# 2. Check disk space
echo "2. Checking disk space..."
df -h

# 3. Analyze database
echo "3. Analyzing database..."
psql -U xrpl_user xrpl_platform -c "ANALYZE;"
psql -U xrpl_user xrpl_platform -c "VACUUM;"

# 4. Review logs for errors
echo "4. Reviewing error logs..."
grep -i "error" /var/log/xrpl-platform/error-$(date +%Y-%m-%d).log | tail -20

# 5. Check PM2 status
echo "5. Checking PM2 processes..."
pm2 status
pm2 monit --lines 20

# 6. Verify backups
echo "6. Verifying recent backups..."
ls -lh /backup/postgres/ | tail -7

# 7. Security audit
echo "7. Running security audit..."
npm audit --production

echo "=== Maintenance Complete ==="
```

### Monthly Maintenance Tasks

```bash
# 1. Security updates
sudo apt update && sudo apt upgrade -y

# 2. Certificate renewal (if not auto-renewing)
sudo certbot renew

# 3. Database optimization
psql -U xrpl_user xrpl_platform -c "VACUUM FULL;"
psql -U xrpl_user xrpl_platform -c "REINDEX DATABASE xrpl_platform;"

# 4. Log rotation verification
logrotate -f /etc/logrotate.conf

# 5. Backup restore test
/opt/scripts/test-backup-restore.sh

# 6. Review monitoring dashboards
# - Check for trends
# - Adjust alert thresholds
# - Update documentation
```

### Updating Dependencies

```bash
#!/bin/bash
# /opt/scripts/update-dependencies.sh

cd /opt/xrpl-platform/backend

echo "Current versions:"
npm list --depth=0

echo "Checking for updates..."
npm outdated

echo "Updating patch versions (safe)..."
npm update

echo "Running tests..."
npm test

if [ $? -eq 0 ]; then
    echo "✅ Tests passed. Restarting application..."
    pm2 restart xrpl-platform
else
    echo "❌ Tests failed. Rolling back..."
    git checkout package-lock.json
    npm ci
fi
```

---

## Scaling

### Vertical Scaling (Scale Up)

```bash
# Increase server resources
# - CPU: 2 → 4 cores
# - RAM: 2GB → 8GB
# - Storage: 20GB → 100GB SSD

# Update PM2 instances
pm2 scale xrpl-platform 4  # 4 instances instead of 2

# Update database connection pool
# .env.production
DATABASE_URL="...&connection_limit=20"  # was 10
```

### Horizontal Scaling (Scale Out)

```
┌─────────────────────────────────────────┐
│          Load Balancer (nginx)          │
│        (Round-robin / Least conn)       │
└────────┬────────────┬───────────────────┘
         │            │
    ┌────▼────┐  ┌────▼────┐
    │ Node 1  │  │ Node 2  │
    │ 2 inst  │  │ 2 inst  │
    └────┬────┘  └────┬────┘
         │            │
         └─────┬──────┘
               │
        ┌──────▼──────┐
        │ PostgreSQL  │
        │  (Primary)  │
        └─────────────┘
```

#### Load Balancer Configuration

```nginx
# /etc/nginx/nginx.conf

upstream xrpl_backend {
    least_conn;  # or ip_hash for sticky sessions
    
    server 10.0.1.10:3000 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:3000 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:3000 backup;  # backup server
}

server {
    listen 443 ssl http2;
    server_name api.example.com;
    
    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
    
    location / {
        proxy_pass http://xrpl_backend;
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Database Scaling

#### Read Replicas

```
┌────────────────────────────────────────┐
│        PostgreSQL Architecture         │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────┐                         │
│  │ Primary  │ ← Write operations      │
│  │  (RW)    │                         │
│  └────┬─────┘                         │
│       │ replication                    │
│  ┌────┴────┬────────┐                 │
│  │         │        │                 │
│  ▼         ▼        ▼                 │
│ Rep1     Rep2     Rep3                │
│ (RO)     (RO)     (RO)                │
│  ↑        ↑        ↑                  │
│  └────────┴────────┘                  │
│   Read operations                      │
└────────────────────────────────────────┘
```

```javascript
// Use read replicas for heavy queries
const primaryDB = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }
  }
});

const replicaDB = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_REPLICA_URL }
  }
});

// Write to primary
await primaryDB.campaign.create({ data: {...} });

// Read from replica
const campaigns = await replicaDB.campaign.findMany();
```

### Caching Strategy

```javascript
// Redis caching layer
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  password: process.env.REDIS_PASSWORD
});

// Cache campaign list (5 minutes)
export const getCampaigns = async () => {
  const cacheKey = 'campaigns:active';
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    logger.debug('Cache hit', { key: cacheKey });
    return JSON.parse(cached);
  }
  
  // Cache miss - query database
  const campaigns = await prisma.campaign.findMany({
    where: { status: 'ACTIVE' }
  });
  
  // Store in cache (5 minutes)
  await redis.setex(cacheKey, 300, JSON.stringify(campaigns));
  
  return campaigns;
};

// Invalidate cache on update
export const updateCampaign = async (id, data) => {
  const campaign = await prisma.campaign.update({
    where: { id },
    data
  });
  
  // Invalidate cache
  await redis.del('campaigns:active');
  await redis.del(`campaign:${id}`);
  
  return campaign;
};
```

---

## Troubleshooting

### Common Issues

#### 1. API not responding

```bash
# Check process status
pm2 status

# Check logs
pm2 logs xrpl-platform --lines 100

# Check system resources
top
df -h

# Check network
netstat -tulpn | grep 3000

# Restart if needed
pm2 restart xrpl-platform
```

#### 2. Database connection errors

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connections
psql -U xrpl_user xrpl_platform -c "SELECT count(*) FROM pg_stat_activity;"

# Check for long-running queries
psql -U xrpl_user xrpl_platform -c "
SELECT pid, now() - query_start as duration, query 
FROM pg_stat_activity 
WHERE state = 'active' AND now() - query_start > interval '1 minute';"

# Kill problematic queries
psql -U xrpl_user xrpl_platform -c "SELECT pg_terminate_backend(PID);"

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### 3. XRPL connection issues

```bash
# Check network connectivity
curl -v wss://xrplcluster.com

# Check logs
grep "XRPL" /var/log/xrpl-platform/combined-$(date +%Y-%m-%d).log

# Test connection manually
node << EOF
const { Client } = require('xrpl');
const client = new Client('wss://xrplcluster.com');
client.connect().then(() => {
  console.log('✅ Connected to XRPL');
  client.disconnect();
}).catch(err => {
  console.log('❌ Connection failed:', err);
});
EOF

# Restart application
pm2 restart xrpl-platform
```

#### 4. High memory usage

```bash
# Check memory usage
free -h
pm2 monit

# Check for memory leaks
node --inspect src/server.js
# Use Chrome DevTools to profile

# Increase max memory
pm2 delete xrpl-platform
pm2 start ecosystem.config.js --env production --node-args="--max-old-space-size=2048"
```

#### 5. Slow queries

```bash
# Enable slow query logging
# postgresql.conf
log_min_duration_statement = 1000  # Log queries > 1 second

# Analyze slow queries
psql -U xrpl_user xrpl_platform -c "
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;"

# Add indexes
psql -U xrpl_user xrpl_platform -c "
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_investments_campaign ON investments(campaign_id);"
```

---

## Runbooks

### Runbook 1: Deploy New Version

```bash
#!/bin/bash
# deploy-new-version.sh

# 1. Notify team
echo "🚀 Starting deployment..."

# 2. Pull latest code
cd /opt/xrpl-platform/backend
git pull origin main

# 3. Install dependencies
npm ci --production

# 4. Run migrations
npm run migrate:prod

# 5. Run tests on staging
NODE_ENV=staging npm test

if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Aborting deployment."
    exit 1
fi

# 6. Reload PM2 (zero-downtime)
pm2 reload xrpl-platform

# 7. Health check
sleep 10
curl -f https://api.example.com/health

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
else
    echo "❌ Health check failed. Rolling back..."
    git checkout HEAD~1
    npm ci --production
    pm2 reload xrpl-platform
    exit 1
fi

# 8. Notify team
echo "✅ Deployment complete: v$(git describe --tags)"
```

### Runbook 2: Emergency Rollback

```bash
#!/bin/bash
# emergency-rollback.sh

echo "⚠️  EMERGENCY ROLLBACK INITIATED"

# 1. Stop current version
pm2 stop xrpl-platform

# 2. Checkout previous version
cd /opt/xrpl-platform/backend
git log --oneline -5  # Show recent commits
read -p "Enter commit hash to rollback to: " COMMIT_HASH
git checkout $COMMIT_HASH

# 3. Restore dependencies
npm ci --production

# 4. Rollback database migrations (if needed)
read -p "Rollback database migrations? (y/n): " ROLLBACK_DB
if [ "$ROLLBACK_DB" = "y" ]; then
    npm run migrate:rollback
fi

# 5. Restart application
pm2 restart xrpl-platform

# 6. Health check
sleep 10
curl -f https://api.example.com/health

if [ $? -eq 0 ]; then
    echo "✅ Rollback successful"
else
    echo "❌ Rollback failed. Manual intervention required!"
    exit 1
fi
```

### Runbook 3: Database Incident

```bash
#!/bin/bash
# database-incident.sh

echo "🚨 Database Incident Response"

# 1. Check database status
sudo systemctl status postgresql

# 2. Check disk space
df -h /var/lib/postgresql

# 3. Check connections
psql -U xrpl_user xrpl_platform -c "SELECT count(*) FROM pg_stat_activity;"

# 4. Kill zombie connections
psql -U xrpl_user xrpl_platform -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND now() - state_change > interval '10 minutes';"

# 5. If corrupted, restore from backup
read -p "Restore from backup? (y/n): " RESTORE
if [ "$RESTORE" = "y" ]; then
    pm2 stop xrpl-platform
    
    # Get latest backup
    LATEST_BACKUP=$(ls -t /backup/postgres/backup_*.sql.gz | head -1)
    echo "Restoring from: $LATEST_BACKUP"
    
    # Restore
    gunzip -c $LATEST_BACKUP | psql -U xrpl_user xrpl_platform
    
    # Restart
    pm2 start xrpl-platform
fi

# 6. Verify
curl http://localhost:3000/health | jq '.checks.database'
```

---

## Support & Contacts

### On-call Rotation

```yaml
# oncall-schedule.yml
week_1:
  primary: "Alice (DevOps)"
  secondary: "Bob (Backend)"

week_2:
  primary: "Charlie (Backend)"
  secondary: "Diana (DevOps)"
```

### Escalation Path

```
L1: On-call engineer (15 min response)
  ↓ (if not resolved in 30 min)
L2: Senior engineer + DevOps lead (30 min response)
  ↓ (if not resolved in 1 hour)
L3: CTO + Architecture team (1 hour response)
```

### External Resources

- XRPL Status: https://status.xrpl.org
- Documentation: https://xrpl.org/docs
- Community: https://xrpldevs.org
- Support: devops@company.com

---

**Document Version**: 1.0  
**Last Updated**: Phase 6 - 2025  
**Maintained by**: DevOps Team

