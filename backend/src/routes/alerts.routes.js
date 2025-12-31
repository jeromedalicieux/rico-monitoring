import express from 'express';
import {
  getAllAlerts,
  getAlertById,
  createAlert,
  markAlertAsRead,
  markAllAlertsAsRead,
  deleteAlert,
  getUnreadAlertsCount,
} from '../services/alerts.service.js';

const router = express.Router();

// Récupérer toutes les alertes
router.get('/', (req, res) => {
  try {
    const { read, site_id, severity, limit } = req.query;
    const filters = {};

    if (read !== undefined) filters.read = parseInt(read);
    if (site_id) filters.site_id = parseInt(site_id);
    if (severity) filters.severity = severity;
    if (limit) filters.limit = parseInt(limit);

    const alerts = getAllAlerts(filters);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Nombre d'alertes non lues
router.get('/unread/count', (req, res) => {
  try {
    const { site_id } = req.query;
    const count = getUnreadAlertsCount(site_id ? parseInt(site_id) : null);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer une alerte par ID
router.get('/:id', (req, res) => {
  try {
    const alert = getAlertById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alerte non trouvée' });
    }
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une alerte
router.post('/', (req, res) => {
  try {
    const alert = createAlert(req.body);
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Marquer une alerte comme lue
router.patch('/:id/read', (req, res) => {
  try {
    markAlertAsRead(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Marquer toutes les alertes comme lues
router.patch('/read/all', (req, res) => {
  try {
    const { site_id } = req.query;
    markAllAlertsAsRead(site_id ? parseInt(site_id) : null);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer une alerte
router.delete('/:id', (req, res) => {
  try {
    deleteAlert(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
