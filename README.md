# Hackathon Rome 2025 - Plateforme de Crowdfunding

Plateforme de financement participatif avec deux interfaces : une pour les startups (créateurs de campagnes) et une pour les investisseurs.

## 📋 Table des matières

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Développement](#développement)
- [Structure du projet](#structure-du-projet)
- [Technologies](#technologies)
- [Déploiement](#déploiement)
- [Contribution](#contribution)

## 🔧 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

### Node.js et npm

- **Node.js** version 18.x ou supérieure
- **npm** version 9.x ou supérieure

Installation recommandée avec [nvm](https://github.com/nvm-sh/nvm) :

```bash
# Installer nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Installer Node.js LTS
nvm install --lts
nvm use --lts

# Vérifier les versions
node --version  # devrait afficher v18.x ou supérieur
npm --version   # devrait afficher v9.x ou supérieur
```

### Base de données : Supabase

Ce projet utilise **Supabase** comme backend (PostgreSQL + API REST + Auth).

Deux options :

#### Option 1 : Supabase Cloud (Recommandé pour le développement)

1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Récupérez l'URL du projet et la clé API (anon key)
4. Ajoutez-les dans votre fichier `.env` (voir [Configuration](#configuration))

#### Option 2 : Supabase Local

```bash
# Installer Supabase CLI
npm install -g supabase

# Démarrer Supabase en local
supabase start

# Récupérer les credentials locaux
supabase status
```

### Éditeur : Cursor (Optionnel mais recommandé)

[Cursor](https://cursor.sh/) est un éditeur de code basé sur VS Code avec des fonctionnalités IA.

1. Téléchargez Cursor depuis [cursor.sh](https://cursor.sh/)
2. Installez-le
3. Ouvrez le projet : `cursor .`

**Extensions recommandées :**
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features

## 📦 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/alexisgardy8-design/hackaton-rome-2025-.git
cd hackaton-rome-2025-
```

### 2. Installer les dépendances

Le projet contient un backend API et deux applications frontend :

```bash
# Backend API
cd backend
npm install

# Frontend Startuper (Interface créateurs de campagnes)
cd ../frontend-startuper
npm install

# Frontend User (Interface investisseurs)
cd ../frontend-user
npm install
```

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env` dans chaque dossier frontend en vous basant sur `.env.example` :

#### frontend-startuper/.env

```bash
cp .env.example .env
```

Puis éditez `.env` :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon-publique
```

#### frontend-user/.env

```bash
cp .env.example .env
```

Puis éditez `.env` :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon-publique
```

⚠️ **Important :**
- **Ne commitez jamais** les fichiers `.env` dans Git
- Les fichiers `.env` sont déjà dans `.gitignore`
- Partagez les credentials de manière sécurisée (ex: 1Password, Bitwarden)

### Configuration du Backend

Voir le guide complet dans [backend/QUICKSTART.md](backend/QUICKSTART.md)

Résumé rapide :
```bash
cd backend
npm run prisma:generate
npm run migrate
npm run db:seed  # Optionnel : données de test
```

## 🚀 Développement

### Démarrer les serveurs de développement

Ouvrez trois terminaux :

**Terminal 1 - Backend API (port 3000) :**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend Startuper (port 5173) :**
```bash
cd frontend-startuper
npm run dev
```

**Terminal 3 - Frontend User (port 5174) :**
```bash
cd frontend-user
npm run dev
```

Les applications seront accessibles à :
- Backend API : http://localhost:3000
- Frontend Startuper : http://localhost:5173
- Frontend User : http://localhost:5174

### Scripts disponibles

Pour chaque frontend :

```bash
# Démarrer le serveur de développement
npm run dev

# Lancer le linter
npm run lint

# Compiler pour la production
npm run build

# Prévisualiser le build de production
npm run preview
```

## 📁 Structure du projet

```
hackaton-rome-2025-/
├── backend/                     # API REST Node.js + Prisma
│   ├── src/
│   │   ├── controllers/        # Logique métier
│   │   ├── middleware/         # Middlewares Express
│   │   ├── routes/             # Routes API
│   │   ├── utils/              # Utilitaires
│   │   └── server.js           # Point d'entrée
│   ├── prisma/
│   │   ├── schema.prisma       # Schéma de la base de données
│   │   └── seed.js             # Données de test
│   ├── .env.example
│   ├── QUICKSTART.md           # Guide de démarrage rapide
│   └── package.json
│
├── frontend-startuper/          # Interface créateurs de campagnes
│   ├── src/
│   │   ├── components/          # Composants React réutilisables
│   │   ├── pages/               # Pages de l'application
│   │   ├── hooks/               # Custom hooks
│   │   ├── lib/                 # Utilitaires et helpers
│   │   └── main.tsx             # Point d'entrée
│   ├── public/                  # Fichiers statiques
│   ├── .env.example             # Template de variables d'environnement
│   └── package.json
│
├── frontend-user/               # Interface investisseurs
│   ├── src/
│   │   ├── components/          # Composants React réutilisables
│   │   ├── pages/               # Pages de l'application
│   │   ├── integrations/        # Intégrations Supabase
│   │   ├── hooks/               # Custom hooks
│   │   ├── lib/                 # Utilitaires et helpers
│   │   └── main.tsx             # Point d'entrée
│   ├── public/                  # Fichiers statiques
│   ├── .env.example             # Template de variables d'environnement
│   └── package.json
│
├── CONTRIBUTING.md              # Guide de contribution
├── README.md                    # Ce fichier
└── .gitignore                   # Fichiers à ignorer par Git
```

## 🛠️ Technologies

### Backend

- **Runtime :** Node.js 18+ avec ES Modules
- **Framework :** Express.js 4
- **ORM :** Prisma 5
- **Database :** PostgreSQL (via Supabase ou local)
- **Authentication :** JWT + bcrypt
- **Validation :** express-validator
- **Dev Tools :** nodemon

### Frontend

- **Framework :** React 18.3 avec TypeScript
- **Build Tool :** Vite 5
- **Routing :** React Router 6
- **UI Components :** shadcn/ui + Radix UI
- **Styling :** Tailwind CSS 3
- **Forms :** React Hook Form + Zod
- **State Management :** TanStack Query (React Query)
- **Charts :** Recharts
- **Animations :** Framer Motion

### Backend

- **BaaS :** Supabase
- **Database :** PostgreSQL (via Supabase)
- **Auth :** Supabase Auth
- **Storage :** Supabase Storage
- **API :** Auto-generated REST API (Supabase)

### DevOps

- **CI/CD :** GitHub Actions
- **Hosting :** À définir (Vercel, Netlify, ou autre)
- **Version Control :** Git + GitHub

## 🌐 Déploiement

### Déploiement automatique via Lovable

Ce projet est configuré pour être déployé via [Lovable](https://lovable.dev) :

1. Visitez le [projet Lovable](https://lovable.dev/projects/b81049be-3eb3-432c-889d-b5e0acd82eb4)
2. Cliquez sur **Share → Publish**

### Déploiement manuel

#### Avec Vercel

```bash
# Installer Vercel CLI
npm install -g vercel

# Déployer depuis le dossier frontend
cd frontend-startuper  # ou frontend-user
vercel

# Déployer en production
vercel --prod
```

#### Avec Netlify

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Déployer
cd frontend-startuper  # ou frontend-user
npm run build
netlify deploy --prod --dir=dist
```

### Variables d'environnement en production

⚠️ **Important :** Configurez les variables d'environnement sur votre plateforme de déploiement :

**Vercel / Netlify :**
- Ajoutez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans les paramètres du projet

**GitHub Actions :**
- Ajoutez les secrets dans **Settings → Secrets and variables → Actions**

## 🤝 Contribution

Consultez le fichier [CONTRIBUTING.md](CONTRIBUTING.md) pour les conventions de code, le workflow Git et les règles de contribution.

### Workflow rapide

```bash
# 1. Créer une branche
git checkout -b feature/123-ma-fonctionnalite

# 2. Faire vos modifications et commits
git add .
git commit -m "feat(scope): description"

# 3. Pousser et créer une PR
git push origin feature/123-ma-fonctionnalite
```

## 📝 License

[À définir]

## 👥 Équipe

- [Ajouter les membres de l'équipe]

## 📞 Support

Pour toute question ou problème :
- Créez une [issue sur GitHub](https://github.com/alexisgardy8-design/hackaton-rome-2025-/issues)
- Contactez l'équipe

---

**Bon développement ! 🚀**
