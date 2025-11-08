# Phase 2 - Manual Testing Guide

This guide provides cURL commands to test all Phase 2 endpoints.

## Prerequisites

- Backend server running on `http://localhost:3000`
- Database initialized with migrations

## Test Workflow

### 1. Register Users

#### Register a Startup
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "startup@test.com",
    "password": "Test123!",
    "name": "Test Startup",
    "role": "STARTUP"
  }'
```

**Expected Response:**
```json
{
  "message": "User created successfully",
  "user": { ... },
  "token": "eyJhbGciOi..."
}
```

**Save the token as STARTUP_TOKEN**

#### Register an Investor
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "investor@test.com",
    "password": "Test123!",
    "name": "Test Investor",
    "role": "INVESTOR"
  }'
```

**Save the token as INVESTOR_TOKEN**

---

### 2. Campaign Management

#### Create a Campaign (Startup only)
```bash
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer STARTUP_TOKEN" \
  -d '{
    "title": "Revolutionary AI Platform",
    "description": "Building the next generation of AI-powered solutions for businesses worldwide. Our platform leverages cutting-edge technology to deliver unprecedented results.",
    "goalAmount": 50000,
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-04-01T00:00:00Z",
    "imageUrl": "https://example.com/campaign.jpg"
  }'
```

**Expected Response:**
```json
{
  "message": "Campaign created successfully",
  "campaign": {
    "id": "cm3abc123...",
    ...
  }
}
```

**Save the campaign ID as CAMPAIGN_ID**

#### Get All Campaigns (Public)
```bash
curl http://localhost:3000/api/campaigns?limit=10&offset=0
```

#### Get Campaign by ID (Public)
```bash
curl http://localhost:3000/api/campaigns/CAMPAIGN_ID
```

#### Update Campaign (Startup owner only)
```bash
curl -X PUT http://localhost:3000/api/campaigns/CAMPAIGN_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer STARTUP_TOKEN" \
  -d '{
    "status": "ACTIVE"
  }'
```

**Note:** Campaign must be ACTIVE for investments

---

### 3. Investment Workflow

#### Step 1: Create Investment Intent (Investor only)
```bash
curl -X POST http://localhost:3000/api/investments/invest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer INVESTOR_TOKEN" \
  -d '{
    "campaignId": "CAMPAIGN_ID",
    "amount": 1000
  }'
```

**Expected Response:**
```json
{
  "message": "Investment intent created successfully",
  "investment": {
    "id": "cm3xyz789...",
    "amount": 1000,
    ...
  },
  "depositAddress": "rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY",
  "instructions": {
    "step1": "Send exactly the investment amount to the deposit address",
    "step2": "Copy the transaction hash from XRPL",
    "step3": "Call POST /api/investments/confirm with the transaction hash"
  }
}
```

**Save the investment ID as INVESTMENT_ID**

#### Step 2: Confirm Investment with Transaction Hash
```bash
curl -X POST http://localhost:3000/api/investments/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer INVESTOR_TOKEN" \
  -d '{
    "investmentId": "INVESTMENT_ID",
    "transactionHash": "0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF"
  }'
```

**Expected Response:**
```json
{
  "message": "Investment confirmed successfully",
  "investment": {
    "id": "cm3xyz789...",
    "transactionHash": "0123..."
  },
  "campaign": {
    "currentAmount": 1000,
    "goalAmount": 50000,
    "percentageFunded": "2.00"
  }
}
```

#### Get My Investments (Investor)
```bash
curl http://localhost:3000/api/investments \
  -H "Authorization: Bearer INVESTOR_TOKEN"
```

#### Get Investment by ID
```bash
curl http://localhost:3000/api/investments/INVESTMENT_ID \
  -H "Authorization: Bearer INVESTOR_TOKEN"
```

---

## Complete Test Scenario

Here's a complete test scenario you can run:

```bash
#!/bin/bash

echo "=== Phase 2 Complete Test ==="

# 1. Register Startup
echo -e "\n1. Registering startup..."
STARTUP_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "startup-test@example.com",
    "password": "Test123!",
    "name": "Test Startup",
    "role": "STARTUP"
  }')

STARTUP_TOKEN=$(echo $STARTUP_RESPONSE | jq -r '.token')
echo "Startup token: $STARTUP_TOKEN"

# 2. Register Investor
echo -e "\n2. Registering investor..."
INVESTOR_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "investor-test@example.com",
    "password": "Test123!",
    "name": "Test Investor",
    "role": "INVESTOR"
  }')

INVESTOR_TOKEN=$(echo $INVESTOR_RESPONSE | jq -r '.token')
echo "Investor token: $INVESTOR_TOKEN"

# 3. Create Campaign
echo -e "\n3. Creating campaign..."
CAMPAIGN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STARTUP_TOKEN" \
  -d '{
    "title": "Test Campaign",
    "description": "This is a test campaign for Phase 2 testing. It demonstrates the complete flow.",
    "goalAmount": 10000,
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-04-01T00:00:00Z"
  }')

CAMPAIGN_ID=$(echo $CAMPAIGN_RESPONSE | jq -r '.campaign.id')
echo "Campaign ID: $CAMPAIGN_ID"

# 4. Activate Campaign
echo -e "\n4. Activating campaign..."
curl -s -X PUT http://localhost:3000/api/campaigns/$CAMPAIGN_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STARTUP_TOKEN" \
  -d '{"status": "ACTIVE"}' | jq

# 5. Create Investment
echo -e "\n5. Creating investment..."
INVESTMENT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/investments/invest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INVESTOR_TOKEN" \
  -d "{
    \"campaignId\": \"$CAMPAIGN_ID\",
    \"amount\": 500
  }")

INVESTMENT_ID=$(echo $INVESTMENT_RESPONSE | jq -r '.investment.id')
echo "Investment ID: $INVESTMENT_ID"

# 6. Confirm Investment
echo -e "\n6. Confirming investment..."
curl -s -X POST http://localhost:3000/api/investments/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INVESTOR_TOKEN" \
  -d "{
    \"investmentId\": \"$INVESTMENT_ID\",
    \"transactionHash\": \"0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF\"
  }" | jq

# 7. Get Campaign Details
echo -e "\n7. Getting campaign details..."
curl -s http://localhost:3000/api/campaigns/$CAMPAIGN_ID | jq

echo -e "\n=== Test Complete ==="
```

## Expected Results

✅ **Startup can:**
- Create campaigns
- Update their own campaigns
- View campaign details with investments

✅ **Investor can:**
- View all campaigns
- Create investment intents
- Confirm investments with transaction hash
- View their investments

✅ **System validates:**
- Campaign dates (end > start)
- Goal amounts (>= 100)
- Investment amounts (>= 1)
- Transaction hash format (64 chars)
- User roles (STARTUP vs INVESTOR)
- Campaign ownership
- Investment ownership

## Troubleshooting

### Error: "Only startups can create campaigns"
- Make sure you're using a STARTUP token
- Check that the user was registered with `"role": "STARTUP"`

### Error: "Campaign is not active"
- Update the campaign status to "ACTIVE" before investing
- Use PUT /api/campaigns/:id with `{"status": "ACTIVE"}`

### Error: "Invalid token"
- Token may have expired
- Login again to get a new token

### Error: "Transaction hash must be 64 characters"
- Transaction hash must be exactly 64 hexadecimal characters
- Use a valid XRPL transaction hash or a dummy hash for testing
