import express from 'express';
import { getAllRecentChanges, getChangesStats } from '../services/changes.service.js';

const router = express.Router();

// Récupérer tous les changements récents
router.get('/', (req, res) => {
  try {
    const { days } = req.query;
    const changes = getAllRecentChanges(days ? parseInt(days) : 7);
    res.json(changes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Statistiques des changements
router.get('/stats', (req, res) => {
  try {
    const { days } = req.query;
    const stats = getChangesStats(days ? parseInt(days) : 7);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
