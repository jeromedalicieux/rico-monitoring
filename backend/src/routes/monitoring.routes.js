import express from 'express';
import { runFullMonitoring, monitorPositions, monitorGMB, monitorBacklinks } from '../services/monitoring.service.js';
import { getSiteById } from '../services/sites.service.js';

const router = express.Router();

// Lancer un monitoring complet
router.post('/run', async (req, res) => {
  try {
    const result = await runFullMonitoring();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lancer le monitoring des positions pour un site spécifique
router.post('/positions/:siteId', async (req, res) => {
  try {
    const site = getSiteById(req.params.siteId);
    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }

    await monitorPositions(site);
    res.json({ success: true, message: 'Monitoring des positions terminé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lancer le monitoring GMB pour un site spécifique
router.post('/gmb/:siteId', async (req, res) => {
  try {
    const site = getSiteById(req.params.siteId);
    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }

    if (!site.gmb_business_name || !site.gmb_city) {
      return res.status(400).json({ error: 'Informations GMB manquantes pour ce site' });
    }

    await monitorGMB(site);
    res.json({ success: true, message: 'Monitoring GMB terminé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lancer le monitoring des backlinks pour un site spécifique
router.post('/backlinks/:siteId', async (req, res) => {
  try {
    const site = getSiteById(req.params.siteId);
    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }

    await monitorBacklinks(site);
    res.json({ success: true, message: 'Monitoring des backlinks terminé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
