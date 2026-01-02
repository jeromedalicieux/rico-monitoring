# Installation et Configuration VPS

## 1. Installer Playwright sur le VPS

Le scraping utilise Playwright qui nécessite des navigateurs Chromium:

```bash
ssh root@72.62.16.221
cd /var/www/rico/backend

# Installer les navigateurs Playwright
npx playwright install chromium

# Installer les dépendances système nécessaires
npx playwright install-deps chromium
```

## 2. Augmenter les timeouts Nginx

Le monitoring peut prendre plusieurs minutes (délais anti-détection de 30-60s entre chaque requête).

Éditer `/etc/nginx/sites-available/monitoring-sites`:

```nginx
location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    # Timeouts pour les opérations longues (monitoring)
    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
    proxy_read_timeout 600s;  # IMPORTANT: 10 minutes pour le monitoring complet
}
```

Recharger Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 3. Déployer le code

```bash
cd /var/www/rico
./deploy.sh
```

## 4. Ajouter les mots-clés aux sites existants

```bash
cd /var/www/rico/backend
node scripts/add-missing-keywords.js
```

## 5. Tester le monitoring

### Option 1: Depuis le VPS (monitoring complet)
```bash
curl -X POST http://localhost:3001/api/monitoring/run
```

### Option 2: Monitoring d'un seul site (plus rapide pour tester)
```bash
# Trouver l'ID d'un site
sqlite3 data/monitoring.db "SELECT id, domain FROM sites LIMIT 1"

# Lancer le monitoring pour ce site
curl -X POST http://localhost:3001/api/monitoring/positions/1
```

### Option 3: Depuis l'interface web
Aller sur `http://rico.vvesp.com` et cliquer sur le bouton "Lancer le monitoring"

**Note:** Le monitoring complet peut prendre plusieurs minutes (30-60s de délai entre chaque requête pour éviter les bans Google).

## Vérification des logs

Si des erreurs persistent:

```bash
# Logs de l'API
pm2 logs monitoring-sites-api --lines 100

# Logs du scheduler
pm2 logs monitoring-sites-scheduler --lines 50

# Logs Nginx
tail -f /var/log/nginx/rico-monitoring-error.log
```

## Troubleshooting

### Erreur "Executable doesn't exist"
→ Playwright pas installé: `npx playwright install chromium`

### Erreur "timeout"
→ Augmenter les timeouts Nginx (voir section 2)

### Erreur 500 sans détails
→ Vérifier les logs PM2: `pm2 logs monitoring-sites-api`

### Sites sans mots-clés
→ Exécuter le script: `node scripts/add-missing-keywords.js`
