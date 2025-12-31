import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_PATH || './data/monitoring.db';

export function initDatabase() {
  console.log('🗄️  Initialisation de la base de données...');

  // Créer la connexion à la base de données
  const db = new Database(DB_PATH, { verbose: console.log });

  // Lire le schéma SQL
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  // Exécuter le schéma
  db.exec(schema);

  console.log('✅ Base de données initialisée avec succès!');
  console.log(`📍 Chemin: ${DB_PATH}`);

  return db;
}

export function getDatabase() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  return db;
}

// Si exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase();
  process.exit(0);
}
