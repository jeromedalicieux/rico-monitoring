# Guide de déploiement sur VPS

Ce guide explique comment déployer l'application de monitoring SEO sur un VPS avec Nginx et PM2.

## Prérequis sur le VPS

- Node.js 18+ installé
- PM2 installé globalement (`npm install -g pm2`)
- Nginx installé et configuré
- Git installé

## 1. Préparation du VPS

### Créer le répertoire de l'application

```bash
sudo mkdir -p /var/www/monitoring-sites
sudo chown -R $USER:$USER /var/www/monitoring-sites
```

### Cloner le projet

```bash
cd /var/www
git clone git@github.com:jeromedalicieux/rico-monitoring.git monitoring-sites
cd monitoring-sites
```

## 2. Installation des dépendances

### Backend

```bash
cd backend
npm install
npx playwright install chromium
```

### Frontend

```bash
cd ../frontend
npm install
npm run build
```

## 3. Configuration

### Créer le fichier .env

```bash
cd ../backend
cp .env.example .env
nano .env
```

Modifier les valeurs selon vos besoins :

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

### Initialiser la base de données

```bash
npm run init-db
```

## 4. Configuration Nginx

### Copier le fichier de configuration

```bash
sudo cp /var/www/monitoring-sites/nginx.conf.example /etc/nginx/sites-available/monitoring-sites
```

### Éditer la configuration

```bash
sudo nano /etc/nginx/sites-available/monitoring-sites
```

Modifier `server_name` avec votre domaine.

### Activer le site

```bash
sudo ln -s /etc/nginx/sites-available/monitoring-sites /etc/nginx/sites-enabled/
```

### Tester et recharger Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 5. Démarrage avec PM2

### Depuis le dossier racine du projet

```bash
cd /var/www/monitoring-sites
pm2 start ecosystem.config.js
```

Cela démarre :
- `monitoring-sites-api` : Le serveur API
- `monitoring-sites-scheduler` : Le scheduler pour les tâches planifiées

### Sauvegarder la configuration PM2

```bash
pm2 save
pm2 startup
```

Suivre les instructions affichées pour activer le démarrage automatique.

## 6. Configuration SSL (optionnel mais recommandé)

### Installer Certbot

```bash
sudo apt install certbot python3-certbot-nginx
```

### Obtenir un certificat SSL

```bash
sudo certbot --nginx -d monitoring.votredomaine.com
```

Certbot va automatiquement configurer Nginx pour HTTPS.

### Renouvellement automatique

Le certificat se renouvelle automatiquement via un cron. Vérifier avec :

```bash
sudo certbot renew --dry-run
```

## 7. Commandes utiles

### PM2

```bash
# Voir les logs
pm2 logs monitoring-sites-api
pm2 logs monitoring-sites-scheduler

# Redémarrer
pm2 restart monitoring-sites-api
pm2 restart all

# Arrêter
pm2 stop monitoring-sites-api
pm2 stop all

# Supprimer
pm2 delete monitoring-sites-api
pm2 delete all

# Monitoring
pm2 monit
```

### Nginx

```bash
# Tester la configuration
sudo nginx -t

# Recharger
sudo systemctl reload nginx

# Redémarrer
sudo systemctl restart nginx

# Voir les logs
sudo tail -f /var/log/nginx/monitoring-sites-access.log
sudo tail -f /var/log/nginx/monitoring-sites-error.log
```

### Application

```bash
# Voir les logs de l'application
tail -f /var/www/monitoring-sites/backend/logs/combined.log
tail -f /var/www/monitoring-sites/backend/logs/error.log
```

## 8. Mise à jour de l'application

```bash
cd /var/www/monitoring-sites

# Arrêter l'application
pm2 stop all

# Récupérer les dernières modifications
git pull origin main

# Mettre à jour les dépendances backend
cd backend
npm install

# Mettre à jour et rebuild le frontend
cd ../frontend
npm install
npm run build

# Redémarrer
cd ..
pm2 restart all
```

## 9. Backup de la base de données

### Créer un script de backup

```bash
nano /var/www/monitoring-sites/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/www/monitoring-sites/backups"
DB_PATH="/var/www/monitoring-sites/backend/data/monitoring.db"

mkdir -p $BACKUP_DIR
cp $DB_PATH "$BACKUP_DIR/monitoring-$DATE.db"

# Garder seulement les 30 derniers backups
find $BACKUP_DIR -name "monitoring-*.db" -mtime +30 -delete

echo "Backup créé: monitoring-$DATE.db"
```

### Rendre le script exécutable

```bash
chmod +x /var/www/monitoring-sites/backup.sh
```

### Ajouter au crontab (backup quotidien à 2h du matin)

```bash
crontab -e
```

Ajouter :

```
0 2 * * * /var/www/monitoring-sites/backup.sh >> /var/www/monitoring-sites/backups/backup.log 2>&1
```

## 10. Monitoring et alertes

### Logs PM2

PM2 enregistre automatiquement les logs dans `backend/logs/`.

### Surveiller l'utilisation des ressources

```bash
pm2 monit
```

### Alertes PM2

Vous pouvez configurer PM2 pour envoyer des alertes en cas de crash :

```bash
pm2 install pm2-logrotate
```

## 11. Sécurité

### Firewall

Assurez-vous que seuls les ports nécessaires sont ouverts :

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### Limiter l'accès à l'API (optionnel)

Dans la configuration Nginx, vous pouvez ajouter une authentification basique :

```nginx
location /api {
    auth_basic "Restricted Access";
    auth_basic_user_file /etc/nginx/.htpasswd;

    proxy_pass http://localhost:3001;
    # ... reste de la config
}
```

Créer le fichier de mots de passe :

```bash
sudo apt install apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd admin
```

## Troubleshooting

### L'application ne démarre pas

1. Vérifier les logs PM2 : `pm2 logs`
2. Vérifier que Node.js est en version 18+ : `node --version`
3. Vérifier que toutes les dépendances sont installées
4. Vérifier le fichier `.env`

### Le scraping ne fonctionne pas

1. Vérifier que Playwright est installé : `npx playwright install chromium`
2. Installer les dépendances système nécessaires :
   ```bash
   sudo apt-get install -y \
     libnss3 \
     libatk-bridge2.0-0 \
     libdrm2 \
     libxkbcommon0 \
     libgbm1 \
     libasound2
   ```

### Nginx retourne une erreur 502

1. Vérifier que l'API est démarrée : `pm2 status`
2. Vérifier que le port 3001 est correct dans la config Nginx
3. Vérifier les logs Nginx : `sudo tail -f /var/log/nginx/error.log`

## Support

Pour toute question ou problème, consultez les logs de l'application et vérifiez la configuration.
