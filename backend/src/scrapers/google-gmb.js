import { chromium } from 'playwright';
import logger from '../utils/logger.js';
import { getRandomUserAgent, cleanText } from '../utils/helpers.js';

/**
 * Détection automatique de GMB basée uniquement sur le domaine
 */
export async function autoDetectGMB(siteDomain) {
  let browser = null;
  let context = null;

  try {
    logger.info(`🔍 Détection automatique GMB pour ${siteDomain}`);

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

    // Rechercher le domaine directement dans Google
    const searchQuery = `"${siteDomain}" google business`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

    logger.info(`📡 Recherche auto GMB: ${searchQuery}`);

    await page.goto(searchUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Chercher un lien vers Google Maps dans les résultats
    const mapsLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="google.com/maps"]'));
      for (const link of links) {
        if (link.href.includes('/place/')) {
          return link.href;
        }
      }
      return null;
    });

    if (!mapsLink) {
      logger.warn(`⚠️ Aucune fiche GMB détectée automatiquement pour ${siteDomain}`);
      await browser.close();
      return {
        found: false,
        businessName: null,
        category: null,
        rating: null,
        reviewsCount: null,
        websiteUrl: null,
        rawHtml: null,
      };
    }

    // Accéder à la page Google Maps
    logger.info(`✅ Fiche GMB trouvée, extraction des données...`);
    await page.goto(mapsLink, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Extraire les informations
    const gmbData = await page.evaluate((domain) => {
      const data = {
        businessName: null,
        category: null,
        rating: null,
        reviewsCount: null,
        websiteUrl: null,
      };

      // Nom de l'établissement
      const nameElement = document.querySelector('h1');
      if (nameElement) {
        data.businessName = nameElement.textContent.trim();
      }

      // Catégorie
      const categoryElement = document.querySelector('button[jsaction*="category"]');
      if (categoryElement) {
        data.category = categoryElement.textContent.trim();
      }

      // Note et nombre d'avis
      const ratingElement = document.querySelector('div[role="img"][aria-label*="étoiles"]');
      if (ratingElement) {
        const ariaLabel = ratingElement.getAttribute('aria-label');
        const ratingMatch = ariaLabel.match(/(\d+,?\d*)\s+étoiles?/);
        const reviewsMatch = ariaLabel.match(/(\d+)\s+avis/);

        if (ratingMatch) {
          data.rating = parseFloat(ratingMatch[1].replace(',', '.'));
        }
        if (reviewsMatch) {
          data.reviewsCount = parseInt(reviewsMatch[1]);
        }
      }

      // URL du site web
      const websiteLinks = Array.from(document.querySelectorAll('a[href*="http"]'));
      for (const link of websiteLinks) {
        const href = link.href;
        if (href && !href.includes('google.com') && !href.includes('maps')) {
          const linkDomain = href.replace('https://', '').replace('http://', '').split('/')[0].replace('www.', '');
          if (linkDomain.includes(domain.replace('www.', ''))) {
            data.websiteUrl = href;
            break;
          }
        }
      }

      return data;
    }, siteDomain);

    const rawHtml = await page.content();
    await browser.close();

    // Vérifier si le site web correspond à notre domaine
    const domainMatches = gmbData.websiteUrl &&
      gmbData.websiteUrl.includes(siteDomain.replace('www.', ''));

    if (domainMatches) {
      logger.info(`✅ GMB validée: ${gmbData.businessName} - ${gmbData.rating}⭐ (${gmbData.reviewsCount} avis)`);
      return {
        found: true,
        ...gmbData,
        rawHtml,
      };
    } else {
      logger.warn(`⚠️ GMB trouvée mais le domaine ne correspond pas: ${gmbData.websiteUrl} vs ${siteDomain}`);
      return {
        found: false,
        businessName: gmbData.businessName,
        category: gmbData.category,
        rating: gmbData.rating,
        reviewsCount: gmbData.reviewsCount,
        websiteUrl: gmbData.websiteUrl,
        rawHtml,
      };
    }

  } catch (error) {
    logger.error(`❌ Erreur lors de la détection auto GMB: ${error.message}`);
    if (browser) await browser.close();
    throw error;
  }
}

