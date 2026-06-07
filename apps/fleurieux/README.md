# Fleurieux-sur-l'Arbresle 🌿

> Portail de référence du village — un projet [Le Singe du Numérique](https://lesingedunumerique.fr)

## Stack

| Couche | Techno |
|---|---|
| Frontend / Backend | Next.js 15 (App Router) |
| ORM | Prisma 5 |
| Base de données | PostgreSQL 16 |
| Auth | Better Auth |
| Style | Tailwind CSS |
| Infra | Docker Compose + Nginx |

## Lancer en développement

```bash
# 1. Cloner
git clone https://github.com/Stan69000/fleurieux.git
cd fleurieux

# 2. Variables d'env
cp .env.example .env
# → Éditer .env avec vos valeurs

# 3. Dépendances
npm install

# 4. Base de données (PostgreSQL requis en local)
npm run db:push    # Crée les tables
npm run db:seed    # Données de démo

# 5. Lancer
npm run dev
```

## Déploiement (Proxmox / VPS)

```bash
# Depuis le serveur, dans le dossier du projet
cp .env.example .env
# → Remplir .env (POSTGRES_PASSWORD, BETTER_AUTH_SECRET, NEXTAUTH_URL)

docker compose -f docker/docker-compose.yml up -d --build

# SSL avec Certbot (à faire une fois)
certbot certonly --nginx -d fleurieux.info -d www.fleurieux.info
```

## Structure

```
src/
├── app/
│   ├── (public)/          # Pages publiques
│   │   ├── acteurs/       # Liste + fiche acteur
│   │   ├── agenda/        # Calendrier événements
│   │   ├── randos/        # Sentiers et randonnées
│   │   └── actus/         # Fil d'actualités
│   ├── (auth)/
│   │   └── login/         # Connexion admin
│   ├── admin/             # Interface d'administration
│   │   ├── acteurs/       # CRUD acteurs
│   │   ├── agenda/        # CRUD événements
│   │   ├── avis/          # Modération avis
│   │   ├── actus/         # CRUD actualités
│   │   ├── contributeurs/ # Gestion utilisateurs
│   │   └── parametres/    # Config site
│   └── api/               # Routes API REST
├── components/
│   ├── ui/                # Composants génériques (Button, Card...)
│   ├── public/            # Composants pages publiques
│   └── admin/             # Composants interface admin
├── lib/
│   ├── prisma.ts          # Client Prisma singleton
│   ├── auth.ts            # Config Better Auth
│   └── utils.ts           # Utilitaires
└── types/
    └── index.ts           # Types TypeScript partagés

prisma/
├── schema.prisma          # Modèle de données complet
└── seed.ts                # Données initiales

docker/
├── docker-compose.yml     # Stack complète
├── Dockerfile             # Build multi-stage
├── nginx.conf             # Reverse proxy
└── entrypoint.sh          # Migrations auto au démarrage
```

## Rôles utilisateurs

| Rôle | Droits |
|---|---|
| `ADMIN` | Accès total |
| `MODERATEUR` | Valider avis + acteurs en attente |
| `CONTRIBUTEUR` | Créer/modifier ses propres fiches |
| `HABITANT` | Laisser des avis |

## Contribuer

Projet open source sous licence MIT.
Porté par [Le Singe du Numérique](https://lesingedunumerique.fr) — association loi 1901, Fleurieux-sur-l'Arbresle (69210).
