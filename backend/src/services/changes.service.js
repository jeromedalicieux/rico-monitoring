import { getDatabase } from '../database/init.js';
import { subDays } from 'date-fns';

/**
 * Service pour récupérer tous les changements récents en un coup d'œil
 */

/**
 * Récupère tous les changements récents (positions, backlinks, GMB)
 */
export function getAllRecentChanges(days = 7) {
  const db = getDatabase();
  const sinceDate = subDays(new Date(), days).toISOString();
  const changes = [];

  // 1. Changements de positions
  const positionChanges = db.prepare(`
    SELECT
      s.name as site_name,
      k.keyword,
      ph1.position as current_position,
      ph2.position as previous_position,
      (ph1.position - ph2.position) as change,
      ph1.url,
      ph1.execution_date
    FROM position_history ph1
    INNER JOIN sites s ON ph1.site_id = s.id
    INNER JOIN keywords k ON ph1.keyword_id = k.id
    LEFT JOIN position_history ph2 ON
      ph1.site_id = ph2.site_id
      AND ph1.keyword_id = ph2.keyword_id
      AND ph2.id = (
        SELECT id FROM position_history
        WHERE site_id = ph1.site_id
        AND keyword_id = ph1.keyword_id
        AND id < ph1.id
        ORDER BY id DESC
        LIMIT 1
      )
    WHERE ph1.execution_date >= ?
    AND ph1.position IS NOT NULL
    AND ph2.position IS NOT NULL
    AND ph1.position != ph2.position
    ORDER BY ph1.execution_date DESC
    LIMIT 50
  `).all(sinceDate);

  positionChanges.forEach(change => {
    changes.push({
      type: 'position',
      site: change.site_name,
      title: `${change.keyword}`,
      description: `Position ${change.previous_position} → ${change.current_position}`,
      change: change.change,
      impact: change.change < 0 ? 'positive' : 'negative',
      date: change.execution_date,
      metadata: {
        keyword: change.keyword,
        currentPosition: change.current_position,
        previousPosition: change.previous_position,
        url: change.url,
      },
    });
  });

  // 2. Nouveaux backlinks
  const newBacklinks = db.prepare(`
    SELECT
      s.name as site_name,
      b.referring_domain,
      b.source_url,
      b.first_detected_date,
      b.status
    FROM backlinks b
    INNER JOIN sites s ON b.site_id = s.id
    WHERE b.first_detected_date >= ?
    AND b.status IN ('new', 'active')
    ORDER BY b.first_detected_date DESC
    LIMIT 30
  `).all(sinceDate);

  newBacklinks.forEach(backlink => {
    changes.push({
      type: 'backlink_new',
      site: backlink.site_name,
      title: `Nouveau backlink de ${backlink.referring_domain}`,
      description: backlink.source_url,
      change: 1,
      impact: 'positive',
      date: backlink.first_detected_date,
      metadata: {
        referringDomain: backlink.referring_domain,
        sourceUrl: backlink.source_url,
      },
    });
  });

  // 3. Backlinks perdus
  const lostBacklinks = db.prepare(`
    SELECT
      s.name as site_name,
      b.referring_domain,
      b.source_url,
      b.lost_date
    FROM backlinks b
    INNER JOIN sites s ON b.site_id = s.id
    WHERE b.lost_date >= ?
    AND b.status = 'lost'
    ORDER BY b.lost_date DESC
    LIMIT 30
  `).all(sinceDate);

  lostBacklinks.forEach(backlink => {
    changes.push({
      type: 'backlink_lost',
      site: backlink.site_name,
      title: `Backlink perdu: ${backlink.referring_domain}`,
      description: backlink.source_url,
      change: -1,
      impact: 'negative',
      date: backlink.lost_date,
      metadata: {
        referringDomain: backlink.referring_domain,
        sourceUrl: backlink.source_url,
      },
    });
  });

  // 4. Changements GMB (note, nombre d'avis)
  const gmbChanges = db.prepare(`
    SELECT
      s.name as site_name,
      g1.rating as current_rating,
      g2.rating as previous_rating,
      g1.reviews_count as current_reviews,
      g2.reviews_count as previous_reviews,
      g1.found,
      g1.execution_date
    FROM gmb_history g1
    INNER JOIN sites s ON g1.site_id = s.id
    LEFT JOIN gmb_history g2 ON
      g1.site_id = g2.site_id
      AND g2.id = (
        SELECT id FROM gmb_history
        WHERE site_id = g1.site_id
        AND id < g1.id
        ORDER BY id DESC
        LIMIT 1
      )
    WHERE g1.execution_date >= ?
    AND (
      g1.rating != g2.rating
      OR g1.reviews_count != g2.reviews_count
      OR g1.found != g2.found
    )
    ORDER BY g1.execution_date DESC
    LIMIT 20
  `).all(sinceDate);

  gmbChanges.forEach(change => {
    // Changement de note
    if (change.current_rating && change.previous_rating && change.current_rating !== change.previous_rating) {
      const ratingChange = change.current_rating - change.previous_rating;
      changes.push({
        type: 'gmb_rating',
        site: change.site_name,
        title: `Note GMB modifiée`,
        description: `${change.previous_rating}⭐ → ${change.current_rating}⭐`,
        change: ratingChange,
        impact: ratingChange > 0 ? 'positive' : 'negative',
        date: change.execution_date,
        metadata: {
          currentRating: change.current_rating,
          previousRating: change.previous_rating,
        },
      });
    }

    // Nouveaux avis
    if (change.current_reviews && change.previous_reviews && change.current_reviews !== change.previous_reviews) {
      const reviewsChange = change.current_reviews - change.previous_reviews;
      changes.push({
        type: 'gmb_reviews',
        site: change.site_name,
        title: `${Math.abs(reviewsChange)} nouvel(aux) avis GMB`,
        description: `${change.previous_reviews} → ${change.current_reviews} avis`,
        change: reviewsChange,
        impact: 'neutral',
        date: change.execution_date,
        metadata: {
          currentReviews: change.current_reviews,
          previousReviews: change.previous_reviews,
        },
      });
    }

    // GMB perdue
    if (change.previous_rating && !change.current_rating && !change.found) {
      changes.push({
        type: 'gmb_lost',
        site: change.site_name,
        title: `Fiche GMB introuvable`,
        description: `La fiche Google Business Profile n'a pas été détectée`,
        change: -1,
        impact: 'negative',
        date: change.execution_date,
        metadata: {},
      });
    }
  });

  // Trier par date décroissante
  changes.sort((a, b) => new Date(b.date) - new Date(a.date));

  return changes;
}

