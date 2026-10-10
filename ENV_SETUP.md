# Variables d'environnement requises

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# JWT Secret (doit être identique à celui du projet original)
JWT_SECRET=your_jwt_secret_key_here

# Server Port (optional, defaults to 3000)
PORT=3000
```

Pour obtenir ces valeurs depuis le projet original `secours-supabase`, copiez le contenu du fichier `.env` existant.
