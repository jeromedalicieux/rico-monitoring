#!/bin/bash

# Script de déploiement rapide pour VPS
# Usage: ./deploy.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Début du déploiement..."

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
APP_DIR="/var/www/monitoring-sites"
BRANCH="main"

echo -e "${BLUE}📦 Pull des dernières modifications...${NC}"
git pull origin $BRANCH

echo -e "${BLUE}🔧 Mise à jour des dépendances backend...${NC}"
cd backend
npm install

echo -e "${BLUE}🎨 Build du frontend...${NC}"
cd ../frontend
npm install
npm run build

echo -e "${BLUE}🔄 Redémarrage de l'application...${NC}"
cd ..
pm2 restart ecosystem.config.js

echo -e "${GREEN}✅ Déploiement terminé avec succès !${NC}"

echo -e "${BLUE}📊 Status PM2:${NC}"
pm2 status

echo -e "\n${GREEN}L'application a été mise à jour et redémarrée.${NC}"
echo -e "${BLUE}Vérifiez les logs avec: pm2 logs${NC}"
