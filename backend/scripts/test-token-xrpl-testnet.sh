#!/bin/bash

# Script complet pour tester l'émission de tokens sur XRPL Testnet
# Ce script fait tout le workflow : campagne -> investissement XRPL -> token

BASE_URL="http://localhost:3000"
API_BASE="${BASE_URL}/api"

echo "🚀 Test complet d'émission de tokens sur XRPL Testnet"
echo "======================================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Vérifier que le serveur est en cours d'exécution
if ! curl -s "${BASE_URL}/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ Le serveur backend n'est pas en cours d'exécution${NC}"
    echo "Lancez d'abord: cd backend && npm run dev"
    exit 1
fi

# 1. Créer un utilisateur Startup
echo -e "${BLUE}1️⃣  Création d'un utilisateur Startup...${NC}"
STARTUP_EMAIL="startup-xrpl-$(date +%s)@test.com"
response=$(curl -s -X POST "${API_BASE}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$STARTUP_EMAIL\",\"password\":\"Password123!\",\"name\":\"XRPL Startup\",\"role\":\"STARTUP\"}")
STARTUP_TOKEN=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)
if [ -z "$STARTUP_TOKEN" ]; then
    response=$(curl -s -X POST "${API_BASE}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$STARTUP_EMAIL\",\"password\":\"Password123!\"}")
    STARTUP_TOKEN=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)
fi
echo -e "${GREEN}✓ Startup créé${NC}"
echo ""

# 2. Créer un utilisateur Investor
echo -e "${BLUE}2️⃣  Création d'un utilisateur Investor...${NC}"
INVESTOR_EMAIL="investor-xrpl-$(date +%s)@test.com"
response=$(curl -s -X POST "${API_BASE}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$INVESTOR_EMAIL\",\"password\":\"Password123!\",\"name\":\"XRPL Investor\",\"role\":\"INVESTOR\"}")
INVESTOR_TOKEN=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)
if [ -z "$INVESTOR_TOKEN" ]; then
    response=$(curl -s -X POST "${API_BASE}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$INVESTOR_EMAIL\",\"password\":\"Password123!\"}")
    INVESTOR_TOKEN=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)
fi
echo -e "${GREEN}✓ Investor créé${NC}"
echo ""

# 3. Générer un wallet pour l'investor
echo -e "${BLUE}3️⃣  Génération d'un wallet Testnet pour l'investor...${NC}"
response=$(curl -s -X POST "${API_BASE}/xrpl/wallet/generate" \
    -H "Content-Type: application/json" \
    -d "{}")
WALLET_ADDRESS=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('wallet', {}).get('address', '') or data.get('address', ''))" 2>/dev/null)
WALLET_SEED=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('wallet', {}).get('seed', '') or data.get('seed', ''))" 2>/dev/null)
echo "Wallet Address: $WALLET_ADDRESS"
echo -e "${GREEN}✓ Wallet généré${NC}"
echo ""

