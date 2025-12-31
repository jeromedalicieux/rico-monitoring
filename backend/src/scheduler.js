import cron from 'node-cron';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import { runFullMonitoring } from './services/monitoring.service.js';

dotenv.config();

/**
 * Configuration du scheduler pour le monitoring automatique
 */

const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 9 * * *'; // Par défaut: tous les jours à 9h

export function startScheduler() {
  logger.info('⏰ Initialisation du scheduler...');
  logger.info(`📅 Planning: ${CRON_SCHEDULE}`);

  // Valider l'expression cron
  if (!cron.validate(CRON_SCHEDULE)) {
    logger.error('❌ Expression cron invalide dans CRON_SCHEDULE');
    return;
  }

  // Créer la tâche planifiée
  const task = cron.schedule(CRON_SCHEDULE, async () => {
    logger.info('🔔 Déclenchement du monitoring planifié');

    try {
      await runFullMonitoring();
      logger.info('✅ Monitoring planifié terminé avec succès');
    } catch (error) {
      logger.error(`❌ Erreur lors du monitoring planifié: ${error.message}`);
    }
  }, {
    scheduled: true,
    timezone: 'Europe/Paris',
  });

  logger.info('✅ Scheduler démarré avec succès');
  logger.info(`⏰ Prochaine exécution prévue selon le planning: ${CRON_SCHEDULE}`);

  return task;
}

// Si exécuté directement, démarrer le scheduler
if (import.meta.url === `file://${process.argv[1]}`) {
  startScheduler();
  logger.info('💤 Scheduler en attente des tâches planifiées...');
}
