# Token Issuance & TrustLines Guide - Phase 4

## Overview

Phase 4 introduces **tokenization** to the crowdfunding platform. Each successful campaign can issue XRPL tokens representing ownership shares, which are then distributed to investors based on their investment amounts.

This guide explains:
- What XRPL tokens are
- How trustlines work
- Token issuance workflow
- Token distribution process
- Frontend integration instructions

---

## Table of Contents

- [Understanding XRPL Tokens](#understanding-xrpl-tokens)
- [What is a TrustLine?](#what-is-a-trustline)
- [Token Workflow](#token-workflow)
- [API Endpoints](#api-endpoints)
- [Frontend Integration](#frontend-integration)
- [Testing Guide](#testing-guide)
- [Troubleshooting](#troubleshooting)

---

## Understanding XRPL Tokens

### What are XRPL Tokens?

XRPL (XRP Ledger) supports **issued currencies** (also called IOUs or tokens) that represent:
- Company shares
- Loyalty points
- Stablecoins
- Any fungible asset

In our platform:
- Each campaign can issue **one token**
- Tokens represent **ownership shares**
- Token amount correlates with **investment amount**
- Tokens are **tradeable** on XRPL

### Token Properties

| Property | Description | Example |
|----------|-------------|---------|
| **Symbol** | 3-character currency code | "ABC" |
| **Issuer** | XRPL address that creates tokens | Platform wallet |
| **Total Supply** | Maximum tokens issued | 10000 |
| **Distribution** | Tokens sent to investors | Based on investment % |

### Example

Campaign: "Awesome Startup" raises 10,000 XRP
- Token symbol: `AWS`
- Total supply: 10,000 tokens
- Investor A invested 2,500 XRP (25%) → receives 2,500 AWS tokens
- Investor B invested 7,500 XRP (75%) → receives 7,500 AWS tokens

---

## What is a TrustLine?

### The Problem

On XRPL, accounts **cannot receive tokens by default**. This prevents spam tokens being sent to your wallet.

### The Solution: TrustLines

A **TrustLine** is a declaration that says:
> "I trust issuer X to send me up to Y amount of currency Z"

Think of it as:
- Opening a bank account before receiving deposits
- Following someone before seeing their posts
- Subscribing to a newsletter before receiving emails

### TrustLine Properties

```javascript
{
  TransactionType: 'TrustSet',
  Account: 'rInvestor...', // Your wallet address
  LimitAmount: {
    currency: 'AWS',        // Token symbol
    issuer: 'rPlatform...', // Token issuer
    value: '1000000'        // Max tokens you'll accept
  }
}
```

### Key Points

✅ **Before distribution**: Investor MUST create trustline  
✅ **One-time setup**: Create once, receive tokens anytime  
✅ **No cost**: Small XRP fee (~0.00001 XRP) + 5 XRP reserve  
✅ **Control**: You decide which tokens to accept  

---

## Token Workflow

### Complete Flow

```
1. Campaign Owner Issues Token
   ↓
   POST /api/campaigns/:id/issue-token
   ↓
   Token created with symbol, issuer, total supply

2. Investors Create TrustLines
   ↓
   Investor submits TrustSet transaction on XRPL
   ↓
   Can check status: GET /api/investments/:id/trustline-status

3. Campaign Owner Distributes Tokens
   ↓
   POST /api/campaigns/:id/distribute-tokens
   ↓
   Platform sends Payment transactions (issuer → investor)
   ↓
   Each investor receives tokens proportional to investment

4. Investors Receive Tokens
   ↓
   Tokens appear in wallet
   ↓
   Can check balance: GET /api/campaigns/:id/token
```

### Step-by-Step Example

#### Step 1: Issue Token (Campaign Owner)

```bash
curl -X POST http://localhost:3000/api/campaigns/abc123/issue-token \
  -H "Authorization: Bearer STARTUP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "totalSupply": 10000,
    "metadata": {
      "name": "Awesome Startup Token",
      "description": "Ownership shares for Awesome Startup"
    }
  }'
```

Response:
```json
{
  "message": "Token issued successfully",
  "token": {
    "symbol": "AWS",
    "issuerAddress": "rPlatformWallet...",
    "totalSupply": "10000",
    "status": "ISSUED"
  },
  "instructions": {
    "nextStep": "Investors must create trustlines",
    "trustlineRequired": true
  }
}
```

#### Step 2: Check TrustLine Status (Investor)

```bash
curl http://localhost:3000/api/investments/inv123/trustline-status \
  -H "Authorization: Bearer INVESTOR_TOKEN"
```

Response (No Trustline):
```json
{
  "trustline": {
    "exists": false,
    "ready": false
  },
  "instructions": {
    "message": "Trustline must be established",
    "requiredFields": {
      "TransactionType": "TrustSet",
      "Account": "rInvestor...",
      "LimitAmount": {
        "currency": "AWS",
        "issuer": "rPlatform...",
        "value": "1000000"
      }
    }
  }
}
```

#### Step 3: Create TrustLine (Investor - via XRPL wallet or code)

Using xrpl.js:
```javascript
const xrpl = require('xrpl');

const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233');
await client.connect();

const investorWallet = xrpl.Wallet.fromSeed('sInvestorSeed...');

const trustSet = {
  TransactionType: 'TrustSet',
  Account: investorWallet.address,
  LimitAmount: {
    currency: 'AWS',
    issuer: 'rPlatform...',
    value: '1000000'
  }
};

const prepared = await client.autofill(trustSet);
const signed = investorWallet.sign(prepared);
const result = await client.submitAndWait(signed.tx_blob);

console.log('Trustline created:', result.result.hash);
```

Using Xaman wallet (recommended for production):
1. Open Xaman app
2. Go to "Add Asset"
3. Enter currency code: `AWS`
4. Enter issuer address: `rPlatform...`
5. Set limit: `1000000`
6. Sign transaction

#### Step 4: Distribute Tokens (Campaign Owner)

```bash
curl -X POST http://localhost:3000/api/campaigns/abc123/distribute-tokens \
  -H "Authorization: Bearer STARTUP_TOKEN"
```

Response:
```json
{
  "message": "Token distribution completed",
  "summary": {
    "totalInvestors": 2,
    "successful": 2,
    "failed": 0,
    "totalDistributed": "10000",
    "tokenSymbol": "AWS"
  },
  "distributions": [
    {
      "investor": "alice@example.com",
      "amount": 2500,
      "transactionHash": "ABC123...",
      "success": true
    },
    {
      "investor": "bob@example.com",
      "amount": 7500,
      "transactionHash": "DEF456...",
      "success": true
    }
  ]
}
```

---

## API Endpoints

### 1. Issue Token

**Endpoint**: `POST /api/campaigns/:id/issue-token`  
**Access**: Private (STARTUP, campaign owner only)

**Request Body**:
```json
{
  "totalSupply": 10000,  // Optional, defaults to currentAmount
  "metadata": {          // Optional
    "name": "Token Name",
    "description": "Token description"
  }
}
```

**Response**:
```json
{
  "message": "Token issued successfully",
  "token": {
    "id": "tok123",
    "symbol": "AWS",
    "issuerAddress": "rPlatform...",
    "totalSupply": "10000",
    "distributedAmount": "0",
    "status": "ISSUED",
    "metadata": {...}
  },
  "instructions": {
    "nextStep": "Investors must create trustlines",
    "trustlineRequired": true,
    "howTo": "Create TrustSet for AWS issued by rPlatform..."
  }
}
```

**Requirements**:
- Campaign must be ACTIVE or COMPLETED
- Campaign must have confirmed investments
- Token not already issued

---

### 2. Distribute Tokens

**Endpoint**: `POST /api/campaigns/:id/distribute-tokens`  
**Access**: Private (STARTUP, campaign owner only)

**Response**:
```json
{
  "message": "Token distribution completed",
  "summary": {
    "totalInvestors": 5,
    "successful": 4,
    "failed": 1,
    "totalDistributed": "9500",
    "tokenSymbol": "AWS"
  },
  "distributions": [
    {
      "investor": "alice@example.com",
      "amount": 2500,
      "transactionHash": "ABC...",
      "success": true
    }
  ],
  "errors": [
    {
      "investor": "bob@example.com",
      "error": "Trustline not established"
    }
  ]
}
```

**Process**:
1. Validates token exists and not fully distributed
2. Calculates token allocation per investor (by investment %)
3. Checks each investor's trustline
4. Sends Payment transactions for investors with trustlines
5. Records distributions in database
6. Returns summary with successes and failures

**Requirements**:
- Token must be issued first
- Investors must have wallet addresses set
- Investors must have trustlines established

---

### 3. Get Token Details

**Endpoint**: `GET /api/campaigns/:id/token`  
**Access**: Public

**Response**:
```json
{
  "token": {
    "id": "tok123",
    "symbol": "AWS",
    "issuerAddress": "rPlatform...",
    "totalSupply": "10000",
    "distributedAmount": "8500",
    "remainingSupply": "1500",
    "status": "DISTRIBUTING",
    "createdAt": "2025-11-08T...",
    "updatedAt": "2025-11-08T..."
  },
  "campaign": {
    "id": "abc123",
    "title": "Awesome Startup",
    "currentAmount": "10000",
    "status": "ACTIVE"
  },
  "distributions": [
    {
      "investorAddress": "rInv1...",
      "amount": "2500",
      "transactionHash": "ABC...",
      "distributedAt": "2025-11-08T..."
    }
  ],
  "summary": {
    "totalDistributions": 3,
    "distributionProgress": "85.00%"
  }
}
```

---

### 4. Check TrustLine Status

**Endpoint**: `GET /api/investments/:id/trustline-status`  
**Access**: Private (Investor or Campaign Owner)

**Response (Trustline Exists)**:
```json
{
  "investmentId": "inv123",
  "investor": {
    "email": "alice@example.com",
    "walletAddress": "rInv..."
  },
  "token": {
    "symbol": "AWS",
    "issuerAddress": "rPlatform..."
  },
  "trustline": {
    "exists": true,
    "balance": "2500",
    "limit": "1000000",
    "ready": true
  },
  "instructions": "Trustline is established. Ready to receive tokens."
}
```

**Response (No Trustline)**:
```json
{
  "trustline": {
    "exists": false,
    "ready": false
  },
  "instructions": {
    "message": "Trustline must be established",
    "howTo": "Create TrustSet transaction...",
    "requiredFields": {
      "TransactionType": "TrustSet",
      "Account": "rInv...",
      "LimitAmount": {
        "currency": "AWS",
        "issuer": "rPlatform...",
        "value": "1000000"
      }
    }
  }
}
```

---

## Frontend Integration

### UX Flow for Investors

#### 1. After Investment is Confirmed

Show notification:
```
✅ Investment Confirmed!

Next Step: Create TrustLine to receive [TOKEN_SYMBOL] tokens

[Learn More] [Create TrustLine]
```

#### 2. TrustLine Setup Page

Display:
- Token symbol and issuer
- Why trustline is needed
- Step-by-step instructions
- Integration with wallet (Xaman, GemWallet, etc.)

Example UI:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        Setup Token TrustLine
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You've invested in: Awesome Startup

To receive your AWS tokens, you need to
create a trustline.

Token Details:
• Symbol: AWS
• Issuer: rPlatform7kfTD9w2To4CQk6UCfuHM9c6GDY
• Your allocation: 2,500 tokens (25%)

What is a TrustLine?
A trustline tells the XRPL network that
you're ready to receive this token.

[Create with Xaman] [Create with GemWallet]
[Advanced: Manual Setup]
```

#### 3. TrustLine Status Check

Periodically poll:
```javascript
async function checkTrustlineStatus(investmentId) {
  const response = await fetch(
    `/api/investments/${investmentId}/trustline-status`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  
  if (data.trustline.ready) {
    showNotification('✅ TrustLine active! You can now receive tokens.');
    return true;
  }
  
  return false;
}
```

#### 4. Token Distribution Notification

After distribution:
```
🎉 Tokens Received!

You've received 2,500 AWS tokens from
Awesome Startup.

View in wallet: [Open Wallet]
Transaction: ABC123... [View on Explorer]
```

### Integration with XRPL Wallets

#### Option 1: Xaman (Recommended)

Xaman provides deep linking:
```javascript
function createTrustlineWithXaman(tokenSymbol, issuerAddress) {
  const trustSetPayload = {
    TransactionType: 'TrustSet',
    LimitAmount: {
      currency: tokenSymbol,
      issuer: issuerAddress,
      value: '1000000'
    }
  };
  
  // Create payload on Xaman API
  const xaman = new XamanSdk('your-api-key');
  const payload = await xaman.payload.create({
    txjson: trustSetPayload
  });
  
  // Open Xaman with deep link
  window.location.href = payload.next.always;
}
```

#### Option 2: GemWallet

GemWallet browser extension:
```javascript
async function createTrustlineWithGemWallet(tokenSymbol, issuerAddress) {
  if (!window.gemWallet) {
    alert('Please install GemWallet extension');
    return;
  }
  
  const trustSet = {
    TransactionType: 'TrustSet',
    LimitAmount: {
      currency: tokenSymbol,
      issuer: issuerAddress,
      value: '1000000'
    }
  };
  
  const result = await window.gemWallet.submitTransaction(trustSet);
  console.log('TrustLine created:', result.hash);
}
```

#### Option 3: Manual Instructions

For advanced users:
```
1. Open your XRPL wallet
2. Navigate to "Trust Lines" or "Add Asset"
3. Enter:
   - Currency Code: AWS
   - Issuer: rPlatform7kfTD9w2To4CQk6UCfuHM9c6GDY
   - Limit: 1000000
4. Sign and submit transaction
5. Return here to verify
```

---

## Testing Guide

### Local Testing Workflow

#### 1. Setup

```bash
# Start backend
cd backend
npm run dev

# Create test accounts
# Startup account
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "startup@test.com",
    "password": "test123",
    "name": "Test Startup",
    "role": "STARTUP"
  }'

# Investor account
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "investor@test.com",
    "password": "test123",
    "name": "Test Investor",
    "role": "INVESTOR"
  }'
```

#### 2. Create Campaign and Investment

```bash
# Login as startup
STARTUP_TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"startup@test.com","password":"test123"}' \
  | jq -r .token)

# Create campaign
CAMPAIGN_ID=$(curl -X POST http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer $STARTUP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Awesome Startup",
    "description": "Revolutionary product",
    "goalAmount": 10000,
    "startDate": "2025-11-01T00:00:00Z",
    "endDate": "2025-12-31T23:59:59Z"
  }' | jq -r .campaign.id)

# Login as investor
INVESTOR_TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"investor@test.com","password":"test123"}' \
  | jq -r .token)

# Create investment intent
INVESTMENT_ID=$(curl -X POST http://localhost:3000/api/investments/intent \
  -H "Authorization: Bearer $INVESTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"campaignId\":\"$CAMPAIGN_ID\",\"amount\":2500}" \
  | jq -r .investment.id)

# Send XRP on Testnet (use xrpl.js or wallet)
# ... send transaction ...

# Confirm investment with transaction hash
curl -X POST http://localhost:3000/api/investments/confirm \
  -H "Authorization: Bearer $INVESTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"investmentId\":\"$INVESTMENT_ID\",\"transactionHash\":\"TX_HASH\"}"
```

#### 3. Issue Token

```bash
curl -X POST http://localhost:3000/api/campaigns/$CAMPAIGN_ID/issue-token \
  -H "Authorization: Bearer $STARTUP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "totalSupply": 10000,
    "metadata": {
      "name": "Awesome Startup Token",
      "description": "Ownership shares"
    }
  }'
```

#### 4. Create TrustLine (Investor)

Using xrpl.js:
```javascript
const xrpl = require('xrpl');

// Get token details first
const response = await fetch(`http://localhost:3000/api/campaigns/${campaignId}/token`);
const { token } = await response.json();

// Connect to Testnet
const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233');
await client.connect();

// Investor wallet
const investorWallet = xrpl.Wallet.fromSeed('sInvestorSeed...');

// Create trustline
const trustSet = {
  TransactionType: 'TrustSet',
  Account: investorWallet.address,
  LimitAmount: {
    currency: token.symbol,
    issuer: token.issuerAddress,
    value: '1000000'
  }
};

const prepared = await client.autofill(trustSet);
const signed = investorWallet.sign(prepared);
const result = await client.submitAndWait(signed.tx_blob);

console.log('✅ TrustLine created:', result.result.hash);
```

#### 5. Check TrustLine Status

```bash
curl http://localhost:3000/api/investments/$INVESTMENT_ID/trustline-status \
  -H "Authorization: Bearer $INVESTOR_TOKEN"
```

#### 6. Distribute Tokens

```bash
curl -X POST http://localhost:3000/api/campaigns/$CAMPAIGN_ID/distribute-tokens \
  -H "Authorization: Bearer $STARTUP_TOKEN"
```

#### 7. Verify Distribution

```bash
# Get token details
curl http://localhost:3000/api/campaigns/$CAMPAIGN_ID/token

# Check trustline status (includes balance)
curl http://localhost:3000/api/investments/$INVESTMENT_ID/trustline-status \
  -H "Authorization: Bearer $INVESTOR_TOKEN"
```

---

## Troubleshooting

### Issue 1: "Investor wallet address not set"

**Error**:
```json
{
  "error": "Investor wallet address not set"
}
```

**Solution**:
Investor must set their XRPL wallet address in their profile:
```bash
# Update user profile (implement this endpoint)
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $INVESTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"rInvestorAddress..."}'
```

---

### Issue 2: "Trustline not established"

**Error**:
```json
{
  "error": "Trustline not established"
}
```

**Solution**:
1. Check trustline status: `GET /api/investments/:id/trustline-status`
2. Create trustline using wallet or xrpl.js (see examples above)
3. Wait 3-5 seconds for validation
4. Verify with trustline status endpoint
5. Retry distribution

---

### Issue 3: "Token already issued"

**Error**:
```json
{
  "error": "Token already issued for this campaign"
}
```

**Solution**:
Each campaign can only have one token. If you need to re-issue:
1. Check current token: `GET /api/campaigns/:id/token`
2. If needed, delete token from database (admin only)
3. Issue new token

---

### Issue 4: "Transaction failed: tecNO_LINE"

**Error on XRPL**:
```
Transaction failed: tecNO_LINE
```

**Meaning**: Trustline doesn't exist

**Solution**:
1. Investor must create trustline BEFORE distribution
2. Verify trustline exists: `GET /api/investments/:id/trustline-status`
3. If `exists: false`, create trustline
4. Retry distribution

---

### Issue 5: Reserve Requirements

**Error**: Insufficient XRP balance

**Solution**:
Each trustline requires:
- 5 XRP reserve (locked, retrievable if trustline removed)
- ~0.00001 XRP transaction fee

Ensure investor wallet has:
- Minimum 20 XRP base reserve
- +5 XRP per trustline
- +fees

---

## Production Checklist

### Before Going Live

- [ ] Test complete flow on Testnet
- [ ] Verify all trustline instructions clear for users
- [ ] Implement wallet integrations (Xaman/GemWallet)
- [ ] Add email notifications for token issuance
- [ ] Add email notifications for distribution
- [ ] Create help documentation/videos for investors
- [ ] Test with multiple investors
- [ ] Verify token symbol generation (no collisions)
- [ ] Add monitoring for distribution failures
- [ ] Implement retry mechanism for failed distributions
- [ ] Add admin panel to manage tokens
- [ ] Test token trading on DEX (if applicable)
- [ ] Security audit of token controller
- [ ] Load test distribution with many investors

### UX Best Practices

- [ ] Onboarding flow for first-time token users
- [ ] Clear visual indicators for trustline status
- [ ] Progress bars for distribution
- [ ] Links to XRPL explorer for transactions
- [ ] FAQ section about tokens and trustlines
- [ ] Video tutorials for wallet setup
- [ ] Support chat for assistance
- [ ] Email reminders to create trustlines
- [ ] Dashboard showing token holdings
- [ ] Historical distribution records

---

## Resources

- **XRPL Tokens Documentation**: https://xrpl.org/tokens.html
- **TrustLines Guide**: https://xrpl.org/trust-lines-and-issuing.html
- **Xaman Wallet**: https://xaman.app/
- **GemWallet**: https://gemwallet.app/
- **XRPL.js Library**: https://js.xrpl.org/
- **Testnet Explorer**: https://testnet.xrpl.org/

---

## Support

For issues or questions:
1. Check this documentation
2. Review `backend/README.md`
3. Test with debug endpoints
4. Check XRPL Testnet status

**Phase 4 Complete! 🎉**
