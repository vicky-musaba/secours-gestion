# Instructions pour copier les variables d'environnement

Pour configurer le nouveau projet Next.js, vous devez copier les variables d'environnement depuis le projet original.

## Étapes :

1. Ouvrez le fichier `E:/abc/secours-supabase/.env`
2. Copiez tout son contenu
3. Créez un fichier `E:/abc/secours-supabase-nextjs/.env.local`
4. Collez le contenu
5. Modifiez les variables pour correspondre au format Next.js :

Remplacez :
- `VITE_SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Gardez inchangées :
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DATABASE_URL`
- `JWT_SECRET` (IMPORTANT : doit être identique)
- `PORT`

## Exemple de fichier .env.local :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
SUPABASE_DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
JWT_SECRET=votre_jwt_secret_identique
PORT=3000
```

Une fois le fichier créé, vous pourrez lancer le projet avec :
```bash
cd E:/abc/secours-supabase-nextjs
npm run dev
```
