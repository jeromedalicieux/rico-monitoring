/**
 * Script pour ajouter automatiquement des mots-clés
 * aux sites qui n'en ont pas (basé sur le domaine)
 *
 * Usage: node scripts/add-missing-keywords.js
 */

import { getDatabase } from '../src/database/init.js';
import logger from '../src/utils/logger.js';

const db = getDatabase();

logger.info('🔍 Recherche des sites sans mots-clés...');

// Récupérer tous les sites actifs
const sites = db.prepare('SELECT * FROM sites WHERE active = 1').all();

let added = 0;
let skipped = 0;

for (const site of sites) {
  // Vérifier si le site a déjà des mots-clés
  const keywordCount = db.prepare(
    'SELECT COUNT(*) as count FROM keywords WHERE site_id = ?'
  ).get(site.id).count;

  if (keywordCount > 0) {
    logger.info(`✓ ${site.domain} a déjà ${keywordCount} mot(s)-clé(s)`);
    skipped++;
    continue;
  }

  // Créer un mot-clé basé sur le domaine
  const domainWithoutExtension = site.domain.split('.')[0];
  const keyword = domainWithoutExtension.replace(/-/g, ' ');

  try {
    db.prepare(`
      INSERT INTO keywords (site_id, keyword)
      VALUES (?, ?)
    `).run(site.id, keyword);

    logger.info(`✅ ${site.domain} → mot-clé créé: "${keyword}"`);
    added++;
  } catch (error) {
    logger.error(`❌ Erreur pour ${site.domain}: ${error.message}`);
  }
}

logger.info(`\n📊 Résumé:`);
logger.info(`  - ${added} mot(s)-clé(s) ajouté(s)`);
logger.info(`  - ${skipped} site(s) ignoré(s) (ont déjà des mots-clés)`);
logger.info(`  - Total: ${sites.length} site(s) traité(s)`);
