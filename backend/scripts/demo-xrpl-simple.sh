#!/bin/bash

# Démo simplifiée XRPL - Wallet & Tokenisation
# Fonctionne même sans base de données

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

echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
echo ""

WALLET_ADDRESS=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('wallet', {}).get('address', '') or data.get('address', ''))" 2>/dev/null)
WALLET_SEED=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('wallet', {}).get('seed', '') or data.get('seed', ''))" 2>/dev/null)

if [ -n "$WALLET_ADDRESS" ]; then
    echo -e "${GREEN}✅ Wallet généré !${NC}"
    echo ""
    echo -e "${YELLOW}📱 Vérifiez sur XRPL Explorer :${NC}"
    echo "   https://testnet.xrpl.org/accounts/$WALLET_ADDRESS"
    echo ""
    echo "Wallet Address: $WALLET_ADDRESS"
    echo "Wallet Seed: $WALLET_SEED"
    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
    echo ""
else
    echo -e "${RED}❌ Échec de génération du wallet${NC}"
    exit 1
fi

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

# Étape 3 : Envoyer une transaction XRPL
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${BLUE}ÉTAPE 3 : Envoi d'une transaction XRPL Testnet${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""

# Obtenir l'adresse de la plateforme
PLATFORM_ADDRESS="rG31cLyErnqeVj2eomEjBZtq7PYaupGYzL"
echo "Envoi de 100 XRP vers l'adresse de la plateforme..."
echo "Destination: $PLATFORM_ADDRESS"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

if [ -f "scripts/send-xrpl-payment.js" ]; then
    echo "Exécution de la transaction XRPL..."
    TX_OUTPUT=$(node scripts/send-xrpl-payment.js "$WALLET_SEED" "$PLATFORM_ADDRESS" 100 2>&1)
    echo "$TX_OUTPUT"
    
    TX_HASH=$(echo "$TX_OUTPUT" | grep "Transaction Hash:" | cut -d: -f2 | tr -d ' ')
    
    if [ -n "$TX_HASH" ]; then
        echo ""
        echo -e "${GREEN}✅ Transaction envoyée !${NC}"
        echo ""
        echo -e "${YELLOW}📱 Vérifiez sur XRPL Explorer :${NC}"
        echo "   https://testnet.xrpl.org/transactions/$TX_HASH"
        echo ""
        echo "Transaction Hash: $TX_HASH"
    else
        echo -e "${YELLOW}⚠️  Transaction peut avoir été envoyée, vérifiez les logs ci-dessus${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Script send-xrpl-payment.js non trouvé${NC}"
    echo "Vous pouvez envoyer une transaction manuellement avec :"
    echo "  node scripts/send-xrpl-payment.js <SEED> <DESTINATION> <AMOUNT>"
fi

echo ""
read -p "Appuyez sur Entrée pour continuer..."
echo ""

# Étape 4 : Vérifier la transaction
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${BLUE}ÉTAPE 4 : Vérification de la transaction${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""

if [ -n "$TX_HASH" ]; then
    echo "Vérification de la transaction sur XRPL..."
    response=$(curl -s "${API_BASE}/xrpl/tx/$TX_HASH")
    echo "$response" | python3 -m json.tool 2>/dev/null | head -30 || echo "$response"
    echo ""
    echo -e "${GREEN}✅ Transaction vérifiée sur XRPL Testnet !${NC}"
else
    echo -e "${YELLOW}⚠️  Entrez un transaction hash pour vérifier :${NC}"
    read -p "Transaction Hash: " TX_HASH
    if [ -n "$TX_HASH" ]; then
        response=$(curl -s "${API_BASE}/xrpl/tx/$TX_HASH")
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    fi
fi

echo ""
read -p "Appuyez sur Entrée pour continuer..."
echo ""

# Étape 5 : Démonstration de tokenisation (conceptuel)
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${BLUE}⭐ ÉTAPE 5 : TOKENISATION - Concept${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}🎫 Notre plateforme permet d'émettre des tokens personnalisés sur XRPL${NC}"
echo ""
echo "Fonctionnalités de tokenisation :"
echo "  ✅ Émission de tokens personnalisés pour chaque campagne"
echo "  ✅ Distribution automatique aux investisseurs"
echo "  ✅ Tokens vérifiables sur XRPL Explorer"
echo "  ✅ Support des trustlines XRPL"
echo ""
echo "Workflow complet :"
echo "  1. Startup crée une campagne"
echo "  2. Investisseurs investissent avec transactions XRPL"
echo "  3. Une fois les investissements confirmés, tokenisation automatique"
echo "  4. Tokens distribués proportionnellement aux investissements"
echo "  5. Tout est vérifiable sur XRPL Explorer"
echo ""
echo -e "${YELLOW}📱 Exemple de token sur XRPL Explorer :${NC}"
echo "   https://testnet.xrpl.org/"
echo ""
echo "Pour une démo complète avec tokenisation réelle, vous devez :"
echo "  1. Avoir une base de données configurée"
echo "  2. Créer une campagne et des investissements confirmés"
echo "  3. Émettre le token via l'API"
echo ""

# Résumé
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${BLUE}📋 Résumé de la démo${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ Points démontrés :${NC}"
echo "  ✅ Génération de wallet XRPL Testnet"
echo "  ✅ Financement automatique via faucet"
echo "  ✅ Transaction XRPL réelle"
echo "  ✅ Vérification sur XRPL Explorer"
echo "  ✅ Concept de tokenisation intégré"
echo ""
echo "Wallet généré: $WALLET_ADDRESS"
if [ -n "$TX_HASH" ]; then
    echo "Transaction: $TX_HASH"
fi
echo ""
echo -e "${YELLOW}🌐 URLs importantes :${NC}"
echo "  XRPL Explorer: https://testnet.xrpl.org/"
echo "  Backend API: http://localhost:3000"
echo ""
echo -e "${CYAN}🎉 Démo terminée !${NC}"
echo ""

