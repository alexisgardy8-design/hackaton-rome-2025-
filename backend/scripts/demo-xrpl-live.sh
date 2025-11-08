#!/bin/bash

# Script de démo live pour XRPL Testnet
# Montre la connexion wallet et la tokenisation

BASE_URL="http://localhost:3000"
API_BASE="${BASE_URL}/api"

echo "🎬 Démo XRPL Testnet - Wallet & Tokenisation"
echo "=============================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Vérifier que le serveur est en cours d'exécution
if ! curl -s "${BASE_URL}/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ Le serveur backend n'est pas en cours d'exécution${NC}"
    echo "Lancez d'abord: cd backend && npm run dev"
    exit 1
fi

echo -e "${GREEN}✅ Serveur backend actif${NC}"
echo ""

# Étape 1 : Générer un wallet XRPL Testnet
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${BLUE}ÉTAPE 1 : Génération d'un wallet XRPL Testnet${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""
echo "Génération d'un wallet et financement automatique..."
response=$(curl -s -X POST "${API_BASE}/xrpl/wallet/generate" \
    -H "Content-Type: application/json" \
    -d "{}")
WALLET_ADDRESS=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('wallet', {}).get('address', '') or data.get('address', ''))" 2>/dev/null)
WALLET_SEED=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('wallet', {}).get('seed', '') or data.get('seed', ''))" 2>/dev/null)

echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
echo ""
echo -e "${GREEN}✅ Wallet généré !${NC}"
echo ""
echo -e "${YELLOW}📱 Vérifiez sur XRPL Explorer :${NC}"
echo "   https://testnet.xrpl.org/accounts/$WALLET_ADDRESS"
echo ""
read -p "Appuyez sur Entrée pour continuer..."
echo ""

# Étape 2 : Vérifier le solde
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${BLUE}ÉTAPE 2 : Vérification du solde${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""
response=$(curl -s "${API_BASE}/xrpl/balance/$WALLET_ADDRESS")
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
echo ""
read -p "Appuyez sur Entrée pour continuer..."
echo ""

# Étape 3 : Créer une campagne
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${BLUE}ÉTAPE 3 : Création d'une campagne${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""

# Créer Startup
echo "Création d'un compte Startup..."
STARTUP_EMAIL="demo-startup-$(date +%s)@test.com"
response=$(curl -s -X POST "${API_BASE}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$STARTUP_EMAIL\",\"password\":\"Demo123!\",\"name\":\"Demo Startup\",\"role\":\"STARTUP\"}")

response=$(curl -s -X POST "${API_BASE}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$STARTUP_EMAIL\",\"password\":\"Demo123!\"}")
STARTUP_TOKEN=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)

