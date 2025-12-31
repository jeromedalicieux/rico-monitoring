import { chromium } from 'playwright';
import logger from '../utils/logger.js';
import { getRandomUserAgent, waitRandomDelay, extractDomain, cleanText } from '../utils/helpers.js';

/**
 * Scrappe les positions Google pour un mot-clé et un site donnés
 */
export async function scrapeGooglePosition(keyword, siteDomain) {
  let browser = null;
  let context = null;

  try {
    logger.info(`🔍 Recherche de position pour "${keyword}" sur le site ${siteDomain}`);

    // Lancer le navigateur
    const headless = process.env.SCRAPING_HEADLESS === 'true';
    browser = await chromium.launch({
      headless,
      args: ['--disable-blink-features=AutomationControlled']
    });

    // Créer un contexte avec un user agent aléatoire
    context = await browser.newContext({
      userAgent: getRandomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      locale: 'fr-FR',
    });

    const page = await context.newPage();

    // Stratégie 1 : Recherche ciblée avec site:domaine
    const searchQuery = `${keyword} site:${siteDomain}`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&hl=fr&gl=fr`;

    logger.info(`📡 Requête: ${searchQuery}`);

    // Accéder à la page de résultats
    await page.goto(searchUrl, { waitUntil: 'networkidle' });

    // Attendre que les résultats soient chargés
    await page.waitForTimeout(2000);

    // Extraire le HTML brut pour archivage
    const rawHtml = await page.content();

    // Chercher les résultats organiques
    const results = await page.$$eval('#search .g, #rso .g', (elements, domain) => {
      return elements.map((el, index) => {
        // Chercher le lien principal
        const linkElement = el.querySelector('a[href]');
        const url = linkElement?.href || '';

        // Chercher le titre
        const titleElement = el.querySelector('h3');
        const title = titleElement?.textContent || '';

        // Vérifier si c'est notre domaine
        const urlDomain = url.replace('https://', '').replace('http://', '').split('/')[0].replace('www.', '');
        const matches = urlDomain.includes(domain);

        return {
          position: index + 1,
          url,
          title,
          matches,
        };
      });
    }, siteDomain.replace('www.', ''));

    // Trouver la première position qui correspond à notre domaine
    const matchingResult = results.find(r => r.matches);

    if (matchingResult) {
      logger.info(`✅ Position trouvée: #${matchingResult.position} - ${matchingResult.url}`);

      await browser.close();

      return {
        position: matchingResult.position,
        url: matchingResult.url,
        searchQuery,
        rawHtml,
        found: true,
      };
    } else {
      logger.warn(`⚠️ Aucune position trouvée pour "${keyword}" sur ${siteDomain}`);

      await browser.close();

      return {
        position: null,
        url: null,
        searchQuery,
        rawHtml,
        found: false,
      };
    }

  } catch (error) {
    logger.error(`❌ Erreur lors du scraping de position: ${error.message}`);
    if (browser) await browser.close();
    throw error;
  }
}

/**
 * Scrappe les positions pour tous les mots-clés d'un site
 */
export async function scrapeAllPositionsForSite(site, keywords) {
  const results = [];

  for (const keyword of keywords) {
    try {
      const result = await scrapeGooglePosition(keyword.keyword, site.domain);
      results.push({
        keywordId: keyword.id,
        keyword: keyword.keyword,
        ...result,
      });

      // Attendre un délai aléatoire avant la prochaine requête
      if (keywords.indexOf(keyword) < keywords.length - 1) {
        await waitRandomDelay();
      }

    } catch (error) {
      logger.error(`❌ Erreur pour le mot-clé "${keyword.keyword}": ${error.message}`);
      results.push({
        keywordId: keyword.id,
        keyword: keyword.keyword,
        position: null,
        url: null,
        searchQuery: `${keyword.keyword} site:${site.domain}`,
        rawHtml: null,
        found: false,
        error: error.message,
      });
    }
  }

  return results;
}
