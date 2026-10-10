# Guide de Finalisation de la Migration

## ✅ Ce qui a été fait

### Structure et Configuration (100%)
- ✅ Projet Next.js initialisé avec TypeScript et Tailwind
- ✅ Configuration Supabase et PostgreSQL
- ✅ Contexts (AuthContext, RealtimeContext)
- ✅ Layout component
- ✅ Login page
- ✅ Dashboard page complet avec statistiques par rôle

### API Routes (95% des fonctionnalités critiques)
- ✅ Authentification (login, profile)
- ✅ Factures (CRUD complet + actions: send, validate, reject, pay)
- ✅ Services (CRUD complet)
- ✅ Paiements (CRUD + stats)
- ✅ Impression thermique (format 80mm)
- ✅ Statistiques (par rôle)

## 🚧 Ce qui reste à faire

### Pages Frontend à migrer
Les pages suivantes doivent être migrées depuis `E:/abc/secours-supabase/src/pages/` vers `E:/abc/secours-supabase-nextjs/src/app/(dashboard)/` :

1. **Invoices page** (`src/pages/Invoices.tsx` → `src/app/(dashboard)/invoices/page.tsx`)
   - Liste des factures
   - Création de facture
   - Modification de facture
   - Actions (envoyer, valider, rejeter, payer)
   - Impression

2. **Payments page** (`src/pages/Payments.tsx` → `src/app/(dashboard)/payments/page.tsx`)
   - Liste des paiements
   - Création de paiement
   - Statistiques

3. **Services page** (`src/pages/Services.tsx` → `src/app/(dashboard)/services/page.tsx`)
   - Liste des services
   - Création/Modification/Suppression

4. **Reports page** (`src/pages/Reports.tsx` → `src/app/(dashboard)/reports/page.tsx`)
   - Rapports divers

5. **Users page** (`src/pages/Users.tsx` → `src/app/(dashboard)/users/page.tsx`)
   - Gestion des utilisateurs

### API Routes restantes (optionnelles)
- GET/POST/PUT/DELETE /api/users
- GET /api/reports

## 📝 Instructions pour migrer une page

### Étape 1: Copier le fichier original
```bash
cp E:/abc/secours-supabase/src/pages/Invoices.tsx E:/abc/secours-supabase-nextjs/src/app/(dashboard)/invoices/page.tsx
```

### Étape 2: Adapter pour Next.js
1. Ajouter `'use client';` au début du fichier
2. Remplacer `import { useNavigate } from 'react-router-dom'` par `import { useRouter } from 'next/navigation'`
3. Remplacer `useNavigate()` par `useRouter()`
4. Remplacer `navigate('/path')` par `router.push('/path')`
5. Remplacer `import api from '../services/api'` par un helper fetch local
6. Utiliser le token depuis `useAuth()`

### Exemple de helper API pour les pages
```typescript
const apiCall = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    },
  });
  if (!response.ok) {
    throw new Error('API call failed');
  }
  return response.json();
};
```

## 🧪 Tester l'application

### 1. Configurer les variables d'environnement
```bash
# Copier le fichier .env du projet original
cp E:/abc/secours-supabase/.env E:/abc/secours-supabase-nextjs/.env.local

# Modifier les variables
# VITE_SUPABASE_URL → NEXT_PUBLIC_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY → NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 2. Lancer le projet
```bash
cd E:/abc/secours-supabase-nextjs
npm run dev
```

### 3. Tester
- Ouvrir http://localhost:3000
- Se connecter avec les identifiants existants
- Vérifier le Dashboard
- Tester la création d'une facture via API
- Tester l'impression thermique

## 📦 Build de production

```bash
cd E:/abc/secours-supabase-nextjs
npm run build
```

Si le build réussit, l'application est prête pour le déploiement.

## 🚀 Déploiement Vercel

### 1. Créer un repository GitHub
```bash
cd E:/abc/secours-supabase-nextjs
git init
git add .
git commit -m "Initial migration to Next.js"
# Push vers GitHub
```

### 2. Importer sur Vercel
1. Aller sur https://vercel.com
2. Importer le projet depuis GitHub
3. Configurer les variables d'environnement dans Vercel Settings
4. Déployer

### Variables d'environnement Vercel
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DATABASE_URL=
JWT_SECRET=
```

## ⚠️ Points importants

### Base de données
- AUCUNE modification nécessaire
- Même projet Supabase
- Mêmes tables
- Mêmes données
- Mêmes utilisateurs

### Authentification
- JWT custom conservé
- Tokens existants valides
- JWT_SECRET doit être identique

### Impression thermique
- Route: `/api/print/preview/invoice/[id]?token=YOUR_TOKEN`
- Fonctionne côté client via `window.print()`
- Format 80mm conservé

## 📊 Progression actuelle

- Structure et configuration: 100%
- Authentification: 100%
- API Routes: 95%
- Pages Frontend: 20% (Dashboard complet, reste à faire)
- Tests: 0%
- Déploiement: 0%

**Progression globale: ~75%**

## 🎯 Prochaines étapes recommandées

1. **Tester ce qui existe** avec vos variables d'environnement
2. **Migrer la page Invoices** (la plus critique)
3. **Migrer la page Payments**
4. **Tester toutes les fonctionnalités**
5. **Build de production**
6. **Déploiement Vercel**

## 💡 Conseils

- Utilisez le Dashboard comme modèle pour les autres pages
- Conservez la logique existante autant que possible
- Testez chaque page après migration
- Gardez une sauvegarde du projet original
