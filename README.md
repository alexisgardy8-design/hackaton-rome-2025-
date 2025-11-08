Hackathon Rome 2025 – Plateforme de Crowdfunding
Ce projet a été réalisé dans le cadre du Hackathon de Rome 2025.
Il s’agit d’une plateforme de financement participatif qui met en relation des startups souhaitant lancer leurs campagnes et des investisseurs cherchant à soutenir des projets prometteurs.
L’objectif est de proposer une solution complète et moderne permettant à chacun de gérer facilement les campagnes de financement, depuis leur création jusqu’à leur suivi.
Présentation générale
La plateforme se compose de deux interfaces distinctes :
Une interface pour les créateurs de campagnes, où les startups peuvent créer, personnaliser et gérer leurs projets.
Une interface pour les investisseurs, qui peuvent découvrir, consulter et financer les campagnes actives.
Le backend repose sur une architecture Node.js couplée à Supabase pour la gestion des données et de l’authentification.
Le frontend est développé en React avec une approche moderne, performante et responsive.
Objectifs du projet
Permettre la création et la gestion de campagnes de financement.
Offrir une expérience fluide aux investisseurs pour consulter et participer aux projets.
Garantir une sécurité fiable grâce à une authentification robuste et une gestion claire des droits.
Fournir une interface simple, esthétique et intuitive.
Architecture du projet
Le projet est organisé en trois parties principales :
Backend : une API REST développée avec Node.js, Express et Prisma, connectée à une base PostgreSQL via Supabase.
Frontend Startuper : l’interface des créateurs de projets, permettant la configuration et le suivi des campagnes.
Frontend User : l’interface des investisseurs, axée sur la découverte et le financement des projets.
Cette séparation des rôles permet une évolution indépendante des interfaces tout en gardant une base commune fiable et centralisée.
Technologies utilisées
Backend
Node.js et Express.js pour la logique serveur.
Prisma pour la communication avec la base de données.
Supabase (PostgreSQL, Auth, Storage) pour la gestion complète du backend.
JWT et bcrypt pour l’authentification et la sécurité des utilisateurs.
Frontend
React et TypeScript pour la structure de l’application.
Vite pour un développement rapide et efficace.
Tailwind CSS pour le design et la mise en page.
React Hook Form et Zod pour la gestion et la validation des formulaires.
Framer Motion pour les animations et transitions.
Recharts pour la visualisation de données.
Outils de développement
GitHub Actions pour l’intégration continue.
Vercel ou Netlify pour le déploiement.
Cursor comme éditeur principal, basé sur VS Code, pour sa compatibilité avec les outils d’IA.
Fonctionnement général
Lorsqu’un utilisateur se connecte, il est redirigé vers l’interface correspondant à son rôle (startuper ou investisseur).
Les créateurs peuvent alors :
Renseigner les informations de leur campagne,
Ajouter des visuels et des descriptions,
Suivre les montants collectés en temps réel.
Les investisseurs, de leur côté, peuvent :
Parcourir les campagnes disponibles,
Consulter les détails de chaque projet,
Contribuer directement via la plateforme.
Les interactions sont fluides et synchronisées grâce à Supabase, qui assure la gestion des données et la mise à jour instantanée entre les deux interfaces.
