#!/bin/bash

# Script de déploiement automatisé pour Monitoring Sites
# Usage: ./deploy.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Début du déploiement..."

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Pull des dernières modifications
echo -e "${BLUE}📥 Pull des dernières modifications...${NC}"
git pull origin main

# 2. Backend - Installation des dépendances
echo -e "${BLUE}📦 Backend - Vérification des dépendances...${NC}"
cd backend
if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
    echo -e "${YELLOW}Installation des dépendances backend...${NC}"
    npm install
else
    echo -e "${GREEN}✓ Dépendances backend à jour${NC}"
fi
cd ..

# 3. Frontend - Installation des dépendances et build
echo -e "${BLUE}📦 Frontend - Vérification des dépendances...${NC}"
cd frontend
if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
    echo -e "${YELLOW}Installation des dépendances frontend...${NC}"
    npm install
else
    echo -e "${GREEN}✓ Dépendances frontend à jour${NC}"
fi

echo -e "${BLUE}🏗️  Build du frontend...${NC}"
npm run build
cd ..

# 4. Redémarrage des processus PM2
echo -e "${BLUE}🔄 Redémarrage des processus PM2...${NC}"
pm2 restart monitoring-sites-api
pm2 restart monitoring-sites-scheduler

# 5. Vérification du statut
echo -e "\n${BLUE}📊 Statut des processus:${NC}"
pm2 list

echo -e "\n${GREEN}✅ Déploiement terminé avec succès!${NC}"
echo -e "${GREEN}🌐 Site accessible sur: http://rico.vvesp.com${NC}"
echo -e "${BLUE}📝 Logs disponibles avec: pm2 logs${NC}"
