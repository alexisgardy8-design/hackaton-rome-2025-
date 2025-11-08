#!/bin/bash

# Script de test complet pour toutes les phases de l'API
# Usage: ./scripts/test-all-phases.sh

BASE_URL="http://localhost:3000"
API_BASE="${BASE_URL}/api"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables pour stocker les tokens et IDs
INVESTOR_TOKEN=""
STARTUP_TOKEN=""
CAMPAIGN_ID=""
INVESTMENT_ID=""
TOKEN_ISSUE_CODE=""
DIVIDEND_ID=""

# Compteurs
PASSED=0
FAILED=0

# Fonction pour tester une route
test_route() {
    local phase=$1
    local method=$2
    local base_url_var=$3
    local endpoint=$4
    local description=$5
    local data=$6
    local token=$7
    local expected_status=$8
    
    expected_status=${expected_status:-200}
    
    # Déterminer l'URL de base
    if [ "$base_url_var" = "" ]; then
        url_base="${BASE_URL}"
    else
        url_base="${API_BASE}"
    fi
    
    echo -e "${BLUE}[Phase $phase]${NC} ${YELLOW}$description${NC}"
    echo "  ${method} ${url_base}${endpoint}"
    
    if [ "$method" = "POST" ] || [ "$method" = "PUT" ]; then
        if [ -n "$token" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "${url_base}${endpoint}" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data" 2>&1)
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "${url_base}${endpoint}" \
                -H "Content-Type: application/json" \
                -d "$data" 2>&1)
        fi
    else
        if [ -n "$token" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "${url_base}${endpoint}" \
                -H "Authorization: Bearer $token" 2>&1)
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "${url_base}${endpoint}" 2>&1)
        fi
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "  ${GREEN}✓ Succès (HTTP $http_code)${NC}"
        echo "$body" | python3 -m json.tool 2>/dev/null | head -20 || echo "$body" | head -20
        ((PASSED++))
        echo "$body"
    else
        echo -e "  ${RED}✗ Échec (HTTP $http_code, attendu $expected_status)${NC}"
        echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
        ((FAILED++))
    fi
    echo ""
}

# Fonction pour extraire une valeur JSON
extract_json() {
    local json=$1
    local key=$2
    
    # Essayer d'abord la clé directe
    result=$(echo "$json" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('$key', '') or data.get('campaign', {}).get('$key', '') or data.get('wallet', {}).get('$key', '') or data.get('investment', {}).get('$key', '') or data.get('dividend', {}).get('$key', '') or data.get('token', {}).get('$key', ''))" 2>/dev/null)
    
    if [ -n "$result" ] && [ "$result" != "None" ]; then
        echo "$result"
    else
        # Essayer avec des chemins imbriqués
        echo "$json" | python3 -c "import sys, json; data=json.load(sys.stdin); 
if '$key' == 'id':
    print(data.get('id', '') or data.get('campaign', {}).get('id', '') or data.get('wallet', {}).get('address', '') or data.get('investment', {}).get('id', '') or data.get('dividend', {}).get('id', '') or data.get('token', {}).get('currency', ''))
elif '$key' == 'address':
    print(data.get('address', '') or data.get('wallet', {}).get('address', ''))
else:
    print(data.get('$key', '') or data.get('campaign', {}).get('$key', '') or data.get('wallet', {}).get('$key', '') or data.get('investment', {}).get('$key', '') or data.get('dividend', {}).get('$key', '') or data.get('token', {}).get('$key', ''))" 2>/dev/null
    fi
}

echo "🧪 Test complet de toutes les phases de l'API"
echo "=============================================="
echo ""

