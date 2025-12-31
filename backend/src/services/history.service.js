import { getDatabase } from '../database/init.js';
import { subDays, format } from 'date-fns';

/**
 * Service de gestion de l'historique et des comparaisons
 */

/**
 * Récupère l'historique des positions pour un site
 */
export function getPositionHistory(siteId, keywordId = null, days = 30) {
  const db = getDatabase();
  const sinceDate = subDays(new Date(), days).toISOString();

  let query = `
    SELECT ph.*, k.keyword
    FROM position_history ph
    LEFT JOIN keywords k ON ph.keyword_id = k.id
    WHERE ph.site_id = ? AND ph.execution_date >= ?
  `;
  const params = [siteId, sinceDate];

  if (keywordId) {
    query += ' AND ph.keyword_id = ?';
    params.push(keywordId);
  }

  query += ' ORDER BY ph.execution_date DESC';

  return db.prepare(query).all(...params);
}

/**
 * Compare les positions actuelles avec J-1, J-7, J-30
 */
export function comparePositions(siteId) {
  const db = getDatabase();
  const today = new Date();

  // Récupérer la dernière exécution
  const latestPositions = db.prepare(`
    SELECT ph.*, k.keyword
    FROM position_history ph
    LEFT JOIN keywords k ON ph.keyword_id = k.id
    WHERE ph.site_id = ?
    AND ph.execution_date = (
      SELECT MAX(execution_date) FROM position_history WHERE site_id = ?
    )
  `).all(siteId, siteId);

  const comparisons = latestPositions.map(latest => {
    const keyword = latest.keyword_id;

    // J-1
    const day1 = getPositionAtDate(siteId, keyword, subDays(today, 1));
    // J-7
    const day7 = getPositionAtDate(siteId, keyword, subDays(today, 7));
    // J-30
    const day30 = getPositionAtDate(siteId, keyword, subDays(today, 30));

    return {
      keyword: latest.keyword,
      current: {
        position: latest.position,
        url: latest.url,
        date: latest.execution_date,
      },
      day1: day1 ? {
        position: day1.position,
        change: latest.position && day1.position ? latest.position - day1.position : null,
      } : null,
      day7: day7 ? {
        position: day7.position,
        change: latest.position && day7.position ? latest.position - day7.position : null,
      } : null,
      day30: day30 ? {
        position: day30.position,
        change: latest.position && day30.position ? latest.position - day30.position : null,
      } : null,
    };
  });

  return comparisons;
}

/**
 * Récupère la position la plus proche d'une date donnée
 */
function getPositionAtDate(siteId, keywordId, date) {
  const db = getDatabase();
  const targetDate = format(date, 'yyyy-MM-dd');

  return db.prepare(`
    SELECT position, url, execution_date
    FROM position_history
    WHERE site_id = ? AND keyword_id = ?
    AND DATE(execution_date) = ?
    ORDER BY execution_date DESC
    LIMIT 1
  `).get(siteId, keywordId, targetDate);
}

/**
 * Récupère l'historique GMB
 */
export function getGMBHistory(siteId, days = 30) {
  const db = getDatabase();
  const sinceDate = subDays(new Date(), days).toISOString();

  return db.prepare(`
    SELECT *
    FROM gmb_history
    WHERE site_id = ? AND execution_date >= ?
    ORDER BY execution_date DESC
  `).all(siteId, sinceDate);
}

/**
 * Récupère l'historique des backlinks
 */
export function getBacklinksHistory(siteId) {
  const db = getDatabase();

  return db.prepare(`
    SELECT *
    FROM backlinks
    WHERE site_id = ?
    ORDER BY first_detected_date DESC
  `).all(siteId);
}

/**
 * Récupère les backlinks par statut
 */
export function getBacklinksByStatus(siteId, status = 'active') {
  const db = getDatabase();

  return db.prepare(`
    SELECT *
    FROM backlinks
    WHERE site_id = ? AND status = ?
    ORDER BY last_seen_date DESC
  `).all(siteId, status);
}

/**
 * Récupère les statistiques de backlinks
 */
export function getBacklinksStats(siteId) {
  const db = getDatabase();

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM backlinks WHERE site_id = ?
  `).get(siteId).count;

  const active = db.prepare(`
    SELECT COUNT(*) as count FROM backlinks WHERE site_id = ? AND status = 'active'
  `).get(siteId).count;

  const lost = db.prepare(`
    SELECT COUNT(*) as count FROM backlinks WHERE site_id = ? AND status = 'lost'
  `).get(siteId).count;

  const newThisMonth = db.prepare(`
    SELECT COUNT(*) as count FROM backlinks
    WHERE site_id = ? AND status IN ('new', 'active')
    AND DATE(first_detected_date) >= DATE('now', '-30 days')
  `).get(siteId).count;

  return {
    total,
    active,
    lost,
    newThisMonth,
  };
}

/**
 * Récupère les exécutions récentes
 */
export function getRecentExecutions(limit = 10) {
  const db = getDatabase();

  return db.prepare(`
    SELECT e.*, s.name as site_name
    FROM executions e
    LEFT JOIN sites s ON e.site_id = s.id
    ORDER BY e.started_at DESC
    LIMIT ?
  `).all(limit);
}

/**
 * Récupère le dashboard complet pour un site
 */
export function getSiteDashboard(siteId) {
  const positions = comparePositions(siteId);
  const gmbHistory = getGMBHistory(siteId, 7);
  const backlinksStats = getBacklinksStats(siteId);
  const recentBacklinks = getBacklinksByStatus(siteId, 'active').slice(0, 10);

  return {
    positions,
    gmb: gmbHistory[0] || null,
    backlinks: {
      stats: backlinksStats,
      recent: recentBacklinks,
    },
  };
}
