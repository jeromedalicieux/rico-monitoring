import { getDatabase } from '../database/init.js';
import logger from '../utils/logger.js';
import { scrapeAllPositionsForSite } from '../scrapers/google-positions.js';
import { autoDetectGMB, scrapeGoogleBusinessProfile } from '../scrapers/google-gmb.js';
import { scrapeBacklinks, detectBacklinkChanges } from '../scrapers/backlinks.js';
import { getAllSites, getKeywordsBySite } from './sites.service.js';
import { waitRandomDelay } from '../utils/helpers.js';
import { createAlert } from './alerts.service.js';

/**
 * Lance une exécution complète de monitoring pour tous les sites
 */
export async function runFullMonitoring() {
  const db = getDatabase();
  const sites = getAllSites();

  logger.info(`🚀 Début du monitoring complet pour ${sites.length} site(s)`);

  const executionId = db.prepare(`
    INSERT INTO executions (execution_type, status)
    VALUES ('full', 'running')
  `).run().lastInsertRowid;

  try {
    for (const site of sites) {
      logger.info(`\n📊 Monitoring du site: ${site.name} (${site.domain})`);

      // 1. Suivi des positions
      await monitorPositions(site);
      await waitRandomDelay();

      // 2. Google Business Profile (détection automatique)
      await monitorGMB(site);
      await waitRandomDelay();

      // 3. Backlinks
      await monitorBacklinks(site);

      // Attendre avant le prochain site
      if (sites.indexOf(site) < sites.length - 1) {
        await waitRandomDelay();
      }
    }

    // Marquer l'exécution comme terminée
    db.prepare(`
      UPDATE executions
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(executionId);

    logger.info(`✅ Monitoring complet terminé avec succès`);

    return { success: true, executionId };

  } catch (error) {
    logger.error(`❌ Erreur lors du monitoring: ${error.message}`);

    db.prepare(`
      UPDATE executions
      SET status = 'failed', completed_at = CURRENT_TIMESTAMP, error_message = ?
      WHERE id = ?
    `).run(error.message, executionId);

    throw error;
  }
}

/**
 * Monitoring des positions Google pour un site
 */
export async function monitorPositions(site) {
  const db = getDatabase();
  const keywords = getKeywordsBySite(site.id);

  if (keywords.length === 0) {
    logger.warn(`⚠️ Aucun mot-clé actif pour ${site.domain}`);
    return;
  }

  logger.info(`🔍 Monitoring des positions pour ${keywords.length} mot(s)-clé(s)`);

  const results = await scrapeAllPositionsForSite(site, keywords);
  const executionDate = new Date().toISOString();

  // Enregistrer les résultats
  const stmt = db.prepare(`
    INSERT INTO position_history (site_id, keyword_id, position, url, search_query, execution_date, raw_html)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const result of results) {
    stmt.run(
      site.id,
      result.keywordId,
      result.position,
      result.url,
      result.searchQuery,
      executionDate,
      result.rawHtml
    );

    // Vérifier les chutes de position
    if (result.position) {
      await checkPositionDrop(site, result.keywordId, result.position, result.keyword);
    }
  }

  logger.info(`✅ ${results.length} position(s) enregistrée(s)`);
}

/**
 * Monitoring du Google Business Profile
 */
export async function monitorGMB(site) {
  const db = getDatabase();

  logger.info(`🏢 Monitoring GMB pour ${site.domain}`);

  // Utiliser la détection automatique ou la recherche manuelle
  let result;
  if (site.gmb_business_name && site.gmb_city) {
    logger.info(`📍 Recherche manuelle avec: ${site.gmb_business_name}, ${site.gmb_city}`);
    result = await scrapeGoogleBusinessProfile(
      site.gmb_business_name,
      site.gmb_city,
      site.domain
    );
  } else {
    logger.info(`🔍 Détection automatique de GMB`);
    result = await autoDetectGMB(site.domain);
  }

  const executionDate = new Date().toISOString();

  // Enregistrer le résultat
  db.prepare(`
    INSERT INTO gmb_history (site_id, found, business_name, category, rating, reviews_count, website_url, execution_date, raw_html)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    site.id,
    result.found ? 1 : 0,
    result.businessName,
    result.category,
    result.rating,
    result.reviewsCount,
    result.websiteUrl,
    executionDate,
    result.rawHtml
  );

  // Vérifier si la fiche a disparu
  if (!result.found) {
    await checkGMBLost(site);
  }

  logger.info(`✅ GMB enregistré: ${result.found ? 'Trouvé' : 'Non trouvé'}`);
}

/**
 * Monitoring des backlinks
 */
export async function monitorBacklinks(site) {
  const db = getDatabase();

  logger.info(`🔗 Monitoring des backlinks pour ${site.domain}`);

  const result = await scrapeBacklinks(site.domain);
  const executionDate = new Date().toISOString();

  // Récupérer les backlinks existants
  const existingBacklinks = db.prepare(`
    SELECT * FROM backlinks WHERE site_id = ? AND status = 'active'
  `).all(site.id);

  // Détecter les changements
  const changes = detectBacklinkChanges(result.backlinks, existingBacklinks);

  // Marquer les backlinks perdus
  if (changes.lost.length > 0) {
    const lostStmt = db.prepare(`
      UPDATE backlinks
      SET status = 'lost', lost_date = ?
      WHERE site_id = ? AND referring_domain = ? AND source_url = ?
    `);

    for (const lost of changes.lost) {
      lostStmt.run(executionDate, site.id, lost.referring_domain, lost.source_url);
    }

    // Créer une alerte
    await createAlert({
      site_id: site.id,
      alert_type: 'backlink_lost',
      severity: 'medium',
      title: `${changes.lost.length} backlink(s) perdu(s)`,
      message: `${changes.lost.length} backlink(s) ont disparu pour ${site.domain}`,
      metadata: JSON.stringify({ lost: changes.lost }),
    });

    logger.warn(`⚠️ ${changes.lost.length} backlink(s) perdu(s)`);
  }

  // Ajouter les nouveaux backlinks
  if (changes.new.length > 0) {
    const newStmt = db.prepare(`
      INSERT INTO backlinks (site_id, referring_domain, source_url, status, first_detected_date, last_seen_date)
      VALUES (?, ?, ?, 'new', ?, ?)
      ON CONFLICT(site_id, referring_domain, source_url) DO UPDATE SET
        status = 'active',
        last_seen_date = excluded.last_seen_date
    `);

    for (const newBacklink of changes.new) {
      newStmt.run(
        site.id,
        newBacklink.referringDomain,
        newBacklink.sourceUrl,
        executionDate,
        executionDate
      );
    }

    logger.info(`✅ ${changes.new.length} nouveau(x) backlink(s) détecté(s)`);
  }

  // Mettre à jour last_seen_date pour les backlinks existants
  const updateStmt = db.prepare(`
    UPDATE backlinks
    SET last_seen_date = ?, status = 'active'
    WHERE site_id = ? AND referring_domain = ? AND source_url = ?
  `);

  for (const backlink of result.backlinks) {
    updateStmt.run(executionDate, site.id, backlink.referringDomain, backlink.sourceUrl);
  }

  logger.info(`✅ ${result.totalFound} backlink(s) trouvé(s) au total`);
}

/**
 * Vérifie les chutes de position et crée des alertes
 */
async function checkPositionDrop(site, keywordId, currentPosition, keyword) {
  const db = getDatabase();
  const threshold = parseInt(process.env.ALERT_POSITION_DROP_THRESHOLD) || 5;

  // Récupérer la dernière position enregistrée
  const lastPosition = db.prepare(`
    SELECT position
    FROM position_history
    WHERE site_id = ? AND keyword_id = ?
    ORDER BY execution_date DESC
    LIMIT 1 OFFSET 1
  `).get(site.id, keywordId);

  if (lastPosition && lastPosition.position) {
    const drop = currentPosition - lastPosition.position;

    if (drop >= threshold) {
      await createAlert({
        site_id: site.id,
        alert_type: 'position_drop',
        severity: drop >= 10 ? 'high' : 'medium',
        title: `Chute de position: ${keyword}`,
        message: `Le mot-clé "${keyword}" a chuté de ${drop} positions (${lastPosition.position} → ${currentPosition})`,
        metadata: JSON.stringify({
          keyword,
          previousPosition: lastPosition.position,
          currentPosition,
          drop,
        }),
      });

      logger.warn(`⚠️ Alerte: chute de ${drop} positions pour "${keyword}"`);
    }
  }
}

/**
 * Vérifie si la fiche GMB a disparu
 */
async function checkGMBLost(site) {
  const db = getDatabase();

  // Vérifier si la fiche était présente avant
  const lastGMB = db.prepare(`
    SELECT found
    FROM gmb_history
    WHERE site_id = ?
    ORDER BY execution_date DESC
    LIMIT 1 OFFSET 1
  `).get(site.id);

  if (lastGMB && lastGMB.found === 1) {
    await createAlert({
      site_id: site.id,
      alert_type: 'gmb_lost',
      severity: 'high',
      title: 'Fiche GMB introuvable',
      message: `La fiche Google Business Profile de ${site.name} n'a pas été trouvée`,
      metadata: JSON.stringify({ businessName: site.gmb_business_name, city: site.gmb_city }),
    });

    logger.error(`🚨 Alerte: Fiche GMB perdue pour ${site.name}`);
  }
}