# Créer campagne
START_DATE=$(date -u -v+1d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d "+1 day" +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%S.000Z")
END_DATE=$(date -u -v+30d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d "+30 days" +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%S.000Z")

response=$(curl -s -X POST "${API_BASE}/campaigns" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $STARTUP_TOKEN" \
    -d "{
        \"title\":\"Projet Tokenisé - Démo XRPL\",
        \"description\":\"Démonstration de tokenisation sur XRPL Testnet\",
        \"goalAmount\":10000,
        \"startDate\":\"$START_DATE\",
        \"endDate\":\"$END_DATE\"
    }")
CAMPAIGN_ID=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('campaign', {}).get('id', '') or data.get('id', ''))" 2>/dev/null)

# Activer la campagne
response=$(curl -s -X PUT "${API_BASE}/campaigns/$CAMPAIGN_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $STARTUP_TOKEN" \
    -d '{"status":"ACTIVE"}')

echo -e "${GREEN}✅ Campagne créée et activée (ID: $CAMPAIGN_ID)${NC}"
echo ""
read -p "Appuyez sur Entrée pour continuer..."
echo ""

# Étape 4 : Investir avec le wallet XRPL
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${BLUE}ÉTAPE 4 : Investissement avec wallet XRPL${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""

# Créer Investor
echo "Création d'un compte Investor..."
INVESTOR_EMAIL="demo-investor-$(date +%s)@test.com"
response=$(curl -s -X POST "${API_BASE}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$INVESTOR_EMAIL\",\"password\":\"Demo123!\",\"name\":\"Demo Investor\",\"role\":\"INVESTOR\"}")

response=$(curl -s -X POST "${API_BASE}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$INVESTOR_EMAIL\",\"password\":\"Demo123!\"}")
INVESTOR_TOKEN=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)

# Créer investissement
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
echo ""
echo -e "${YELLOW}📤 Envoi d'une transaction XRPL Testnet...${NC}"
echo ""

# Envoyer transaction XRPL
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."
TX_HASH=$(node scripts/send-xrpl-payment.js "$WALLET_SEED" "$DEPOSIT_ADDRESS" 1000 2>&1 | grep "Transaction Hash:" | cut -d: -f2 | tr -d ' ')

if [ -n "$TX_HASH" ]; then
    echo -e "${GREEN}✅ Transaction envoyée ! Hash: $TX_HASH${NC}"
    echo ""
    echo -e "${YELLOW}📱 Vérifiez sur XRPL Explorer :${NC}"
    echo "   https://testnet.xrpl.org/transactions/$TX_HASH"
    echo ""
    read -p "Appuyez sur Entrée pour confirmer l'investissement..."
    
    # Confirmer investissement
    response=$(curl -s -X POST "${API_BASE}/investments/confirm" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $INVESTOR_TOKEN" \
        -d "{
            \"investmentId\":\"$INVESTMENT_ID\",
            \"transactionHash\":\"$TX_HASH\"
        }")
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    echo -e "${GREEN}✅ Investissement confirmé !${NC}"
else
    echo -e "${RED}❌ Échec de la transaction${NC}"
    echo "Entrez manuellement le transaction hash :"
    read -p "Transaction Hash: " TX_HASH
fi
echo ""

# Étape 5 : TOKENISER ⭐
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${BLUE}⭐ ÉTAPE 5 : TOKENISATION - Émission d'un token XRPL${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}🎫 Émission d'un token personnalisé sur XRPL Testnet...${NC}"
echo ""

response=$(curl -s -X POST "${API_BASE}/campaigns/$CAMPAIGN_ID/issue-token" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $STARTUP_TOKEN" \
    -d '{
        "totalSupply": 1000000,
        "metadata": {
            "name": "Demo Token",
            "description": "Token émis pour la démo XRPL Hackathon"
        }
    }')

echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
echo ""

TOKEN_SYMBOL=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', {}).get('symbol', ''))" 2>/dev/null)
ISSUER_ADDRESS=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', {}).get('issuerAddress', ''))" 2>/dev/null)

if [ -n "$TOKEN_SYMBOL" ]; then
    echo -e "${GREEN}✅ Token émis avec succès !${NC}"
    echo ""
    echo -e "${YELLOW}📱 Vérifiez le token sur XRPL Explorer :${NC}"
    echo "   https://testnet.xrpl.org/accounts/$ISSUER_ADDRESS"
    echo ""
    echo "Token Symbol: $TOKEN_SYMBOL"
    echo "Issuer Address: $ISSUER_ADDRESS"
    echo ""
    echo -e "${CYAN}🎉 DÉMO TERMINÉE !${NC}"
    echo ""
    echo "Points démontrés :"
    echo "  ✅ Wallet XRPL Testnet généré et financé"
    echo "  ✅ Transaction XRPL réelle envoyée"
    echo "  ✅ Token personnalisé émis sur la blockchain"
    echo "  ✅ Tout est vérifiable sur XRPL Explorer"
else
    echo -e "${RED}❌ Échec de l'émission du token${NC}"
    echo "Vérifiez que l'investissement est confirmé"
fi

echo ""
echo "📋 Résumé :"
echo "   Wallet: $WALLET_ADDRESS"
echo "   Campagne: $CAMPAIGN_ID"
echo "   Investissement: $INVESTMENT_ID"
echo "   Transaction: $TX_HASH"
echo "   Token: $TOKEN_SYMBOL"

