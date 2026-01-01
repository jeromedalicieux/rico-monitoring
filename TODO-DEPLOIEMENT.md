# TODO - Déploiement VPS

## État actuel

✅ **Terminé:**
- Code développé et poussé sur GitHub
- Projet cloné sur VPS dans `/var/www/rico`
- Dépendances installées (`npm install` backend + frontend)
- Base de données initialisée (`npm run init-db`)
- Frontend buildé (`npm run build`)
- DNS configuré: `rico.daidyl.com` → `72.62.16.221`
- Certificat SSL obtenu avec Let's Encrypt

⏸️ **En cours:**
- Configuration Nginx à finaliser
- Installation du certificat SSL

## Étapes restantes

### 1. Finaliser la configuration Nginx

```bash
# Sur le VPS, en tant que root

# A. Copier le fichier de configuration
sudo cp /var/www/rico/nginx.conf /etc/nginx/sites-available/monitoring-sites

# B. Éditer et mettre le bon domaine
sudo nano /etc/nginx/sites-available/monitoring-sites
```

**Ligne à modifier:**
```nginx
server_name rico.daidyl.com;  # Changer "monitoring.votredomaine.com" par "rico.daidyl.com"
```

**Chemin du projet à vérifier (ligne ~11):**
```nginx
root /var/www/rico/frontend/dist;  # Vérifier que c'est bien "/var/www/rico" et pas "/var/www/monitoring-sites"
```

```bash
# C. Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/monitoring-sites /etc/nginx/sites-enabled/

# D. Tester la configuration
sudo nginx -t

# E. Recharger Nginx
sudo systemctl reload nginx
```

### 2. Installer le certificat SSL

Le certificat a déjà été obtenu et est stocké dans:
- Certificate: `/etc/letsencrypt/live/rico.daidyl.com/fullchain.pem`
- Key: `/etc/letsencrypt/live/rico.daidyl.com/privkey.pem`

```bash
# Installer le certificat dans Nginx
sudo certbot install --cert-name rico.daidyl.com

# OU relancer la commande complète (va détecter le server_name cette fois)
sudo certbot --nginx -d rico.daidyl.com
```

Certbot va automatiquement:
- Modifier `/etc/nginx/sites-available/monitoring-sites`
- Ajouter les lignes SSL
- Configurer la redirection HTTP → HTTPS

### 3. Démarrer les applications avec PM2

```bash
cd /var/www/rico

# Démarrer les apps
pm2 start ecosystem.config.js

# Vérifier le statut
pm2 status
# Devrait afficher:
# - monitoring-sites-api (online)
# - monitoring-sites-scheduler (online)

# Voir les logs en temps réel
pm2 logs monitoring-sites-api

# Sauvegarder la configuration PM2 pour redémarrage auto
pm2 save
pm2 startup
# Copier/coller la commande affichée pour l'exécuter
```

### 4. Tests finaux

```bash
# A. Test local (sur le VPS)
curl http://localhost:3001/health
# Devrait retourner: {"status":"ok","timestamp":"..."}

# B. Test via HTTP (depuis n'importe où)
curl http://rico.daidyl.com/health

# C. Test via HTTPS (après installation SSL)
curl https://rico.daidyl.com/health

# D. Ouvrir dans le navigateur
# https://rico.daidyl.com
```

### 5. Ajouter le premier site à monitorer

Dans le navigateur, aller sur `https://rico.daidyl.com`:

1. Cliquer sur "Sites"
2. Cliquer sur "Ajouter un site"
3. Remplir:
   - Nom: Nom du site
   - Domaine: example.com
   - Mots-clés: keyword1, keyword2, keyword3
4. Enregistrer

Le système va automatiquement:
- Détecter le Google Business Profile (si existe)
- Monitorer les positions Google
- Tracker les backlinks
- Exécuter quotidiennement à 9h (configurable dans `.env`)

### 6. Configuration optionnelle

#### A. Changer l'heure d'exécution du cron

```bash
sudo nano /var/www/rico/backend/.env
```

Modifier:
```env
CRON_SCHEDULE=0 9 * * *  # Format: minute heure jour mois jour-semaine
# Exemple: 0 6 * * * = tous les jours à 6h
# Exemple: 0 22 * * * = tous les jours à 22h
```

Puis redémarrer le scheduler:
```bash
pm2 restart monitoring-sites-scheduler
```

#### B. Ajuster les seuils d'alerte

Dans `/var/www/rico/backend/.env`:
```env
ALERT_POSITION_DROP_THRESHOLD=5  # Alerte si position chute de 5 places ou plus
```

#### C. Configurer les backups automatiques

