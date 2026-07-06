# Rayon Fruits & Légumes

Application interne pour l'équipe du rayon fruits et légumes : gestion des produits (avec génération de code-barres Code128 pour le pad de scan), planning hebdomadaire (import photo via Gemini), et notes d'équipe. React + Vite, Firebase Firestore (avec persistance hors-ligne).

## Développement local

```bash
npm install
cp .env.example .env   # puis renseigner VITE_GEMINI_API_KEY
npm run dev
```

## Déploiement

Le déploiement sur GitHub Pages est automatique via GitHub Actions à chaque push sur `main` (voir `.github/workflows/deploy.yml`). La clé `VITE_GEMINI_API_KEY` est injectée au build depuis les secrets du dépôt GitHub.
