# Installation rapide sur votre VPS

## Vue d'ensemble

Votre serveur a déjà:
- ✅ Nginx configuré
- ✅ Un projet sur vvesp.com (port 3000)
- ✅ SSL avec Let's Encrypt

Notre projet utilisera:
- 🆕 Port 3001 (pas de conflit avec le port 3000)
- 🆕 Un sous-domaine dédié (ex: monitoring.votredomaine.com)
- 🆕 Son propre fichier de configuration Nginx

## Étape 1: Cloner et installer

```bash
# Aller dans /var/www
cd /var/www

# Cloner le projet (si pas déjà fait)
git clone git@github.com:jeromedalicieux/rico-monitoring.git monitoring-sites
cd monitoring-sites

# Installer les dépendances backend
cd backend
npm install
npx playwright install chromium

# Installer les dépendances système pour Playwright
sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1 libasound2

# Initialiser la base de données
npm run init-db

# Installer et builder le frontend
cd ../frontend
npm install
npm run build
```

## Étape 2: Configurer le backend

```bash
cd /var/www/monitoring-sites/backend
cp .env.example .env
nano .env
```

Modifiez ces valeurs:

```env
PORT=3001
NODE_ENV=production
DB_PATH=./data/monitoring.db

# Scraping (recommandé pour production)
SCRAPING_MIN_DELAY=30000
SCRAPING_MAX_DELAY=60000
SCRAPING_HEADLESS=true
SCRAPING_MAX_RETRIES=3

# Alertes
ALERT_POSITION_DROP_THRESHOLD=5

# Cron (tous les jours à 9h)
CRON_SCHEDULE=0 9 * * *

LOG_LEVEL=info
```

## Étape 3: Configurer Nginx

```bash
# Copier le fichier de configuration
sudo cp /var/www/monitoring-sites/nginx.conf /etc/nginx/sites-available/monitoring-sites

# Éditer pour mettre votre domaine
sudo nano /etc/nginx/sites-available/monitoring-sites
# Remplacez "monitoring.votredomaine.com" par votre vrai domaine

# Activer le site
sudo ln -s /etc/nginx/sites-available/monitoring-sites /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Si OK, recharger Nginx
sudo systemctl reload nginx
```

## Étape 4: Configurer le DNS

Ajoutez un enregistrement DNS pour votre sous-domaine:

```
Type: A
Nom: monitoring
Valeur: [IP de votre VPS]
TTL: 3600
```

## Étape 5: Démarrer avec PM2

```bash
cd /var/www/monitoring-sites

# Démarrer les applications
pm2 start ecosystem.config.js

# Vérifier que tout tourne
pm2 list
# Vous devriez voir:
# - vvesp (port 3000) - votre projet existant
# - monitoring-sites-api (port 3001) - nouveau
# - monitoring-sites-scheduler - nouveau

# Sauvegarder la configuration PM2
pm2 save
```

## Étape 6: Configurer SSL (optionnel mais recommandé)

Une fois que le DNS est propagé:

```bash
# Obtenir un certificat SSL avec Let's Encrypt
sudo certbot --nginx -d monitoring.votredomaine.com

# Certbot va:
# 1. Obtenir le certificat
# 2. Modifier automatiquement la config Nginx pour HTTPS
# 3. Configurer la redirection HTTP → HTTPS
```

## Vérifications

### Vérifier que tout fonctionne

```bash
# 1. Vérifier les processus PM2
pm2 status

# 2. Vérifier les logs
pm2 logs monitoring-sites-api --lines 50

# 3. Tester l'API localement
curl http://localhost:3001/health
# Devrait retourner: {"status":"ok","timestamp":"..."}

# 4. Tester via Nginx (remplacez par votre domaine)
curl http://monitoring.votredomaine.com/health
```

### Vérifier les ports utilisés

```bash
# Voir tous les ports en écoute
sudo lsof -i -P -n | grep LISTEN | grep node
# Vous devriez voir:
# - node sur port 3000 (vvesp)
# - node sur port 3001 (monitoring-sites)
```

## Résumé de votre configuration finale

| Projet | Domaine | Port | Fichier Nginx |
|--------|---------|------|---------------|
| VVESP | vvesp.com | 3000 | /etc/nginx/sites-available/vvesp |
| Monitoring Sites | monitoring.votredomaine.com | 3001 | /etc/nginx/sites-available/monitoring-sites |

## Commandes utiles

```bash
# Voir les logs en temps réel
pm2 logs monitoring-sites-api

# Redémarrer une application
pm2 restart monitoring-sites-api

# Redémarrer toutes les applications
pm2 restart all

# Voir le monitoring des ressources
pm2 monit
```

## Mise à jour du projet

Pour mettre à jour le projet après des modifications:

```bash
cd /var/www/monitoring-sites
./deploy.sh
```

## Troubleshooting

### L'API ne démarre pas

```bash
# Vérifier les logs
pm2 logs monitoring-sites-api --lines 100

# Vérifier que le port 3001 n'est pas déjà utilisé
sudo lsof -i :3001
```

### Nginx retourne 502 Bad Gateway

```bash
# Vérifier que l'API tourne
pm2 status

# Tester l'API directement
curl http://localhost:3001/health

# Vérifier les logs Nginx
sudo tail -f /var/log/nginx/monitoring-sites-error.log
```

### Le scraping ne fonctionne pas

```bash
# Vérifier que Playwright est installé
cd /var/www/monitoring-sites/backend
npx playwright install chromium

# Réinstaller les dépendances système si nécessaire
sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1 libasound2
```