/**
 * Scrappe les informations Google Business Profile pour un site
 */
export async function scrapeGoogleBusinessProfile(businessName, city, siteDomain) {
  let browser = null;
  let context = null;

  try {
    logger.info(`🏢 Recherche GMB pour "${businessName}" à ${city}`);

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

    // Recherche Google Maps
    const searchQuery = `${businessName} ${city}`;
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;

    logger.info(`📡 Recherche Maps: ${searchQuery}`);

    await page.goto(searchUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Vérifier si on a des résultats
    const hasResults = await page.$('div[role="article"]');

    if (!hasResults) {
      logger.warn(`⚠️ Aucun résultat GMB trouvé pour "${businessName}" à ${city}`);
      await browser.close();

      return {
        found: false,
        businessName: null,
        category: null,
        rating: null,
        reviewsCount: null,
        websiteUrl: null,
        rawHtml: await page.content(),
      };
    }

    // Cliquer sur le premier résultat
    await page.click('div[role="article"]');
    await page.waitForTimeout(2000);

    // Extraire les informations
    const gmbData = await page.evaluate((domain) => {
      const data = {
        businessName: null,
        category: null,
        rating: null,
        reviewsCount: null,
        websiteUrl: null,
      };

      // Nom de l'établissement
      const nameElement = document.querySelector('h1');
      if (nameElement) {
        data.businessName = nameElement.textContent.trim();
      }

      // Catégorie
      const categoryElement = document.querySelector('button[jsaction*="category"]');
      if (categoryElement) {
        data.category = categoryElement.textContent.trim();
      }

      // Note et nombre d'avis
      const ratingElement = document.querySelector('div[role="img"][aria-label*="étoiles"]');
      if (ratingElement) {
        const ariaLabel = ratingElement.getAttribute('aria-label');
        const ratingMatch = ariaLabel.match(/(\d+,?\d*)\s+étoiles?/);
        const reviewsMatch = ariaLabel.match(/(\d+)\s+avis/);

        if (ratingMatch) {
          data.rating = parseFloat(ratingMatch[1].replace(',', '.'));
        }
        if (reviewsMatch) {
          data.reviewsCount = parseInt(reviewsMatch[1]);
        }
      }

      // URL du site web
      const websiteLinks = Array.from(document.querySelectorAll('a[href*="http"]'));
      for (const link of websiteLinks) {
        const href = link.href;
        if (href && !href.includes('google.com') && !href.includes('maps')) {
          // Vérifier si l'URL contient notre domaine
          const linkDomain = href.replace('https://', '').replace('http://', '').split('/')[0].replace('www.', '');
          if (linkDomain.includes(domain.replace('www.', ''))) {
            data.websiteUrl = href;
            break;
          }
        }
      }

      return data;
    }, siteDomain);

    const rawHtml = await page.content();
    await browser.close();

    // Vérifier si le site web correspond à notre domaine
    const domainMatches = gmbData.websiteUrl &&
      gmbData.websiteUrl.includes(siteDomain.replace('www.', ''));

    if (domainMatches) {
      logger.info(`✅ GMB trouvée et validée: ${gmbData.businessName} - ${gmbData.rating}⭐ (${gmbData.reviewsCount} avis)`);

      return {
        found: true,
        ...gmbData,
        rawHtml,
      };
    } else {
      logger.warn(`⚠️ GMB trouvée mais le domaine ne correspond pas: ${gmbData.websiteUrl} vs ${siteDomain}`);

      return {
        found: false,
        businessName: gmbData.businessName,
        category: gmbData.category,
        rating: gmbData.rating,
        reviewsCount: gmbData.reviewsCount,
        websiteUrl: gmbData.websiteUrl,
        rawHtml,
      };
    }

  } catch (error) {
    logger.error(`❌ Erreur lors du scraping GMB: ${error.message}`);
    if (browser) await browser.close();
    throw error;
  }
}
