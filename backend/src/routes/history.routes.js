import express from 'express';
import {
  getPositionHistory,
  comparePositions,
  getGMBHistory,
  getBacklinksHistory,
  getBacklinksByStatus,
  getBacklinksStats,
  getRecentExecutions,
  getSiteDashboard,
} from '../services/history.service.js';

const router = express.Router();

// Dashboard complet pour un site
router.get('/dashboard/:siteId', (req, res) => {
  try {
    const dashboard = getSiteDashboard(req.params.siteId);
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Historique des positions
router.get('/positions/:siteId', (req, res) => {
  try {
    const { keywordId, days } = req.query;
    const history = getPositionHistory(
      req.params.siteId,
      keywordId ? parseInt(keywordId) : null,
      days ? parseInt(days) : 30
    );
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Comparaisons de positions (J-1, J-7, J-30)
router.get('/positions/:siteId/compare', (req, res) => {
  try {
    const comparisons = comparePositions(req.params.siteId);
    res.json(comparisons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Historique GMB
router.get('/gmb/:siteId', (req, res) => {
  try {
    const { days } = req.query;
    const history = getGMBHistory(req.params.siteId, days ? parseInt(days) : 30);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Historique des backlinks
router.get('/backlinks/:siteId', (req, res) => {
  try {
    const history = getBacklinksHistory(req.params.siteId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Backlinks par statut
router.get('/backlinks/:siteId/status/:status', (req, res) => {
  try {
    const backlinks = getBacklinksByStatus(req.params.siteId, req.params.status);
    res.json(backlinks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Statistiques des backlinks
router.get('/backlinks/:siteId/stats', (req, res) => {
  try {
    const stats = getBacklinksStats(req.params.siteId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exécutions récentes
router.get('/executions', (req, res) => {
  try {
    const { limit } = req.query;
    const executions = getRecentExecutions(limit ? parseInt(limit) : 10);
    res.json(executions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
