import { getDatabase } from '../database/init.js';
import logger from '../utils/logger.js';

/**
 * Service de gestion des sites
 */

export function getAllSites() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM sites WHERE active = 1').all();
}

export function getSiteById(id) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM sites WHERE id = ?').get(id);
}

export function createSite(data) {
  const db = getDatabase();
  const { domain, name, gmb_business_name, gmb_city } = data;

  const stmt = db.prepare(`
    INSERT INTO sites (domain, name, gmb_business_name, gmb_city)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(domain, name, gmb_business_name || null, gmb_city || null);
  logger.info(`✅ Site créé: ${name} (${domain})`);

  return getSiteById(result.lastInsertRowid);
}

export function createBulkSites(urls) {
  const db = getDatabase();
  const results = {
    created: [],
    skipped: [],
    errors: [],
  };

  // Fonction pour extraire le domaine d'une URL
  const extractDomain = (url) => {
    try {
      // Ajouter http:// si pas de protocole
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.replace('www.', '').split('/')[0];
    }
  };

  // Récupérer les domaines déjà existants
  const existingDomains = db.prepare('SELECT domain FROM sites').all().map(s => s.domain);

  // Traiter chaque URL
  for (const url of urls) {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) continue;

    try {
      const domain = extractDomain(trimmedUrl);

      // Vérifier si le domaine existe déjà
      if (existingDomains.includes(domain)) {
        results.skipped.push({
          url: trimmedUrl,
          domain,
          reason: 'Domaine déjà existant',
        });
        continue;
      }

      // Créer le site
      const name = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
      const site = createSite({
        domain,
        name,
        gmb_business_name: null,
        gmb_city: null,
      });

      results.created.push({
        url: trimmedUrl,
        domain,
        site,
      });

      // Ajouter aux domaines existants pour éviter les doublons dans le même batch
      existingDomains.push(domain);

    } catch (error) {
      results.errors.push({
        url: trimmedUrl,
        error: error.message,
      });
    }
  }

  logger.info(`📦 Import en masse: ${results.created.length} créés, ${results.skipped.length} ignorés, ${results.errors.length} erreurs`);

  return {
    summary: {
      total: urls.length,
      created: results.created.length,
      skipped: results.skipped.length,
      errors: results.errors.length,
    },
    details: results,
  };
}

export function updateSite(id, data) {
  const db = getDatabase();
  const { domain, name, gmb_business_name, gmb_city, active } = data;

  const stmt = db.prepare(`
    UPDATE sites
    SET domain = ?, name = ?, gmb_business_name = ?, gmb_city = ?, active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(domain, name, gmb_business_name || null, gmb_city || null, active !== undefined ? active : 1, id);
  logger.info(`✅ Site mis à jour: ${id}`);

  return getSiteById(id);
}

export function deleteSite(id) {
  const db = getDatabase();
  db.prepare('DELETE FROM sites WHERE id = ?').run(id);
  logger.info(`🗑️ Site supprimé: ${id}`);
}

/**
 * Service de gestion des mots-clés
 */

export function getKeywordsBySite(siteId) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM keywords WHERE site_id = ? AND active = 1').all(siteId);
}

export function createKeyword(siteId, keyword) {
  const db = getDatabase();

  const stmt = db.prepare(`
    INSERT INTO keywords (site_id, keyword)
    VALUES (?, ?)
  `);

  const result = stmt.run(siteId, keyword);
  logger.info(`✅ Mot-clé créé: "${keyword}" pour le site ${siteId}`);

  return db.prepare('SELECT * FROM keywords WHERE id = ?').get(result.lastInsertRowid);
}

export function updateKeyword(id, keyword, active) {
  const db = getDatabase();

  const stmt = db.prepare(`
    UPDATE keywords
    SET keyword = ?, active = ?
    WHERE id = ?
  `);

  stmt.run(keyword, active !== undefined ? active : 1, id);
  logger.info(`✅ Mot-clé mis à jour: ${id}`);

  return db.prepare('SELECT * FROM keywords WHERE id = ?').get(id);
}

export function deleteKeyword(id) {
  const db = getDatabase();
  db.prepare('DELETE FROM keywords WHERE id = ?').run(id);
  logger.info(`🗑️ Mot-clé supprimé: ${id}`);
}

export function getKeywordById(id) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM keywords WHERE id = ?').get(id);
}
