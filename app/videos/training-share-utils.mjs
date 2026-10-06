import { homepageShareUrl } from '../../public/footer-share.mjs';

export const trainingShareUrl = homepageShareUrl;

/**
 * @typedef {'opened' | 'copied' | 'cancelled' | 'manual'} ShareOutcome
 * @typedef {{share?: (data: {title: string, url: string}) => Promise<void>, clipboard?: {writeText: (text: string) => Promise<void>}}} ShareNavigator
 */

/** @param {ShareNavigator} browser @returns {Promise<ShareOutcome>} */
export async function copyTrainingLink(browser) {
  try {
    if (!browser.clipboard?.writeText) return 'manual';
    await browser.clipboard.writeText(trainingShareUrl);
    return 'copied';
  } catch {
    return 'manual';
  }
}

/** @param {ShareNavigator} browser @returns {Promise<ShareOutcome>} */
export async function shareTrainingLink(browser) {
  if (typeof browser.share === 'function') {
    try {
      // Start directly from the click so native sharing keeps user activation.
      await browser.share({
        title: 'Secure By Design',
        url: trainingShareUrl,
      });
      return 'opened';
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name === 'AbortError'
      ) {
        return 'cancelled';
      }
    }
  }
  return copyTrainingLink(browser);
}
