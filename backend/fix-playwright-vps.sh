#!/bin/bash
# Script pour installer Playwright sur le VPS

echo "🔧 Installation de Playwright pour VPS..."

cd /var/www/rico/backend

# 1. Installer Chromium
echo "📥 Installation de Chromium..."
npx playwright install chromium

# 2. Installer les dépendances système (nécessite root)
echo "📦 Installation des dépendances système..."
npx playwright install-deps chromium

# 3. Vérifier l'installation
echo "✅ Vérification de l'installation..."
node -e "const { chromium } = require('playwright'); chromium.launch({headless: true}).then(b => { console.log('✅ Chromium fonctionne!'); b.close(); }).catch(e => console.error('❌ Erreur:', e.message));"

echo "✅ Installation terminée!"
