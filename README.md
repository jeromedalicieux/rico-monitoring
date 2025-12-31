# Monitoring Sites SEO

Outil interne de monitoring SEO pour suivre les positions Google, Google Business Profile et les backlinks de vos sites.

## Caractéristiques

- **Suivi de positions Google** : Monitoring automatique des positions de vos mots-clés
- **Google Business Profile** : Détection et suivi de votre fiche GMB
- **Backlinks** : Détection des nouveaux backlinks et des backlinks perdus
- **Historique** : Comparaisons J-1, J-7, J-30 automatiques
- **Alertes** : Notifications en cas de chute de position, fiche GMB perdue, etc.
- **Dashboard** : Interface web moderne pour visualiser vos données
- **Scheduler** : Exécution automatique quotidienne

## Stack technique

### Backend
- Node.js + Express
- SQLite (base de données)
- Playwright (scraping)
- node-cron (scheduler)

### Frontend
- React 18
- Vite
- TailwindCSS
- React Router
- Axios
- Recharts (graphiques)

## Installation

### Prérequis

- Node.js 18+ et npm
- Git (optionnel)

### 1. Installation des dépendances

```bash
# Installer les dépendances racine
npm install

# Installer les dépendances backend
cd backend
npm install

# Installer les navigateurs Playwright
npx playwright install chromium

# Installer les dépendances frontend
cd ../frontend
npm install

# Revenir à la racine
cd ..
```

### 2. Configuration

Copier le fichier `.env.example` vers `.env` dans le dossier backend :

```bash
cd backend
cp .env.example .env
```

Éditer le fichier `.env` selon vos besoins :

```env
# Port du serveur backend
PORT=3001

# Configuration du scraping
SCRAPING_MIN_DELAY=30000        # Délai minimum entre requêtes (30s)
SCRAPING_MAX_DELAY=60000        # Délai maximum entre requêtes (60s)
SCRAPING_HEADLESS=false         # Mode headless (true/false)

# Alertes
ALERT_POSITION_DROP_THRESHOLD=5 # Seuil de chute de position pour alertes

# Cron (par défaut: tous les jours à 9h)
CRON_SCHEDULE=0 9 * * *
```

### 3. Initialisation de la base de données

```bash
cd backend
npm run init-db
```

## Démarrage

### Mode développement

Pour démarrer l'application en mode développement :

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Ou depuis la racine avec concurrently :

```bash
npm run dev
```

L'application sera accessible sur :
- Frontend : http://localhost:3000
- Backend API : http://localhost:3001

### Mode production

```bash
# Build du frontend
cd frontend
npm run build

# Démarrer le backend
cd ../backend
npm start
```

Le frontend buildé sera servi par le backend sur le port 3001.

## Utilisation

### 1. Ajouter un site

1. Accédez à la page "Sites"
2. Cliquez sur "Ajouter un site"
3. Remplissez les informations :
   - Nom du site (ex: "Mon site web")
   - Domaine (ex: "example.com")
   - Nom entreprise GMB (optionnel)
   - Ville GMB (optionnel)
4. Cliquez sur "Créer le site"

### 2. Ajouter des mots-clés

1. Cliquez sur un site dans la liste
2. Cliquez sur "Ajouter un mot-clé"
3. Entrez le mot-clé et validez
4. Répétez pour tous vos mots-clés (max 10 recommandé)

### 3. Lancer un monitoring

#### Manuel
- Depuis le dashboard : cliquez sur "Lancer monitoring"
- Depuis un site : cliquez sur "Positions", "GMB" ou "Backlinks"

#### Automatique
Le monitoring s'exécute automatiquement selon le planning défini dans `CRON_SCHEDULE` (par défaut : tous les jours à 9h).

### 4. Consulter les résultats

- **Dashboard** : Vue d'ensemble de tous vos sites
- **Page site** : Détails avec comparaisons J-1, J-7, J-30
- **Alertes** : Notifications de changements importants

## Structure du projet

```
monitoring-sites/
├── backend/
│   ├── src/
│   │   ├── database/          # Base de données SQLite
│   │   │   ├── init.js
│   │   │   └── schema.sql
│   │   ├── scrapers/          # Modules de scraping
│   │   │   ├── google-positions.js
│   │   │   ├── google-gmb.js
│   │   │   └── backlinks.js
│   │   ├── services/          # Logique métier
│   │   │   ├── sites.service.js
│   │   │   ├── monitoring.service.js
│   │   │   ├── alerts.service.js
│   │   │   └── history.service.js
│   │   ├── routes/            # Routes API
│   │   │   ├── sites.routes.js
│   │   │   ├── monitoring.routes.js
│   │   │   ├── alerts.routes.js
│   │   │   └── history.routes.js
│   │   ├── utils/             # Utilitaires
│   │   │   ├── logger.js
│   │   │   └── helpers.js
│   │   ├── index.js           # Point d'entrée
│   │   └── scheduler.js       # Tâches planifiées
│   ├── data/                  # Base de données (généré)
│   ├── logs/                  # Logs (généré)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Composants React
│   │   │   └── Layout.jsx
│   │   ├── pages/             # Pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Sites.jsx
│   │   │   ├── SiteDetail.jsx
│   │   │   └── Alerts.jsx
│   │   ├── services/          # Services API
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── package.json               # Root package
```

