#!/bin/bash

# Script de test manuel pour l'émission de tokens
# Ce script montre les commandes à exécuter étape par étape

BASE_URL="http://localhost:3000"
API_BASE="${BASE_URL}/api"

echo "🚀 Guide de test manuel pour l'émission de tokens sur XRPL Testnet"
echo "===================================================================="
echo ""
echo "⚠️  Assurez-vous que le serveur backend est en cours d'exécution :"
echo "   cd backend && npm run dev"
echo ""
read -p "Appuyez sur Entrée pour continuer..."

echo ""
echo "📋 ÉTAPE 1 : Créer un utilisateur Startup"
echo "------------------------------------------"
echo "curl -X POST $API_BASE/auth/register \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\":\"startup@test.com\",\"password\":\"Password123!\",\"name\":\"Test Startup\",\"role\":\"STARTUP\"}'"
echo ""
read -p "Appuyez sur Entrée après avoir créé le startup..."
echo ""

echo "📋 ÉTAPE 2 : Se connecter en tant que Startup"
echo "---------------------------------------------"
echo "curl -X POST $API_BASE/auth/login \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\":\"startup@test.com\",\"password\":\"Password123!\"}'"
echo ""
echo "Copiez le token reçu et définissez-le :"
echo "export STARTUP_TOKEN=\"<votre_token>\""
echo ""
read -p "Appuyez sur Entrée après avoir obtenu le token..."
echo ""

