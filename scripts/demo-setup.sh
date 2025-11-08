#!/bin/bash

# Script de préparation pour la démo
# Ce script prépare l'environnement avec des données de test

BASE_URL="http://localhost:3000"
API_BASE="${BASE_URL}/api"

echo "🎬 Préparation de la démo"
echo "=========================="
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

echo -e "${GREEN}✅ Serveur backend actif${NC}"
echo ""

# 1. Créer un compte Startup de démo
echo -e "${BLUE}1️⃣  Création du compte Startup de démo...${NC}"
response=$(curl -s -X POST "${API_BASE}/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"demo-startup@test.com","password":"Demo123!","name":"Demo Startup","role":"STARTUP"}')

if echo "$response" | grep -q "User created successfully"; then
    echo -e "${GREEN}✓ Compte Startup créé${NC}"
else
    echo -e "${YELLOW}⚠ Compte Startup existe déjà${NC}"
fi

# Se connecter
response=$(curl -s -X POST "${API_BASE}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"demo-startup@test.com","password":"Demo123!"}')
STARTUP_TOKEN=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)
echo ""

# 2. Créer un compte Investor de démo
echo -e "${BLUE}2️⃣  Création du compte Investor de démo...${NC}"
response=$(curl -s -X POST "${API_BASE}/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"demo-investor@test.com","password":"Demo123!","name":"Demo Investor","role":"INVESTOR"}')

if echo "$response" | grep -q "User created successfully"; then
    echo -e "${GREEN}✓ Compte Investor créé${NC}"
else
    echo -e "${YELLOW}⚠ Compte Investor existe déjà${NC}"
fi

# Se connecter
response=$(curl -s -X POST "${API_BASE}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"demo-investor@test.com","password":"Demo123!"}')
INVESTOR_TOKEN=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)
echo ""

# 3. Créer une campagne de démo
echo -e "${BLUE}3️⃣  Création d'une campagne de démo...${NC}"
START_DATE=$(date -u -v+1d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d "+1 day" +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%S.000Z")
END_DATE=$(date -u -v+30d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d "+30 days" +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%S.000Z")

response=$(curl -s -X POST "${API_BASE}/campaigns" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $STARTUP_TOKEN" \
    -d "{
        \"title\":\"Projet Innovant - Démo Hackathon\",
        \"description\":\"Une plateforme révolutionnaire qui utilise la blockchain XRPL pour le crowdfunding. Ce projet démontre l'intégration complète entre une application web moderne et la blockchain XRPL Testnet.\",
        \"goalAmount\":50000,
        \"startDate\":\"$START_DATE\",
        \"endDate\":\"$END_DATE\"
    }")

CAMPAIGN_ID=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('campaign', {}).get('id', '') or data.get('id', ''))" 2>/dev/null)

if [ -n "$CAMPAIGN_ID" ]; then
    echo -e "${GREEN}✓ Campagne créée (ID: $CAMPAIGN_ID)${NC}"
    
    # Activer la campagne
    response=$(curl -s -X PUT "${API_BASE}/campaigns/$CAMPAIGN_ID" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $STARTUP_TOKEN" \
        -d '{"status":"ACTIVE"}')
    echo -e "${GREEN}✓ Campagne activée${NC}"
else
    echo -e "${YELLOW}⚠ Campagne existe peut-être déjà${NC}"
fi
echo ""

# 4. Générer un wallet Testnet pour l'investor
echo -e "${BLUE}4️⃣  Génération d'un wallet Testnet...${NC}"
response=$(curl -s -X POST "${API_BASE}/xrpl/wallet/generate" \
    -H "Content-Type: application/json" \
    -d "{}")
WALLET_ADDRESS=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('wallet', {}).get('address', '') or data.get('address', ''))" 2>/dev/null)
echo -e "${GREEN}✓ Wallet généré: $WALLET_ADDRESS${NC}"
echo ""

# 5. Résumé
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}✅ Préparation terminée !${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo "📋 Comptes de démo créés :"
echo "   Startup: demo-startup@test.com / Demo123!"
echo "   Investor: demo-investor@test.com / Demo123!"
echo ""
echo "📊 Campagne de démo :"
echo "   ID: $CAMPAIGN_ID"
echo "   Status: ACTIVE"
echo ""
echo "💼 Wallet Testnet :"
echo "   Address: $WALLET_ADDRESS"
echo ""
echo "🌐 URLs :"
echo "   Frontend User: http://localhost:8081"
echo "   Frontend Startup: http://localhost:8080"
echo "   Backend API: http://localhost:3000"
echo ""
echo "🎬 Vous êtes prêt pour la démo !"
echo ""