## API Endpoints

### Sites
- `GET /api/sites` - Liste des sites
- `POST /api/sites` - Créer un site
- `GET /api/sites/:id` - Détails d'un site
- `PUT /api/sites/:id` - Modifier un site
- `DELETE /api/sites/:id` - Supprimer un site
- `GET /api/sites/:id/keywords` - Mots-clés d'un site
- `POST /api/sites/:id/keywords` - Ajouter un mot-clé
- `DELETE /api/sites/:siteId/keywords/:keywordId` - Supprimer un mot-clé

### Monitoring
- `POST /api/monitoring/run` - Lancer monitoring complet
- `POST /api/monitoring/positions/:siteId` - Monitoring positions
- `POST /api/monitoring/gmb/:siteId` - Monitoring GMB
- `POST /api/monitoring/backlinks/:siteId` - Monitoring backlinks

### Historique
- `GET /api/history/dashboard/:siteId` - Dashboard complet d'un site
- `GET /api/history/positions/:siteId` - Historique positions
- `GET /api/history/positions/:siteId/compare` - Comparaisons
- `GET /api/history/backlinks/:siteId` - Historique backlinks
- `GET /api/history/executions` - Exécutions récentes

### Alertes
- `GET /api/alerts` - Liste des alertes
- `GET /api/alerts/unread/count` - Nombre d'alertes non lues
- `PATCH /api/alerts/:id/read` - Marquer comme lue
- `PATCH /api/alerts/read/all` - Tout marquer comme lu
- `DELETE /api/alerts/:id` - Supprimer une alerte

## Déploiement sur VPS

### 1. Préparer le VPS

```bash
# Se connecter au VPS
ssh user@votre-vps.com

# Installer Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Installer PM2 (gestionnaire de processus)
npm install -g pm2
```

### 2. Déployer l'application

```bash
# Cloner le projet (ou utiliser SCP/SFTP)
git clone <votre-repo> monitoring-sites
cd monitoring-sites

# Installer les dépendances
npm install
cd backend && npm install && npx playwright install chromium
cd ../frontend && npm install && npm run build
cd ..

# Configuration
cd backend
cp .env.example .env
nano .env  # Éditer la configuration

# Initialiser la base de données
npm run init-db
```

### 3. Démarrer avec PM2

```bash
cd backend

# Démarrer le serveur
pm2 start src/index.js --name monitoring-api

# Démarrer le scheduler (optionnel, si séparé)
pm2 start src/scheduler.js --name monitoring-scheduler

# Sauvegarder la configuration PM2
pm2 save
pm2 startup
```

### 4. Configuration Nginx (optionnel)

```nginx
server {
    listen 80;
    server_name monitoring.votredomaine.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Maintenance

### Vérifier les logs

```bash
# Backend
tail -f backend/logs/combined.log

# PM2
pm2 logs monitoring-api
```

### Redémarrer l'application

```bash
pm2 restart monitoring-api
```

### Backup de la base de données

```bash
cp backend/data/monitoring.db backend/data/monitoring-backup-$(date +%Y%m%d).db
```

## Limites et recommandations

- **Sites** : Maximum 10 sites recommandé
- **Mots-clés** : Maximum 10 par site recommandé
- **Fréquence** : 1 exécution par jour maximum
- **Délais** : Respecter les délais entre requêtes (30-60s)
- **Mode headless** : Désactiver si vous rencontrez des blocages (`SCRAPING_HEADLESS=false`)

## Dépannage

### Le scraping échoue

1. Vérifier que Playwright est bien installé : `npx playwright install chromium`
2. Augmenter les délais dans `.env`
3. Essayer avec `SCRAPING_HEADLESS=false`
4. Vérifier les logs : `tail -f backend/logs/error.log`

### La base de données est corrompue

```bash
cd backend
rm data/monitoring.db
npm run init-db
```

### Le frontend ne se connecte pas au backend

1. Vérifier que le backend est démarré sur le port 3001
2. Vérifier la configuration du proxy dans `frontend/vite.config.js`
3. En production, rebuild le frontend : `cd frontend && npm run build`

## Contribuer

Ce projet est à usage interne uniquement. Toute amélioration est la bienvenue !

## Licence

Usage interne privé uniquement. Non destiné à la distribution publique.
