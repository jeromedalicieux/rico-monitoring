import { getDatabase } from '../database/init.js';
import logger from '../utils/logger.js';

/**
 * Service de gestion des alertes
 */

export function getAllAlerts(filters = {}) {
  const db = getDatabase();
  let query = 'SELECT a.*, s.name as site_name FROM alerts a LEFT JOIN sites s ON a.site_id = s.id WHERE 1=1';
  const params = [];

  if (filters.read !== undefined) {
    query += ' AND a.read = ?';
    params.push(filters.read);
  }

  if (filters.site_id) {
    query += ' AND a.site_id = ?';
    params.push(filters.site_id);
  }

  if (filters.severity) {
    query += ' AND a.severity = ?';
    params.push(filters.severity);
  }

  query += ' ORDER BY a.created_at DESC';

  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  return db.prepare(query).all(...params);
}

export function getAlertById(id) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
}

export function createAlert(data) {
  const db = getDatabase();
  const { site_id, alert_type, severity, title, message, metadata } = data;

  const stmt = db.prepare(`
    INSERT INTO alerts (site_id, alert_type, severity, title, message, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(site_id, alert_type, severity, title, message, metadata || null);
  logger.info(`🚨 Alerte créée: ${title}`);

  return getAlertById(result.lastInsertRowid);
}

export function markAlertAsRead(id) {
  const db = getDatabase();
  db.prepare('UPDATE alerts SET read = 1 WHERE id = ?').run(id);
  logger.info(`✅ Alerte marquée comme lue: ${id}`);
}

export function markAllAlertsAsRead(siteId = null) {
  const db = getDatabase();

  if (siteId) {
    db.prepare('UPDATE alerts SET read = 1 WHERE site_id = ? AND read = 0').run(siteId);
    logger.info(`✅ Toutes les alertes du site ${siteId} marquées comme lues`);
  } else {
    db.prepare('UPDATE alerts SET read = 1 WHERE read = 0').run();
    logger.info(`✅ Toutes les alertes marquées comme lues`);
  }
}

export function deleteAlert(id) {
  const db = getDatabase();
  db.prepare('DELETE FROM alerts WHERE id = ?').run(id);
  logger.info(`🗑️ Alerte supprimée: ${id}`);
}

export function getUnreadAlertsCount(siteId = null) {
  const db = getDatabase();

  if (siteId) {
    return db.prepare('SELECT COUNT(*) as count FROM alerts WHERE site_id = ? AND read = 0').get(siteId).count;
  } else {
    return db.prepare('SELECT COUNT(*) as count FROM alerts WHERE read = 0').get().count;
  }
}