# ==========================================
# PHASE 1: Health Checks
# ==========================================
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 1: Health Checks${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

test_route "1.1" "GET" "" "/health" "Health check général" "" "" 200
test_route "1.2" "GET" "" "/health/ready" "Readiness check" "" "" 200
test_route "1.3" "GET" "" "/health/live" "Liveness check" "" "" 200

# ==========================================
# PHASE 2: Authentication
# ==========================================
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 2: Authentication${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Générer des emails uniques
TIMESTAMP=$(date +%s)
INVESTOR_EMAIL="investor${TIMESTAMP}@test.com"
STARTUP_EMAIL="startup${TIMESTAMP}@test.com"

echo "📧 Emails générés:"
echo "   Investor: $INVESTOR_EMAIL"
echo "   Startup: $STARTUP_EMAIL"
echo ""

# Register Investor
echo "2.1 Register Investor"
response=$(curl -s -X POST "${API_BASE}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$INVESTOR_EMAIL\",\"password\":\"Password123!\",\"name\":\"Test Investor\",\"role\":\"INVESTOR\"}" 2>&1)
echo "$response" | python3 -m json.tool 2>/dev/null | head -10 || echo "$response"
echo ""

# Register Startup
echo "2.2 Register Startup"
response=$(curl -s -X POST "${API_BASE}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$STARTUP_EMAIL\",\"password\":\"Password123!\",\"name\":\"Test Startup\",\"role\":\"STARTUP\"}" 2>&1)
echo "$response" | python3 -m json.tool 2>/dev/null | head -10 || echo "$response"
echo ""

# Login Investor
echo "2.3 Login Investor"
response=$(curl -s -X POST "${API_BASE}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$INVESTOR_EMAIL\",\"password\":\"Password123!\"}" 2>&1)
INVESTOR_TOKEN=$(extract_json "$response" "token")
echo "$response" | python3 -m json.tool 2>/dev/null | head -10 || echo "$response"
if [ -n "$INVESTOR_TOKEN" ]; then
    echo -e "  ${GREEN}✓ Token Investor obtenu${NC}"
    ((PASSED++))
else
    echo -e "  ${RED}✗ Échec de connexion Investor${NC}"
    ((FAILED++))
fi
echo ""

# Login Startup
echo "2.4 Login Startup"
response=$(curl -s -X POST "${API_BASE}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$STARTUP_EMAIL\",\"password\":\"Password123!\"}" 2>&1)
STARTUP_TOKEN=$(extract_json "$response" "token")
echo "$response" | python3 -m json.tool 2>/dev/null | head -10 || echo "$response"
if [ -n "$STARTUP_TOKEN" ]; then
    echo -e "  ${GREEN}✓ Token Startup obtenu${NC}"
    ((PASSED++))
else
    echo -e "  ${RED}✗ Échec de connexion Startup${NC}"
    ((FAILED++))
fi
echo ""

# Get Profile
test_route "2.5" "GET" "api" "/auth/me" "Obtenir le profil (Investor)" "" "$INVESTOR_TOKEN" 200

# ==========================================
# PHASE 3: Campagnes
# ==========================================
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 3: Campagnes${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# GET all campaigns
test_route "3.1" "GET" "api" "/campaigns" "Lister toutes les campagnes" "" "" 200

# POST create campaign
echo "3.2 Créer une campagne"
START_DATE=$(date -u -v+1d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d "+1 day" +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%S.000Z")
END_DATE=$(date -u -v+30d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d "+30 days" +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%S.000Z")

response=$(curl -s -X POST "${API_BASE}/campaigns" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $STARTUP_TOKEN" \
    -d "{
        \"title\":\"Test Campaign ${TIMESTAMP}\",
        \"description\":\"Description de la campagne de test\",
        \"goalAmount\":10000,
        \"startDate\":\"$START_DATE\",
        \"endDate\":\"$END_DATE\"
    }" 2>&1)
CAMPAIGN_ID=$(extract_json "$response" "id")
if [ -z "$CAMPAIGN_ID" ]; then
    CAMPAIGN_ID=$(extract_json "$response" "campaign.id")
fi
echo "$response" | python3 -m json.tool 2>/dev/null | head -20 || echo "$response"
if [ -n "$CAMPAIGN_ID" ]; then
    echo -e "  ${GREEN}✓ Campagne créée: $CAMPAIGN_ID${NC}"
    ((PASSED++))
else
    echo -e "  ${RED}✗ Échec de création de campagne${NC}"
    ((FAILED++))
fi
echo ""

# GET campaign by ID
if [ -n "$CAMPAIGN_ID" ]; then
    test_route "3.3" "GET" "api" "/campaigns/$CAMPAIGN_ID" "Obtenir la campagne par ID" "" "" 200
fi

# ==========================================
# PHASE 4: Investissements
# ==========================================
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 4: Investissements${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

if [ -n "$CAMPAIGN_ID" ] && [ -n "$INVESTOR_TOKEN" ]; then
    echo "4.1 Créer un investissement"
    response=$(curl -s -X POST "${API_BASE}/investments/invest" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $INVESTOR_TOKEN" \
        -d "{
            \"campaignId\":\"$CAMPAIGN_ID\",
            \"amount\":1000,
            \"walletAddress\":\"rN8X3Z5V1R3W6nSGzS4LJesXorLaNFzF9c\"
        }" 2>&1)
    INVESTMENT_ID=$(extract_json "$response" "id")
if [ -z "$INVESTMENT_ID" ]; then
    INVESTMENT_ID=$(extract_json "$response" "investment.id")
fi
    echo "$response" | python3 -m json.tool 2>/dev/null | head -20 || echo "$response"
    if [ -n "$INVESTMENT_ID" ]; then
        echo -e "  ${GREEN}✓ Investissement créé: $INVESTMENT_ID${NC}"
        ((PASSED++))
    else
        echo -e "  ${RED}✗ Échec de création d'investissement${NC}"
        ((FAILED++))
    fi
    echo ""
fi

# ==========================================
# PHASE 5: XRPL
# ==========================================
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 5: XRPL${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Generate wallet
echo "5.1 Générer un wallet Testnet"
response=$(curl -s -X POST "${API_BASE}/xrpl/wallet/generate" \
    -H "Content-Type: application/json" \
    -d "{}" 2>&1)
WALLET_ADDRESS=$(extract_json "$response" "address")
if [ -z "$WALLET_ADDRESS" ]; then
    WALLET_ADDRESS=$(extract_json "$response" "wallet.address")
fi
echo "$response" | python3 -m json.tool 2>/dev/null | head -10 || echo "$response"
if [ -n "$WALLET_ADDRESS" ]; then
    echo -e "  ${GREEN}✓ Wallet généré: $WALLET_ADDRESS${NC}"
    ((PASSED++))
else
    echo -e "  ${RED}✗ Échec de génération de wallet${NC}"
    ((FAILED++))
fi
echo ""

# Get balance
if [ -n "$WALLET_ADDRESS" ]; then
    test_route "5.2" "GET" "api" "/xrpl/balance/$WALLET_ADDRESS" "Obtenir le solde du wallet" "" "" 200
fi

# Test transaction (avec hash invalide pour tester la gestion d'erreur)
test_route "5.3" "GET" "api" "/xrpl/tx/0000000000000000000000000000000000000000000000000000000000000000" "Test transaction (hash invalide)" "" "" 404

# ==========================================
# PHASE 6: Tokens
# ==========================================
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 6: Tokens${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

if [ -n "$CAMPAIGN_ID" ] && [ -n "$STARTUP_TOKEN" ]; then
    echo "6.1 Émettre un token pour la campagne"
    response=$(curl -s -X POST "${API_BASE}/campaigns/$CAMPAIGN_ID/issue-token" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $STARTUP_TOKEN" \
        -d "{
            \"tokenName\":\"TestToken\",
            \"tokenSymbol\":\"TEST\",
            \"totalSupply\":1000000
        }" 2>&1)
    TOKEN_ISSUE_CODE=$(extract_json "$response" "token.currency")
    echo "$response" | python3 -m json.tool 2>/dev/null | head -20 || echo "$response"
    if [ -n "$TOKEN_ISSUE_CODE" ] || echo "$response" | grep -q "token"; then
        echo -e "  ${GREEN}✓ Token émis${NC}"
        ((PASSED++))
    else
        echo -e "  ${YELLOW}⚠ Token peut nécessiter une configuration XRPL (vérifier la réponse)${NC}"
        ((FAILED++))
    fi
    echo ""
    
    # Get token info
    test_route "6.2" "GET" "api" "/campaigns/$CAMPAIGN_ID/token" "Obtenir les informations du token" "" "" 200
fi

# ==========================================
# PHASE 7: Dividendes
# ==========================================
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 7: Dividendes${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

if [ -n "$CAMPAIGN_ID" ] && [ -n "$STARTUP_TOKEN" ]; then
    echo "7.1 Créer un dividende"
    response=$(curl -s -X POST "${API_BASE}/dividends/create" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $STARTUP_TOKEN" \
        -d "{
            \"campaignId\":\"$CAMPAIGN_ID\",
            \"amount\":100,
            \"description\":\"Dividende de test\"
        }" 2>&1)
    DIVIDEND_ID=$(extract_json "$response" "id")
if [ -z "$DIVIDEND_ID" ]; then
    DIVIDEND_ID=$(extract_json "$response" "dividend.id")
fi
    echo "$response" | python3 -m json.tool 2>/dev/null | head -20 || echo "$response"
    if [ -n "$DIVIDEND_ID" ]; then
        echo -e "  ${GREEN}✓ Dividende créé: $DIVIDEND_ID${NC}"
        ((PASSED++))
    else
        echo -e "  ${YELLOW}⚠ Dividende peut nécessiter des investissements actifs (vérifier la réponse)${NC}"
        ((FAILED++))
    fi
    echo ""
    
    # Get dividends for campaign
    test_route "7.2" "GET" "api" "/campaigns/$CAMPAIGN_ID/dividends" "Obtenir les dividendes de la campagne" "" "" 200
    
    # Get dividend details
    if [ -n "$DIVIDEND_ID" ]; then
        test_route "7.3" "GET" "api" "/dividends/$DIVIDEND_ID" "Obtenir les détails du dividende" "" "" 200
    fi
fi

# ==========================================
# RÉSUMÉ
# ==========================================
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}RÉSUMÉ DES TESTS${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Tests réussis: $PASSED${NC}"
echo -e "${RED}Tests échoués: $FAILED${NC}"
echo ""
TOTAL=$((PASSED + FAILED))
if [ $TOTAL -gt 0 ]; then
    PERCENTAGE=$((PASSED * 100 / TOTAL))
    echo -e "Taux de réussite: ${PERCENTAGE}%"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les tests sont passés !${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Certains tests ont échoué. Vérifiez les détails ci-dessus.${NC}"
    exit 1
fi

