# 🚀 Guide de démarrage rapide - Backend

## Installation en 5 minutes

### 1. Installer les dépendances
```bash
cd backend
npm install
```

### 2. Configurer l'environnement
```bash
cp .env.example .env
```

Éditez `.env` avec vos valeurs (au minimum DATABASE_URL et JWT_SECRET).

### 3. Configurer la base de données

#### Option A : PostgreSQL local
```bash
# Assurez-vous que PostgreSQL est installé et démarré
# Créez une base de données
createdb hackathon_rome

# Mettez à jour DATABASE_URL dans .env
# DATABASE_URL="postgresql://user:password@localhost:5432/hackathon_rome"
```

#### Option B : Supabase (Recommandé)
1. Allez sur https://supabase.com
2. Créez un nouveau projet
3. Allez dans Settings > Database
4. Copiez la "Connection string" (mode "Session")
5. Collez-la dans votre `.env` comme DATABASE_URL

### 4. Initialiser Prisma
```bash
# Générer le client Prisma
npm run prisma:generate

# Créer les tables dans la base de données
npm run migrate

# (Optionnel) Ajouter des données de test
npm run db:seed
```

### 5. Démarrer le serveur
```bash
npm run dev
```

Le serveur démarre sur http://localhost:3000 🎉

## Tests rapides

### Avec cURL

```bash
# 1. Créer un utilisateur
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "Demo123!",
    "name": "Demo User",
    "role": "INVESTOR"
  }'

# 2. Se connecter
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "Demo123!"
  }'

# 3. Récupérer le profil (remplacez YOUR_TOKEN par le token reçu)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Avec le seed

Si vous avez fait `npm run db:seed`, utilisez ces credentials :
- **Investor:** `investor@test.com` / `Password123!`
- **Startup:** `startup@test.com` / `Password123!`

### Avec Postman

Importez le fichier `postman_collection.json` dans Postman et testez les endpoints.

## Problèmes courants

### "Cannot find module '@prisma/client'"
```bash
npm run prisma:generate
```

### "Can't reach database server"
Vérifiez que :
- PostgreSQL est démarré
- Votre DATABASE_URL est correct dans `.env`
- Les credentials de connexion sont bons

### Erreur de migration
```bash
# Reset la base (⚠️ supprime toutes les données)
npx prisma migrate reset
```

## Prochaines étapes

- [ ] Tester les endpoints avec Postman
- [ ] Créer les endpoints pour les campagnes
- [ ] Intégrer XRPL
- [ ] Ajouter les tests unitaires

Bon développement ! 🚀
