#!/bin/bash

# Script de test spécifique pour l'émission de tokens
# Ce script teste le workflow complet : campagne -> investissement -> token

BASE_URL="http://localhost:3000"
API_BASE="${BASE_URL}/api"

echo "🧪 Test de l'émission de tokens"
echo "================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Créer un utilisateur Startup
echo "1️⃣  Création d'un utilisateur Startup..."
STARTUP_EMAIL="startup-token-$(date +%s)@test.com"
response=$(curl -s -X POST "${API_BASE}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$STARTUP_EMAIL\",\"password\":\"Password123!\",\"name\":\"Token Startup\",\"role\":\"STARTUP\"}")
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
echo "2️⃣  Création d'un utilisateur Investor..."
INVESTOR_EMAIL="investor-token-$(date +%s)@test.com"
response=$(curl -s -X POST "${API_BASE}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$INVESTOR_EMAIL\",\"password\":\"Password123!\",\"name\":\"Token Investor\",\"role\":\"INVESTOR\"}")
INVESTOR_TOKEN=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)
if [ -z "$INVESTOR_TOKEN" ]; then
    response=$(curl -s -X POST "${API_BASE}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$INVESTOR_EMAIL\",\"password\":\"Password123!\"}")
    INVESTOR_TOKEN=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)
fi
echo -e "${GREEN}✓ Investor créé${NC}"
echo ""

# 3. Créer une campagne
echo "3️⃣  Création d'une campagne..."
START_DATE=$(date -u -v+1d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d "+1 day" +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%S.000Z")
END_DATE=$(date -u -v+30d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d "+30 days" +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%S.000Z")

response=$(curl -s -X POST "${API_BASE}/campaigns" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $STARTUP_TOKEN" \
    -d "{
        \"title\":\"Token Test Campaign\",
        \"description\":\"Campagne pour tester l'émission de tokens\",
        \"goalAmount\":10000,
        \"startDate\":\"$START_DATE\",
        \"endDate\":\"$END_DATE\"
    }")
CAMPAIGN_ID=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('campaign', {}).get('id', '') or data.get('id', ''))" 2>/dev/null)
echo "Campaign ID: $CAMPAIGN_ID"
echo -e "${GREEN}✓ Campagne créée${NC}"
echo ""

# 4. Activer la campagne (changer le status de DRAFT à ACTIVE)
echo "4️⃣  Activation de la campagne..."
if [ -n "$CAMPAIGN_ID" ]; then
    response=$(curl -s -X PUT "${API_BASE}/campaigns/$CAMPAIGN_ID" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $STARTUP_TOKEN" \
        -d "{\"status\":\"ACTIVE\"}")
    echo "$response" | python3 -m json.tool 2>/dev/null | head -10 || echo "$response"
    echo -e "${GREEN}✓ Campagne activée${NC}"
    echo ""
fi

# 5. Générer un wallet pour l'investor
echo "5️⃣  Génération d'un wallet pour l'investor..."
response=$(curl -s -X POST "${API_BASE}/xrpl/wallet/generate" \
    -H "Content-Type: application/json" \
    -d "{}")
WALLET_ADDRESS=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('wallet', {}).get('address', '') or data.get('address', ''))" 2>/dev/null)
echo "Wallet Address: $WALLET_ADDRESS"
echo -e "${GREEN}✓ Wallet généré${NC}"
echo ""

# 6. Mettre à jour l'investor avec le wallet
echo "6️⃣  Mise à jour de l'investor avec le wallet..."
# Note: Il faudrait une route pour mettre à jour le walletAddress, mais on peut continuer sans

# 7. Créer un investissement
echo "7️⃣  Création d'un investissement..."
if [ -n "$CAMPAIGN_ID" ] && [ -n "$INVESTOR_TOKEN" ] && [ -n "$WALLET_ADDRESS" ]; then
    response=$(curl -s -X POST "${API_BASE}/investments/invest" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $INVESTOR_TOKEN" \
        -d "{
            \"campaignId\":\"$CAMPAIGN_ID\",
            \"amount\":1000,
            \"walletAddress\":\"$WALLET_ADDRESS\"
        }")
    INVESTMENT_ID=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('investment', {}).get('id', '') or data.get('id', ''))" 2>/dev/null)
    echo "$response" | python3 -m json.tool 2>/dev/null | head -20 || echo "$response"
    echo "Investment ID: $INVESTMENT_ID"
    echo -e "${GREEN}✓ Investissement créé${NC}"
    echo ""
    
    # 8. Simuler la confirmation de l'investissement (ajouter un transactionHash)
    echo "8️⃣  Confirmation de l'investissement..."
    echo -e "${YELLOW}⚠ Note: Dans un vrai scénario, le transactionHash viendrait de XRPL${NC}"
    echo "Pour tester, vous devez manuellement mettre à jour l'investissement avec un transactionHash"
    echo ""
fi

# 9. Tester l'émission de token
echo "9️⃣  Test de l'émission de token..."
if [ -n "$CAMPAIGN_ID" ] && [ -n "$STARTUP_TOKEN" ]; then
    response=$(curl -s -X POST "${API_BASE}/campaigns/$CAMPAIGN_ID/issue-token" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $STARTUP_TOKEN" \
        -d "{
            \"totalSupply\":1000000,
            \"metadata\":{
                \"name\":\"Test Token\",
                \"description\":\"Token de test\"
            }
        }")
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    
    if echo "$response" | grep -q "Token issued successfully"; then
        echo -e "${GREEN}✓ Token émis avec succès !${NC}"
    else
        echo -e "${RED}✗ Échec de l'émission de token${NC}"
        echo "Raison probable:"
        echo "  - Campagne pas ACTIVE/COMPLETED"
        echo "  - Pas d'investissements confirmés (transactionHash manquant)"
    fi
    echo ""
fi

echo "✅ Test terminé"
echo ""
echo "Pour que l'émission de token fonctionne, vous devez :"
echo "  1. Activer la campagne (status = ACTIVE)"
echo "  2. Créer un investissement avec un transactionHash (confirmation XRPL)"
echo "  3. Puis émettre le token"