```bash
# Créer un script de backup
sudo nano /var/www/rico/backup.sh
```

Contenu:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/rico-monitoring"
mkdir -p $BACKUP_DIR
cp /var/www/rico/backend/data/monitoring.db $BACKUP_DIR/monitoring_$DATE.db
# Garder seulement les 30 derniers backups
ls -t $BACKUP_DIR/monitoring_*.db | tail -n +31 | xargs rm -f
```

```bash
# Rendre exécutable
chmod +x /var/www/rico/backup.sh

# Ajouter au crontab (backup tous les jours à 3h)
sudo crontab -e
```

Ajouter:
```
0 3 * * * /var/www/rico/backup.sh
```

## Vérifications après déploiement

### Processus qui doivent tourner

```bash
pm2 list
```

Devrait afficher:
```
┌────┬──────────────────────────────┬─────────┬─────────┐
│ id │ name                         │ status  │ restart │
├────┼──────────────────────────────┼─────────┼─────────┤
│ 0  │ vvesp                        │ online  │ 0       │  ← Votre projet existant
│ 1  │ monitoring-sites-api         │ online  │ 0       │  ← Nouveau
│ 2  │ monitoring-sites-scheduler   │ online  │ 0       │  ← Nouveau
└────┴──────────────────────────────┴─────────┴─────────┘
```

### Ports en écoute

```bash
sudo lsof -i -P -n | grep LISTEN | grep node
```

Devrait afficher:
```
node    1234 user   23u  IPv4  TCP *:3000 (LISTEN)  ← vvesp
node    5678 user   23u  IPv4  TCP *:3001 (LISTEN)  ← monitoring-sites
```

### Sites Nginx actifs

```bash
ls -la /etc/nginx/sites-enabled/
```

Devrait afficher:
```
vvesp -> /etc/nginx/sites-available/vvesp
monitoring-sites -> /etc/nginx/sites-available/monitoring-sites
```

### Certificats SSL

```bash
sudo certbot certificates
```

Devrait afficher:
```
Found the following certs:
  Certificate Name: vvesp.com
    Domains: vvesp.com www.vvesp.com
    Expiry Date: ...

  Certificate Name: rico.daidyl.com
    Domains: rico.daidyl.com
    Expiry Date: 2026-03-31
```

## Commandes utiles pour la maintenance

```bash
# Voir les logs en temps réel
pm2 logs monitoring-sites-api

# Redémarrer une app
pm2 restart monitoring-sites-api

# Voir le monitoring des ressources
pm2 monit

# Vérifier l'état de Nginx
sudo systemctl status nginx

# Voir les logs Nginx
sudo tail -f /var/log/nginx/monitoring-sites-error.log
sudo tail -f /var/log/nginx/monitoring-sites-access.log

# Voir les sites ajoutés
sqlite3 /var/www/rico/backend/data/monitoring.db "SELECT * FROM sites;"

# Voir les dernières positions trackées
sqlite3 /var/www/rico/backend/data/monitoring.db "SELECT * FROM position_history ORDER BY checked_at DESC LIMIT 10;"
```

## Mise à jour du projet

Quand vous faites des modifications:

```bash
cd /var/www/rico

# Récupérer les dernières modifications depuis GitHub
git pull origin main

# Si modifications backend
cd backend
npm install  # Si nouvelles dépendances
pm2 restart monitoring-sites-api
pm2 restart monitoring-sites-scheduler

# Si modifications frontend
cd ../frontend
npm install  # Si nouvelles dépendances
npm run build
# Pas besoin de redémarrer, Nginx sert les fichiers statiques

# Vérifier que tout tourne
pm2 status
```

## Troubleshooting

### Si l'API ne répond pas

```bash
# Vérifier les logs
pm2 logs monitoring-sites-api --lines 100

# Vérifier que le processus tourne
pm2 status

# Redémarrer
pm2 restart monitoring-sites-api
```

### Si Nginx retourne 502 Bad Gateway

```bash
# Vérifier que l'API tourne sur le port 3001
curl http://localhost:3001/health

# Vérifier les logs Nginx
sudo tail -f /var/log/nginx/monitoring-sites-error.log

# Tester la config Nginx
sudo nginx -t
```

### Si le scraping ne fonctionne pas

```bash
# Vérifier que Playwright est installé
cd /var/www/rico/backend
npx playwright install chromium

# Installer les dépendances système si nécessaire
sudo apt-get update
sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1 libasound2

# Vérifier les logs du scheduler
pm2 logs monitoring-sites-scheduler
```

---

**Dernière mise à jour:** 2026-01-01
**Statut:** Déploiement en cours - Étape: Installation certificat SSL
