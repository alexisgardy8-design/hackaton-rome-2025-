# Guide de contribution

Bienvenue ! Ce document décrit les conventions et règles de développement pour ce projet.

## 🌿 Conventions de nommage des branches

Utilisez l'un des préfixes suivants selon le type de modification :

- `feature/<ticket>-short-desc` — Pour les nouvelles fonctionnalités
- `fix/<ticket>-short-desc` — Pour les corrections de bugs
- `hotfix/<ticket>-short-desc` — Pour les corrections urgentes en production
- `refactor/<ticket>-short-desc` — Pour les refactorisations de code
- `docs/<ticket>-short-desc` — Pour les modifications de documentation

**Exemples :**
```bash
feature/123-add-campaign-creation
fix/456-correct-investor-display
hotfix/789-critical-payment-bug
```

## 📝 Format des messages de commit

Suivez la convention **Conventional Commits** :

```
type(scope): short description

[optional body]

[optional footer]
```

### Types autorisés :
- `feat` — Nouvelle fonctionnalité
- `fix` — Correction de bug
- `docs` — Modifications de documentation
- `style` — Formatage, points-virgules manquants, etc. (pas de changement de code)
- `refactor` — Refactorisation du code (ni feat ni fix)
- `perf` — Amélioration des performances
- `test` — Ajout ou correction de tests
- `chore` — Mise à jour des dépendances, configuration, etc.
- `ci` — Modifications des fichiers et scripts CI/CD

### Exemples :
```bash
feat(api): create campaign endpoint
fix(frontend): correct investment calculation
docs(readme): update setup instructions
chore(deps): upgrade react to v18.3.1
```

## 🔀 Processus de Pull Request

### Règles obligatoires :

1. **Aucun commit direct sur `main`** — Toutes les modifications doivent passer par une PR
2. **Une PR par fonctionnalité/correction** — Gardez les PRs focalisées et de petite taille
3. **Description claire** — Expliquez ce que fait la PR et pourquoi
4. **Tests passants** — Vérifiez que les tests passent avant de soumettre
5. **Review requise** — Au moins une revue de code avant de merger
6. **Résolution des conflits** — Résolvez les conflits avec `main` avant le merge

### Template de PR :

```markdown
## Description
[Décrivez brièvement les modifications]

## Type de changement
- [ ] Nouvelle fonctionnalité (feature)
- [ ] Correction de bug (fix)
- [ ] Refactorisation (refactor)
- [ ] Documentation (docs)

## Comment tester ?
1. [Étape 1]
2. [Étape 2]
3. [Résultat attendu]

## Checklist
- [ ] Mon code suit les conventions du projet
- [ ] J'ai testé mes modifications
- [ ] J'ai mis à jour la documentation si nécessaire
- [ ] Mes commits suivent la convention Conventional Commits
```

## 🛠️ Workflow de développement

1. **Créer une branche** depuis `main` :
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/123-ma-fonctionnalite
   ```

2. **Développer et committer** :
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

3. **Pousser la branche** :
   ```bash
   git push origin feature/123-ma-fonctionnalite
   ```

4. **Créer une Pull Request** sur GitHub

5. **Attendre la review** et effectuer les corrections si nécessaire

6. **Merger** une fois approuvé (squash ou merge selon la situation)

## 📋 Standards de code

### TypeScript/React
- Utilisez TypeScript pour tous les nouveaux fichiers
- Préférez les functional components avec hooks
- Nommez les composants en PascalCase
- Nommez les fichiers de composants avec PascalCase (ex: `MyComponent.tsx`)
- Utilisez des types explicites plutôt que `any`

### Style et formatage
- Utilisez ESLint pour le linting : `npm run lint`
- Indentation : 2 espaces
- Utilisez des guillemets simples pour les strings
- Ajoutez une virgule finale dans les objets et tableaux multi-lignes

### Structure des dossiers
```
src/
  ├── components/     # Composants réutilisables
  ├── pages/          # Pages/routes de l'application
  ├── hooks/          # Custom React hooks
  ├── lib/            # Utilitaires et helpers
  ├── integrations/   # Intégrations externes (Supabase, etc.)
  └── data/           # Données statiques et mocks
```

## 🐛 Signalement de bugs

Créez une issue sur GitHub avec :
- **Titre clair** décrivant le problème
- **Description détaillée** du bug
- **Étapes pour reproduire**
- **Comportement attendu vs actuel**
- **Screenshots** si applicable
- **Environnement** (OS, navigateur, version, etc.)

## 💡 Proposition de fonctionnalités

Créez une issue avec le label `enhancement` :
- **Description** de la fonctionnalité
- **Justification** : pourquoi est-elle utile ?
- **Cas d'usage** concrets
- **Alternatives** considérées

## ❓ Questions

Pour toute question, créez une issue avec le label `question` ou contactez l'équipe.

---

Merci de contribuer au projet ! 🚀
