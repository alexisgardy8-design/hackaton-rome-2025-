# XRPL Testnet Integration Guide

## Overview

This project uses the **XRPL Testnet** to verify investment transactions. Investors send XRP to the platform's wallet address, and the backend verifies transactions on the blockchain before confirming investments.

## Table of Contents

- [Quick Start](#quick-start)
- [Getting Testnet XRP](#getting-testnet-xrp)
- [Platform Wallet Setup](#platform-wallet-setup)
- [Transaction Verification Flow](#transaction-verification-flow)
- [Testing Endpoints](#testing-endpoints)
- [Common Issues](#common-issues)

---

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
# xrpl library is already in package.json
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update XRPL settings:

```bash
cp .env.example .env
```

Key XRPL variables:
```bash
XRPL_SERVER="wss://s.altnet.rippletest.net:51233"
XRPL_PLATFORM_SEED="sEdTM1uX8pu2do5XvTnutH6HsouMaM2"
PLATFORM_WALLET_ADDRESS="rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY"
```

⚠️ **NEVER commit your real wallet seed to version control!**

### 3. Start Server

```bash
npm run dev
```

---

## Getting Testnet XRP

### Option 1: Use API Endpoint (Easiest)

Our API includes a wallet generation endpoint:

```bash
curl -X POST http://localhost:3000/api/xrpl/wallet/generate
```

Response:
```json
{
  "message": "Testnet wallet created and funded successfully",
  "wallet": {
    "address": "rN7n7otQDd6FczFgLdhmKRAWjESrzVXqXw",
    "seed": "sEdSKaCy2JT7JaM7v95H9SxkhP9wS2r",
    "publicKey": "ED01FA53FA5A7E77798F882ECE20B1ABC00BB358A9E55A202D0D0676BD0CE37A63"
  },
  "warning": "⚠️ Store the seed securely! This is the only time it will be shown.",
  "faucet": "Wallet has been funded with 1000 XRP from Testnet faucet"
}
```

### Option 2: Use XRPL Testnet Faucet (Manual)

1. Go to: https://faucet.altnet.rippletest.net/
2. Generate a new wallet or enter an existing address
3. Click "Generate credentials" or "Fund address"
4. You'll receive 1000 test XRP

### Option 3: Use xrpl.js CLI

```bash
npm install -g xrpl
node -e "const xrpl = require('xrpl'); (async () => { const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233'); await client.connect(); const wallet = (await client.fundWallet()).wallet; console.log('Address:', wallet.address); console.log('Seed:', wallet.seed); await client.disconnect(); })();"
```

---

## Platform Wallet Setup

### Generate Platform Wallet

The platform needs a wallet to receive investments:

```bash
# Generate new wallet with funding
curl -X POST http://localhost:3000/api/xrpl/wallet/generate
```

Save the response securely and update `.env`:

```bash
XRPL_PLATFORM_SEED="sEdSKaCy2JT7JaM7v95H9SxkhP9wS2r"
PLATFORM_WALLET_ADDRESS="rN7n7otQDd6FczFgLdhmKRAWjESrzVXqXw"
```

### Check Platform Wallet Balance

```bash
curl http://localhost:3000/api/xrpl/balance/rN7n7otQDd6FczFgLdhmKRAWjESrzVXqXw
```

---

## Transaction Verification Flow

### How Investment Confirmation Works

1. **Investor creates intent:**
   ```bash
   POST /api/investments/intent
   {
     "campaignId": 1,
     "amount": 100
   }
   ```
   
2. **Investor sends XRP to platform wallet:**
   - Using XRPL wallet (Xaman, GemWallet, CLI, etc.)
   - To address: `PLATFORM_WALLET_ADDRESS`
   - Amount: Exact XRP from intent

3. **Investor confirms with transaction hash:**
   ```bash
   POST /api/investments/confirm
   {
     "investmentId": 1,
     "transactionHash": "E3D9E4F14B6C8F5E7A1B8C9D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6A7B8C9D0E1F"
   }
   ```

4. **Backend verifies on XRPL Testnet:**
   - ✅ Transaction exists and is validated
   - ✅ Result is `tesSUCCESS`
   - ✅ Transaction type is `Payment`
   - ✅ Destination matches platform wallet
   - ✅ Amount matches investment (±0.01 XRP tolerance)

5. **If all checks pass:**
   - Investment is confirmed
   - Campaign `currentAmount` is incremented
   - Transaction hash is stored

### Verification Code

The verification happens in `src/controllers/investmentController.js`:

```javascript
const txDetails = await verifyTransaction(transactionHash);

if (!txDetails.verified || !txDetails.success) {
  return res.status(400).json({ error: 'Transaction verification failed' });
}

// Verify destination
if (txDetails.destination !== PLATFORM_WALLET) {
  return res.status(400).json({ error: 'Invalid destination' });
}

// Verify amount (with tolerance)
const expectedAmount = parseFloat(investment.amount);
const actualAmount = parseFloat(txDetails.amount);
if (Math.abs(actualAmount - expectedAmount) > 0.01) {
  return res.status(400).json({ error: 'Amount mismatch' });
}
```

---

## Testing Endpoints

### Debug Endpoints

#### 1. Get Transaction Details

```bash
curl http://localhost:3000/api/xrpl/tx/{TRANSACTION_HASH}
```

Example:
```bash
curl http://localhost:3000/api/xrpl/tx/E3D9E4F14B6C8F5E7A1B8C9D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6A7B8C9D0E1F
```

Response:
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
    "ledgerIndex": 12345678,
    "closeTime": 1234567890
  }
}
```

#### 2. Check Account Balance

```bash
curl http://localhost:3000/api/xrpl/balance/{ADDRESS}
```

Example:
```bash
curl http://localhost:3000/api/xrpl/balance/rN7n7otQDd6FczFgLdhmKRAWjESrzVXqXw
```

Response:
```json
{
  "message": "Balance retrieved successfully",
  "address": "rN7n7otQDd6FczFgLdhmKRAWjESrzVXqXw",
  "balance": "1000"
}
```

#### 3. Generate Test Wallet

```bash
curl -X POST http://localhost:3000/api/xrpl/wallet/generate
```

⚠️ **Remove this endpoint in production!**

---

## Common Issues

### Issue 1: Transaction Not Found

**Error:**
```json
{
  "error": "Transaction Not Found",
  "message": "Transaction not found on XRPL Testnet"
}
```

**Solutions:**
- Wait 3-5 seconds for transaction to be validated
- Check transaction hash is correct (64 hex characters)
- Verify transaction was sent to Testnet (not Mainnet)

### Issue 2: Amount Mismatch

**Error:**
```json
{
  "error": "Amount Mismatch",
  "message": "Expected 100 XRP, but transaction was for 99.99 XRP"
}
```

**Solutions:**
- Send exact amount from investment intent
- Account for XRP transaction fees (~0.00001 XRP)
- Our tolerance is 0.01 XRP to handle rounding

### Issue 3: Invalid Destination

**Error:**
```json
{
  "error": "Invalid Destination",
  "message": "Payment must be sent to platform wallet: rPEPPER7..."
}
```

**Solutions:**
- Check `PLATFORM_WALLET_ADDRESS` in `.env`
- Ensure investor sends XRP to correct address
- Verify platform wallet address matches seed

### Issue 4: Connection Timeout

**Error:**
```json
{
  "error": "Transaction Verification Failed",
  "details": "WebSocket connection timeout"
}
```

**Solutions:**
- Check `XRPL_SERVER` URL in `.env`
- Try alternative Testnet server: `wss://testnet.xrpl-labs.com`
- Ensure stable internet connection
- Check firewall/proxy settings

### Issue 5: Insufficient XRP Balance

**Error:**
```
Transaction failed with result: tecUNFUNDED_PAYMENT
```

**Solutions:**
- Fund wallet using faucet (see [Getting Testnet XRP](#getting-testnet-xrp))
- Check balance: `GET /api/xrpl/balance/{address}`
- Each transaction requires 20 XRP reserve + amount + fees

---

## Testing Workflow

### Complete Test Flow

1. **Setup:**
   ```bash
   # Start backend
   cd backend
   npm run dev
   
   # Generate platform wallet (if needed)
   curl -X POST http://localhost:3000/api/xrpl/wallet/generate
   ```

2. **Register users:**
   ```bash
   # Register startup
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"startup@test.com","password":"test123","name":"Test Startup","role":"STARTUP"}'
   
   # Register investor
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"investor@test.com","password":"test123","name":"Test Investor","role":"INVESTOR"}'
   ```

3. **Create campaign:**
   ```bash
   # Login as startup
   STARTUP_TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"startup@test.com","password":"test123"}' | jq -r .token)
   
   # Create campaign
   curl -X POST http://localhost:3000/api/campaigns \
     -H "Authorization: Bearer $STARTUP_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title":"Test Campaign","description":"Testing XRPL","goalAmount":1000}'
   ```

4. **Generate investor wallet:**
   ```bash
   # Generate wallet with Testnet XRP
   INVESTOR_WALLET=$(curl -X POST http://localhost:3000/api/xrpl/wallet/generate)
   echo $INVESTOR_WALLET | jq .
   
   # Save seed and address from response
   INVESTOR_ADDRESS=$(echo $INVESTOR_WALLET | jq -r .wallet.address)
   INVESTOR_SEED=$(echo $INVESTOR_WALLET | jq -r .wallet.seed)
   ```

5. **Create investment intent:**
   ```bash
   # Login as investor
   INVESTOR_TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"investor@test.com","password":"test123"}' | jq -r .token)
   
   # Create intent
   curl -X POST http://localhost:3000/api/investments/intent \
     -H "Authorization: Bearer $INVESTOR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"campaignId":1,"amount":100}'
   ```

6. **Send XRP transaction:**
   ```bash
   # Use XRPL library to send payment
   node -e "
   const xrpl = require('xrpl');
   (async () => {
     const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233');
     await client.connect();
     
     const wallet = xrpl.Wallet.fromSeed('$INVESTOR_SEED');
     
     const payment = {
       TransactionType: 'Payment',
       Account: wallet.address,
       Destination: '$PLATFORM_WALLET_ADDRESS',
       Amount: xrpl.xrpToDrops('100')
     };
     
     const prepared = await client.autofill(payment);
     const signed = wallet.sign(prepared);
     const result = await client.submitAndWait(signed.tx_blob);
     
     console.log('Transaction hash:', result.result.hash);
     
     await client.disconnect();
   })();
   "
   ```

7. **Confirm investment:**
   ```bash
   # Use transaction hash from previous step
   TX_HASH="..."
   
   curl -X POST http://localhost:3000/api/investments/confirm \
     -H "Authorization: Bearer $INVESTOR_TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"investmentId\":1,\"transactionHash\":\"$TX_HASH\"}"
   ```

8. **Verify confirmation:**
   ```bash
   # Check transaction details
   curl http://localhost:3000/api/xrpl/tx/$TX_HASH
   
   # Check campaign updated
   curl http://localhost:3000/api/campaigns/1
   
   # Check platform wallet balance increased
   curl http://localhost:3000/api/xrpl/balance/$PLATFORM_WALLET_ADDRESS
   ```

---

## Architecture Notes

### XRPL Client (`src/lib/xrplClient.js`)

The XRPL client uses a **singleton pattern** for efficient connection management:

```javascript
let clientInstance = null;

export const getClient = async () => {
  if (!clientInstance) {
    clientInstance = new Client(process.env.XRPL_SERVER);
    await clientInstance.connect();
  }
  return clientInstance;
};
```

This ensures:
- ✅ Single persistent connection across all requests
- ✅ Automatic reconnection on disconnect
- ✅ Lower latency for transaction verification

### Transaction Verification

The `verifyTransaction()` function checks multiple criteria:

1. **Transaction exists** in validated ledger
2. **Result is successful** (`tesSUCCESS`)
3. **Transaction type** matches expected type
4. **Payment details** (amount, destination) are correct

See `src/lib/xrplClient.js` for full implementation.

---

## Resources

- **XRPL Testnet Faucet:** https://faucet.altnet.rippletest.net/
- **XRPL.js Documentation:** https://js.xrpl.org/
- **XRPL Explorer (Testnet):** https://testnet.xrpl.org/
- **XRPL Transaction Types:** https://xrpl.org/transaction-types.html
- **XRPL Result Codes:** https://xrpl.org/transaction-results.html

---

## Production Checklist

Before deploying to production:

- [ ] Remove `POST /api/xrpl/wallet/generate` endpoint
- [ ] Switch `XRPL_SERVER` to Mainnet: `wss://xrplcluster.com`
- [ ] Use **secure wallet management** (HSM, KMS) for platform seed
- [ ] Add **rate limiting** to XRPL endpoints
- [ ] Implement **webhook notifications** for transaction confirmations
- [ ] Add **retry logic** for failed verifications
- [ ] Set up **monitoring** for wallet balance alerts
- [ ] Enable **audit logging** for all XRPL operations
- [ ] Add **multi-signature** support for large transactions
- [ ] Implement **transaction batching** to reduce fees

---

## Support

For issues or questions:

1. Check this documentation
2. Review `backend/README.md` for API details
3. Test with debug endpoints (`/api/xrpl/tx/:hash`)
4. Check XRPL Testnet status: https://testnet.xrpl.org/

**Happy building! 🚀**
