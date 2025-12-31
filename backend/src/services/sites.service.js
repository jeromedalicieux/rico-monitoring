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
