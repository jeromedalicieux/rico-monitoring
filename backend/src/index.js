import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

import logger from './utils/logger.js';
import { initDatabase } from './database/init.js';
import sitesRoutes from './routes/sites.routes.js';
import monitoringRoutes from './routes/monitoring.routes.js';
import historyRoutes from './routes/history.routes.js';
import alertsRoutes from './routes/alerts.routes.js';
import changesRoutes from './routes/changes.routes.js';

// Configuration
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3001;
const app = express();

// Créer les dossiers nécessaires
const dataDir = join(process.cwd(), 'data');
const logsDir = join(process.cwd(), 'logs');

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
  logger.info('📁 Dossier data créé');
}

if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
  logger.info('📁 Dossier logs créé');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/sites', sitesRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/changes', changesRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Route par défaut
app.get('/', (req, res) => {
  res.json({
    name: 'Monitoring Sites API',
    version: '1.0.0',
    endpoints: {
      sites: '/api/sites',
      monitoring: '/api/monitoring',
      history: '/api/history',
      alerts: '/api/alerts',
      changes: '/api/changes',
      health: '/health',
    },
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  logger.error(`Erreur serveur: ${err.message}`);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// Initialisation de la base de données
try {
  initDatabase();
  logger.info('✅ Base de données initialisée');
} catch (error) {
  logger.error(`❌ Erreur lors de l'initialisation de la base de données: ${error.message}`);
  process.exit(1);
}

// Démarrage du serveur
app.listen(PORT, () => {
  logger.info(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  logger.info(`📊 API disponible sur http://localhost:${PORT}/api`);
  logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
});

export default app;
