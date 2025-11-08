#!/bin/bash

# Script de présentation automatique pour la démo
# Ce script guide la présentation étape par étape

BASE_URL="http://localhost:3000"
API_BASE="${BASE_URL}/api"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

clear
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║          🎬 GUIDE DE PRÉSENTATION - XRISE                 ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Fonction pour afficher une section
show_section() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Fonction pour afficher une étape
show_step() {
    echo -e "${CYAN}▶ $1${NC}"
    echo ""
}

# Fonction pour attendre
wait_for_user() {
    echo -e "${YELLOW}Appuyez sur Entrée pour continuer...${NC}"
    read
}

# Vérification de l'environnement
show_section "🔍 VÉRIFICATION DE L'ENVIRONNEMENT"

echo -e "${YELLOW}Vérification du backend...${NC}"
if curl -s "${BASE_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend actif${NC}"
else
    echo -e "${RED}❌ Backend non disponible${NC}"
    echo "Lancez: cd backend && npm run dev"
    exit 1
fi

echo -e "${YELLOW}Vérification des frontends...${NC}"
if curl -s "http://localhost:8080" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend Startup actif${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend Startup non détecté (peut être en cours de démarrage)${NC}"
fi

if curl -s "http://localhost:8081" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend User actif${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend User non détecté (peut être en cours de démarrage)${NC}"
fi

wait_for_user

# Partie 1: Vue d'ensemble
show_section "📊 PARTIE 1: VUE D'ENSEMBLE (2 min)"

show_step "1. Présentation du concept"
echo "   • Plateforme de crowdfunding décentralisée"
echo "   • Basée sur XRP Ledger (XRPL)"
echo "   • Deux interfaces: Startup et Investor"
echo "   • Transactions blockchain réelles"
wait_for_user

show_step "2. Architecture technique"
echo "   • Backend: Node.js + Express + Prisma"
echo "   • Frontend: React + Vite + TypeScript"
echo "   • Base de données: PostgreSQL (Supabase)"
echo "   • Blockchain: XRPL Testnet"
echo "   • Authentification: JWT"
wait_for_user

show_step "3. Stack technologique"
echo "   • API RESTful complète"
echo "   • Séparation frontend/backend"
echo "   • Intégration XRPL native"
echo "   • Design moderne (Shadcn UI)"
wait_for_user

# Partie 2: Interface utilisateur
show_section "🎨 PARTIE 2: INTERFACE UTILISATEUR (5 min)"

show_step "1. Frontend User (Investisseur)"
echo "   • URL: http://localhost:8081"
echo "   • Découvrir les projets"
echo "   • Voir les détails des campagnes"
echo "   • Investir dans des projets"
echo "   • Suivre ses investissements"
wait_for_user

show_step "2. Frontend Startup (Créateur)"
echo "   • URL: http://localhost:8080"
echo "   • Créer des campagnes"
echo "   • Gérer les investissements"
echo "   • Émettre des tokens"
echo "   • Distribuer des dividendes"
wait_for_user

show_step "3. Design et UX"
echo "   • Interface moderne et intuitive"
echo "   • Responsive design"
echo "   • Animations fluides"
echo "   • Feedback en temps réel"
wait_for_user

# Partie 3: Fonctionnalités backend
show_section "⚙️  PARTIE 3: FONCTIONNALITÉS BACKEND (5 min)"

show_step "1. Authentification JWT"
echo "   • Inscription/Connexion sécurisée"
echo "   • Rôles: STARTUP et INVESTOR"
echo "   • Tokens JWT avec expiration"
echo "   • Protection des routes"
wait_for_user

show_step "2. Gestion des campagnes"
echo "   • Création de campagnes"
echo "   • Activation/Désactivation"
echo "   • Suivi des objectifs"
echo "   • Statuts: DRAFT, ACTIVE, FUNDED, COMPLETED"
wait_for_user

show_step "3. Système d'investissement"
echo "   • Création d'investissements"
echo "   • Confirmation via XRPL"
echo "   • Suivi des transactions"
echo "   • Calcul automatique des montants"
wait_for_user

# Partie 4: Intégration XRPL
show_section "🔗 PARTIE 4: INTÉGRATION XRPL (5 min)"

show_step "1. Transactions XRPL Testnet"
echo "   • Génération de wallets"
echo "   • Vérification des soldes"
echo "   • Envoi de transactions"
echo "   • Vérification sur XRPL Explorer"
wait_for_user

show_step "2. Émission de tokens"
echo "   • Création de tokens personnalisés"
echo "   • Configuration des trustlines"
echo "   • Distribution aux investisseurs"
echo "   • Vérification sur blockchain"
wait_for_user

show_step "3. Distribution de dividendes"
echo "   • Création de dividendes"
echo "   • Distribution automatique"
echo "   • Transactions XRPL groupées"
echo "   • Traçabilité complète"
wait_for_user

# Partie 5: Démo live
show_section "🎬 PARTIE 5: DÉMONSTRATION LIVE (3 min)"

show_step "1. Créer une campagne"
echo "   • Ouvrir http://localhost:8080"
echo "   • Se connecter: demo-startup@test.com / Demo123!"
echo "   • Créer une nouvelle campagne"
echo "   • Activer la campagne"
wait_for_user

show_step "2. Faire un investissement"
echo "   • Ouvrir http://localhost:8081"
echo "   • Se connecter: demo-investor@test.com / Demo123!"
echo "   • Parcourir les campagnes"
echo "   • Investir dans une campagne"
echo "   • Générer un wallet XRPL"
echo "   • Envoyer la transaction XRPL"
echo "   • Confirmer l'investissement"
wait_for_user

show_step "3. Émettre un token"
echo "   • Retourner sur le frontend Startup"
echo "   • Émettre un token pour la campagne"
echo "   • Vérifier sur XRPL Explorer"
echo "   • Montrer la transaction blockchain"
wait_for_user

# Résumé
show_section "📝 RÉSUMÉ"

echo -e "${GREEN}Points forts à mettre en avant:${NC}"
echo "   ✅ Intégration blockchain réelle"
echo "   ✅ Architecture moderne et scalable"
echo "   ✅ Expérience utilisateur soignée"
echo "   ✅ Sécurité renforcée"
echo "   ✅ Transparence blockchain"
echo ""

echo -e "${CYAN}URLs importantes:${NC}"
echo "   • Frontend User: http://localhost:8081"
echo "   • Frontend Startup: http://localhost:8080"
echo "   • Backend API: http://localhost:3000"
echo "   • XRPL Explorer: https://testnet.xrpl.org/"
echo ""

echo -e "${MAGENTA}Comptes de démo:${NC}"
echo "   • Startup: demo-startup@test.com / Demo123!"
echo "   • Investor: demo-investor@test.com / Demo123!"
echo ""

echo -e "${GREEN}🎉 Bonne présentation !${NC}"
echo ""

