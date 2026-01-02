import express from 'express';
import {
  getAllSites,
  getSiteById,
  createSite,
  updateSite,
  deleteSite,
  getKeywordsBySite,
  createKeyword,
  updateKeyword,
  deleteKeyword,
  createBulkSites,
} from '../services/sites.service.js';

const router = express.Router();

// Routes pour les sites
router.get('/', (req, res) => {
  try {
    const sites = getAllSites();
    res.json(sites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const site = getSiteById(req.params.id);
    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }
    res.json(site);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const site = createSite(req.body);
    res.status(201).json(site);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bulk', (req, res) => {
  try {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: 'Le champ "urls" doit être un tableau' });
    }

    const result = createBulkSites(urls);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const site = updateSite(req.params.id, req.body);
    res.json(site);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    deleteSite(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes pour les mots-clés
router.get('/:siteId/keywords', (req, res) => {
  try {
    const keywords = getKeywordsBySite(req.params.siteId);
    res.json(keywords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:siteId/keywords', (req, res) => {
  try {
    const keyword = createKeyword(req.params.siteId, req.body.keyword);
    res.status(201).json(keyword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:siteId/keywords/:keywordId', (req, res) => {
  try {
    const keyword = updateKeyword(req.params.keywordId, req.body.keyword, req.body.active);
    res.json(keyword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:siteId/keywords/:keywordId', (req, res) => {
  try {
    deleteKeyword(req.params.keywordId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
