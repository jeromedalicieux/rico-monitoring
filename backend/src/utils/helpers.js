/**
 * Génère un délai aléatoire entre min et max (en ms)
 */
export function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Attend un délai aléatoire configuré
 */
export async function waitRandomDelay() {
  const minDelay = parseInt(process.env.SCRAPING_MIN_DELAY) || 30000;
  const maxDelay = parseInt(process.env.SCRAPING_MAX_DELAY) || 60000;
  const delay = randomDelay(minDelay, maxDelay);

  console.log(`⏳ Attente de ${Math.round(delay / 1000)}s avant la prochaine requête...`);
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Liste de user agents pour la rotation
 */
export const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
];

/**
 * Retourne un user agent aléatoire
 */
export function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Extrait le domaine d'une URL
 */
export function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url.replace('www.', '');
  }
}

/**
 * Nettoie une chaîne de texte
 */
export function cleanText(text) {
  return text?.trim().replace(/\s+/g, ' ') || '';
}

/**
 * Formatte une date au format ISO
 */
export function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}