# 4. Créer une campagne
echo -e "${BLUE}4️⃣  Création d'une campagne...${NC}"
START_DATE=$(date -u -v+1d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d "+1 day" +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%S.000Z")
END_DATE=$(date -u -v+30d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d "+30 days" +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%S.000Z")

response=$(curl -s -X POST "${API_BASE}/campaigns" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $STARTUP_TOKEN" \
    -d "{
        \"title\":\"XRPL Token Test Campaign\",
        \"description\":\"Campagne pour tester l'émission de tokens sur XRPL Testnet\",
        \"goalAmount\":10000,
        \"startDate\":\"$START_DATE\",
        \"endDate\":\"$END_DATE\"
    }")
CAMPAIGN_ID=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('campaign', {}).get('id', '') or data.get('id', ''))" 2>/dev/null)
echo "Campaign ID: $CAMPAIGN_ID"
echo -e "${GREEN}✓ Campagne créée${NC}"
echo ""

# 5. Activer la campagne
echo -e "${BLUE}5️⃣  Activation de la campagne...${NC}"
if [ -n "$CAMPAIGN_ID" ]; then
    response=$(curl -s -X PUT "${API_BASE}/campaigns/$CAMPAIGN_ID" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $STARTUP_TOKEN" \
        -d "{\"status\":\"ACTIVE\"}")
    echo -e "${GREEN}✓ Campagne activée${NC}"
    echo ""
fi

# 6. Créer un investissement
echo -e "${BLUE}6️⃣  Création d'un investissement...${NC}"
if [ -n "$CAMPAIGN_ID" ] && [ -n "$INVESTOR_TOKEN" ] && [ -n "$WALLET_ADDRESS" ]; then
    response=$(curl -s -X POST "${API_BASE}/investments/invest" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $INVESTOR_TOKEN" \
        -d "{
            \"campaignId\":\"$CAMPAIGN_ID\",
            \"amount\":1000
        }")
    INVESTMENT_ID=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('investment', {}).get('id', '') or data.get('id', ''))" 2>/dev/null)
    DEPOSIT_ADDRESS=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('depositAddress', ''))" 2>/dev/null)
    echo "Investment ID: $INVESTMENT_ID"
    echo "Deposit Address: $DEPOSIT_ADDRESS"
    echo -e "${GREEN}✓ Investissement créé${NC}"
    echo ""
    
    # 7. Envoyer une transaction XRPL réelle
    echo -e "${BLUE}7️⃣  Envoi d'une transaction XRPL Testnet...${NC}"
    echo -e "${YELLOW}⚠️  Pour envoyer une vraie transaction XRPL, vous devez utiliser le client XRPL${NC}"
    echo "   Vous pouvez utiliser le script Node.js suivant :"
    echo ""
    echo "   node -e \""
    echo "   const { Client, Wallet, xrpToDrops } = require('xrpl');"
    echo "   (async () => {"
    echo "     const client = new Client('wss://s.altnet.rippletest.net:51233');"
    echo "     await client.connect();"
    echo "     const wallet = Wallet.fromSeed('$WALLET_SEED');"
    echo "     const payment = {"
    echo "       TransactionType: 'Payment',"
    echo "       Account: wallet.address,"
    echo "       Destination: '$DEPOSIT_ADDRESS',"
    echo "       Amount: xrpToDrops(1000)"
    echo "     };"
    echo "     const prepared = await client.autofill(payment);"
    echo "     const signed = wallet.sign(prepared);"
    echo "     const result = await client.submitAndWait(signed.tx_blob);"
    echo "     console.log('Transaction Hash:', result.result.hash);"
    echo "     await client.disconnect();"
    echo "   })();"
    echo "   \""
    echo ""
    echo -e "${YELLOW}Ou utilisez le script Node.js fourni ci-dessous${NC}"
    echo ""
    
    # Créer un script Node.js pour envoyer la transaction
    cat > /tmp/send-xrpl-payment.js << EOF
const { Client, Wallet, xrpToDrops } = require('xrpl');

(async () => {
  try {
    const client = new Client('wss://s.altnet.rippletest.net:51233');
    await client.connect();
    console.log('✅ Connecté à XRPL Testnet');
    
    const wallet = Wallet.fromSeed('$WALLET_SEED');
    console.log('💼 Wallet:', wallet.address);
    
    const payment = {
      TransactionType: 'Payment',
      Account: wallet.address,
      Destination: '$DEPOSIT_ADDRESS',
      Amount: xrpToDrops(1000)
    };
    
    const prepared = await client.autofill(payment);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    
    console.log('✅ Transaction envoyée !');
    console.log('📝 Transaction Hash:', result.result.hash);
    console.log('');
    console.log('Utilisez ce hash pour confirmer l\'investissement:');
    console.log('curl -X POST $API_BASE/investments/confirm \\');
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -H \"Authorization: Bearer $INVESTOR_TOKEN\" \\"
    echo "  -d '{\"investmentId\":\"$INVESTMENT_ID\",\"transactionHash\":\"' + result.result.hash + '\"}'"
    
    await client.disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
})();
EOF
    
    echo "Script créé dans /tmp/send-xrpl-payment.js"
    echo "Pour l'exécuter :"
    echo "  cd backend && node /tmp/send-xrpl-payment.js"
    echo ""
    echo -e "${YELLOW}⚠️  Après avoir exécuté le script, entrez le transaction hash ci-dessous :${NC}"
    read -p "Transaction Hash: " TX_HASH
    
    if [ -n "$TX_HASH" ]; then
        # 8. Confirmer l'investissement
        echo -e "${BLUE}8️⃣  Confirmation de l'investissement...${NC}"
        response=$(curl -s -X POST "${API_BASE}/investments/confirm" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $INVESTOR_TOKEN" \
            -d "{
                \"investmentId\":\"$INVESTMENT_ID\",
                \"transactionHash\":\"$TX_HASH\"
            }")
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
        
        if echo "$response" | grep -q "Investment confirmed successfully"; then
            echo -e "${GREEN}✓ Investissement confirmé${NC}"
            echo ""
            
            # 9. Émettre le token
            echo -e "${BLUE}9️⃣  Émission du token...${NC}"
            response=$(curl -s -X POST "${API_BASE}/campaigns/$CAMPAIGN_ID/issue-token" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $STARTUP_TOKEN" \
                -d "{
                    \"totalSupply\":1000000,
                    \"metadata\":{
                        \"name\":\"XRPL Test Token\",
                        \"description\":\"Token de test émis sur XRPL Testnet\"
                    }
                }")
            echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
            
            if echo "$response" | grep -q "Token issued successfully"; then
                echo -e "${GREEN}✅ Token émis avec succès !${NC}"
                TOKEN_SYMBOL=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', {}).get('symbol', ''))" 2>/dev/null)
                echo "Token Symbol: $TOKEN_SYMBOL"
            else
                echo -e "${RED}✗ Échec de l'émission de token${NC}"
            fi
        else
            echo -e "${RED}✗ Échec de confirmation de l'investissement${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Transaction hash non fourni, test arrêté${NC}"
    fi
fi

echo ""
echo "✅ Test terminé"
echo ""
echo "📝 Résumé :"
echo "  - Startup: $STARTUP_EMAIL"
echo "  - Investor: $INVESTOR_EMAIL"
echo "  - Campaign ID: $CAMPAIGN_ID"
echo "  - Investment ID: $INVESTMENT_ID"
echo "  - Wallet: $WALLET_ADDRESS"

