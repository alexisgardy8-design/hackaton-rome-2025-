#!/bin/bash

# Script de test pour les routes XRPL
# Usage: ./scripts/test-xrpl-routes.sh

BASE_URL="http://localhost:3000"
API_BASE="${BASE_URL}/api/xrpl"

echo "🧪 Test des routes XRPL"
echo "======================"
echo ""

# Couleurs pour l'output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour tester une route
test_route() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "${YELLOW}Test: ${description}${NC}"
    echo "  ${method} ${endpoint}"
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -X POST "${API_BASE}${endpoint}" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    else
        response=$(curl -s -X GET "${API_BASE}${endpoint}" 2>&1)
    fi
    
    # Vérifier si la réponse contient une erreur
    if echo "$response" | grep -q '"error"'; then
        echo -e "  ${RED}✗ Échec${NC}"
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    else
        echo -e "  ${GREEN}✓ Succès${NC}"
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    fi
    echo ""
}

# Test 1: Générer un nouveau wallet
echo "1️⃣  Génération d'un nouveau wallet Testnet"
test_route "POST" "/wallet/generate" "Générer un wallet Testnet" "{}"

# Extraire l'adresse du wallet généré pour les tests suivants
WALLET_ADDRESS=$(curl -s -X POST "${API_BASE}/wallet/generate" \
    -H "Content-Type: application/json" \
    -d "{}" | python3 -c "import sys, json; print(json.load(sys.stdin)['wallet']['address'])" 2>/dev/null)

if [ -n "$WALLET_ADDRESS" ]; then
    echo "   Wallet généré: ${WALLET_ADDRESS}"
    echo ""
    
    # Test 2: Obtenir le solde du wallet généré
    echo "2️⃣  Vérification du solde du wallet généré"
    test_route "GET" "/balance/${WALLET_ADDRESS}" "Obtenir le solde" ""
fi

# Test 3: Obtenir le solde du wallet de la plateforme
PLATFORM_WALLET="rG31cLyErnqeVj2eomEjBZtq7PYaupGYzL"
echo "3️⃣  Vérification du solde du wallet de la plateforme"
test_route "GET" "/balance/${PLATFORM_WALLET}" "Obtenir le solde de la plateforme" ""

# Test 4: Transaction invalide
echo "4️⃣  Test avec un hash de transaction invalide"
test_route "GET" "/tx/0000000000000000000000000000000000000000000000000000000000000000" "Transaction invalide" ""

# Test 5: Adresse invalide
echo "5️⃣  Test avec une adresse invalide"
test_route "GET" "/balance/invalid_address" "Adresse invalide" ""

echo "✅ Tests terminés"
echo ""
echo "Note: Pour tester avec un hash de transaction valide, utilisez:"
echo "  curl ${API_BASE}/tx/<HASH_DE_TRANSACTION>"