echo "📋 ÉTAPE 3 : Créer une campagne"
echo "-------------------------------"
START_DATE=$(date -u -v+1d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d "+1 day" +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%S.000Z")
END_DATE=$(date -u -v+30d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d "+30 days" +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%S.000Z")

echo "curl -X POST $API_BASE/campaigns \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer \$STARTUP_TOKEN\" \\"
echo "  -d '{"
echo "    \"title\":\"Token Test Campaign\","
echo "    \"description\":\"Campagne pour tester l'\''émission de tokens\","
echo "    \"goalAmount\":10000,"
echo "    \"startDate\":\"$START_DATE\","
echo "    \"endDate\":\"$END_DATE\""
echo "  }'"
echo ""
echo "Copiez le campaign.id reçu et définissez-le :"
echo "export CAMPAIGN_ID=\"<campaign_id>\""
echo ""
read -p "Appuyez sur Entrée après avoir créé la campagne..."
echo ""

echo "📋 ÉTAPE 4 : Activer la campagne"
echo "---------------------------------"
echo "curl -X PUT $API_BASE/campaigns/\$CAMPAIGN_ID \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer \$STARTUP_TOKEN\" \\"
echo "  -d '{\"status\":\"ACTIVE\"}'"
echo ""
read -p "Appuyez sur Entrée après avoir activé la campagne..."
echo ""

echo "📋 ÉTAPE 5 : Créer un utilisateur Investor"
echo "-------------------------------------------"
echo "curl -X POST $API_BASE/auth/register \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\":\"investor@test.com\",\"password\":\"Password123!\",\"name\":\"Test Investor\",\"role\":\"INVESTOR\"}'"
echo ""
read -p "Appuyez sur Entrée après avoir créé l'investor..."
echo ""

echo "📋 ÉTAPE 6 : Se connecter en tant qu'Investor"
echo "----------------------------------------------"
echo "curl -X POST $API_BASE/auth/login \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\":\"investor@test.com\",\"password\":\"Password123!\"}'"
echo ""
echo "Copiez le token reçu et définissez-le :"
echo "export INVESTOR_TOKEN=\"<votre_token>\""
echo ""
read -p "Appuyez sur Entrée après avoir obtenu le token..."
echo ""

echo "📋 ÉTAPE 7 : Générer un wallet Testnet"
echo "---------------------------------------"
echo "curl -X POST $API_BASE/xrpl/wallet/generate \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{}'"
echo ""
echo "Copiez le wallet.address et wallet.seed reçus :"
echo "export WALLET_ADDRESS=\"<address>\""
echo "export WALLET_SEED=\"<seed>\""
echo ""
read -p "Appuyez sur Entrée après avoir généré le wallet..."
echo ""

echo "📋 ÉTAPE 8 : Créer un investissement"
echo "-------------------------------------"
echo "curl -X POST $API_BASE/investments/invest \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer \$INVESTOR_TOKEN\" \\"
echo "  -d '{"
echo "    \"campaignId\":\"\$CAMPAIGN_ID\","
echo "    \"amount\":1000"
echo "  }'"
echo ""
echo "Copiez l'investment.id et depositAddress reçus :"
echo "export INVESTMENT_ID=\"<investment_id>\""
echo "export DEPOSIT_ADDRESS=\"<deposit_address>\""
echo ""
read -p "Appuyez sur Entrée après avoir créé l'investissement..."
echo ""

echo "📋 ÉTAPE 9 : Envoyer une transaction XRPL Testnet"
echo "--------------------------------------------------"
echo "Utilisez le script Node.js :"
echo ""
echo "cd backend"
echo "node scripts/send-xrpl-payment.js \$WALLET_SEED \$DEPOSIT_ADDRESS 1000"
echo ""
echo "OU utilisez cette commande curl pour créer un script Node.js :"
echo ""
cat << 'EOF'
cat > /tmp/send-payment.js << 'SCRIPT'
const { Client, Wallet, xrpToDrops } = require('xrpl');
(async () => {
  const client = new Client('wss://s.altnet.rippletest.net:51233');
  await client.connect();
  const wallet = Wallet.fromSeed(process.env.WALLET_SEED);
  const payment = {
    TransactionType: 'Payment',
    Account: wallet.address,
    Destination: process.env.DEPOSIT_ADDRESS,
    Amount: xrpToDrops(1000)
  };
  const prepared = await client.autofill(payment);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);
  console.log('Transaction Hash:', result.result.hash);
  await client.disconnect();
})();
SCRIPT
WALLET_SEED="$WALLET_SEED" DEPOSIT_ADDRESS="$DEPOSIT_ADDRESS" node /tmp/send-payment.js
EOF
echo ""
echo "Copiez le Transaction Hash reçu :"
echo "export TX_HASH=\"<transaction_hash>\""
echo ""
read -p "Appuyez sur Entrée après avoir envoyé la transaction..."
echo ""

echo "📋 ÉTAPE 10 : Confirmer l'investissement"
echo "-----------------------------------------"
echo "curl -X POST $API_BASE/investments/confirm \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer \$INVESTOR_TOKEN\" \\"
echo "  -d '{"
echo "    \"investmentId\":\"\$INVESTMENT_ID\","
echo "    \"transactionHash\":\"\$TX_HASH\""
echo "  }'"
echo ""
read -p "Appuyez sur Entrée après avoir confirmé l'investissement..."
echo ""

echo "📋 ÉTAPE 11 : Émettre le token"
echo "------------------------------"
echo "curl -X POST $API_BASE/campaigns/\$CAMPAIGN_ID/issue-token \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer \$STARTUP_TOKEN\" \\"
echo "  -d '{"
echo "    \"totalSupply\":1000000,"
echo "    \"metadata\":{"
echo "      \"name\":\"Test Token\","
echo "      \"description\":\"Token de test\""
echo "    }"
echo "  }'"
echo ""
echo "✅ Si tout fonctionne, vous devriez voir : \"Token issued successfully\""
echo ""

echo "📋 ÉTAPE 12 : Vérifier le token émis"
echo "------------------------------------"
echo "curl $API_BASE/campaigns/\$CAMPAIGN_ID/token"
echo ""

echo "✅ Test terminé !"
echo ""
echo "📝 Résumé des variables à définir :"
echo "  STARTUP_TOKEN"
echo "  INVESTOR_TOKEN"
echo "  CAMPAIGN_ID"
echo "  WALLET_ADDRESS"
echo "  WALLET_SEED"
echo "  INVESTMENT_ID"
echo "  DEPOSIT_ADDRESS"
echo "  TX_HASH"

