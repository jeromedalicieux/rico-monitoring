import { chromium } from 'playwright';
import logger from '../utils/logger.js';
import { getRandomUserAgent, extractDomain } from '../utils/helpers.js';

/**
 * Scrappe les backlinks d'un domaine via Google
 */
export async function scrapeBacklinks(siteDomain) {
  let browser = null;
  let context = null;

  try {
    logger.info(`🔗 Recherche de backlinks pour ${siteDomain}`);

    const headless = process.env.SCRAPING_HEADLESS === 'true';
    browser = await chromium.launch({
      headless,
      args: ['--disable-blink-features=AutomationControlled']
    });

    context = await browser.newContext({
      userAgent: getRandomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      locale: 'fr-FR',
    });

    const page = await context.newPage();

    // Recherche Google pour trouver les pages qui mentionnent le domaine
    // mais qui ne sont pas sur le domaine lui-même
    const searchQuery = `"${siteDomain}" -site:${siteDomain}`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&hl=fr&gl=fr&num=50`;

    logger.info(`📡 Requête backlinks: ${searchQuery}`);

    await page.goto(searchUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Extraire les résultats
    const backlinks = await page.$$eval('#search .g, #rso .g', (elements, domain) => {
      const results = [];
      const domainClean = domain.replace('www.', '');

      elements.forEach(el => {
        const linkElement = el.querySelector('a[href]');
        const url = linkElement?.href || '';

        if (!url || url.includes('google.com')) return;

        // Extraire le domaine référent
        const urlObj = new URL(url);
        const referringDomain = urlObj.hostname.replace('www.', '');

        // Ne pas inclure notre propre domaine
        if (referringDomain.includes(domainClean)) return;

        const titleElement = el.querySelector('h3');
        const title = titleElement?.textContent || '';

        results.push({
          referringDomain,
          sourceUrl: url,
          title,
        });
      });

      return results;
    }, siteDomain);

    const rawHtml = await page.content();
    await browser.close();

    // Dédupliquer par domaine référent (garder la première occurrence)
    const uniqueBacklinks = [];
    const seenDomains = new Set();

    for (const backlink of backlinks) {
      if (!seenDomains.has(backlink.referringDomain)) {
        seenDomains.add(backlink.referringDomain);
        uniqueBacklinks.push(backlink);
      }
    }

    logger.info(`✅ ${uniqueBacklinks.length} backlinks uniques trouvés pour ${siteDomain}`);

    return {
      backlinks: uniqueBacklinks,
      rawHtml,
      totalFound: uniqueBacklinks.length,
    };

  } catch (error) {
    logger.error(`❌ Erreur lors du scraping de backlinks: ${error.message}`);
    if (browser) await browser.close();
    throw error;
  }
}

/**
 * Compare les backlinks actuels avec l'historique et détecte les changements
 */
export function detectBacklinkChanges(currentBacklinks, previousBacklinks) {
  const current = new Set(currentBacklinks.map(b => `${b.referringDomain}|${b.sourceUrl}`));
  const previous = new Set(previousBacklinks.map(b => `${b.referringDomain}|${b.sourceUrl}`));

  // Nouveaux backlinks
  const newBacklinks = currentBacklinks.filter(b => {
    const key = `${b.referringDomain}|${b.sourceUrl}`;
    return !previous.has(key);
  });

  // Backlinks perdus
  const lostBacklinks = previousBacklinks.filter(b => {
    const key = `${b.referringDomain}|${b.sourceUrl}`;
    return !current.has(key);
  });

  return {
    new: newBacklinks,
    lost: lostBacklinks,
    total: currentBacklinks.length,
    previousTotal: previousBacklinks.length,
  };
}