/**
 * Statistiques des changements
 */
export function getChangesStats(days = 7) {
  const db = getDatabase();
  const sinceDate = subDays(new Date(), days).toISOString();

  // Positions gagnées vs perdues
  const positionStats = db.prepare(`
    SELECT
      COUNT(CASE WHEN ph1.position < ph2.position THEN 1 END) as improved,
      COUNT(CASE WHEN ph1.position > ph2.position THEN 1 END) as declined,
      AVG(CASE WHEN ph1.position < ph2.position THEN ph2.position - ph1.position END) as avg_gain,
      AVG(CASE WHEN ph1.position > ph2.position THEN ph1.position - ph2.position END) as avg_loss
    FROM position_history ph1
    LEFT JOIN position_history ph2 ON
      ph1.site_id = ph2.site_id
      AND ph1.keyword_id = ph2.keyword_id
      AND ph2.id = (
        SELECT id FROM position_history
        WHERE site_id = ph1.site_id
        AND keyword_id = ph1.keyword_id
        AND id < ph1.id
        ORDER BY id DESC
        LIMIT 1
      )
    WHERE ph1.execution_date >= ?
    AND ph1.position IS NOT NULL
    AND ph2.position IS NOT NULL
    AND ph1.position != ph2.position
  `).get(sinceDate);

  // Backlinks
  const backlinkStats = db.prepare(`
    SELECT
      COUNT(CASE WHEN status IN ('new', 'active') THEN 1 END) as new_count,
      COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_count
    FROM backlinks
    WHERE first_detected_date >= ? OR lost_date >= ?
  `).get(sinceDate, sinceDate);

  return {
    positions: {
      improved: positionStats.improved || 0,
      declined: positionStats.declined || 0,
      avgGain: positionStats.avg_gain ? Math.round(positionStats.avg_gain * 10) / 10 : 0,
      avgLoss: positionStats.avg_loss ? Math.round(positionStats.avg_loss * 10) / 10 : 0,
    },
    backlinks: {
      new: backlinkStats.new_count || 0,
      lost: backlinkStats.lost_count || 0,
      net: (backlinkStats.new_count || 0) - (backlinkStats.lost_count || 0),
    },
  };
}
