// Shared helpers for the "Selected Works" cards. Both the desktop hover preview
// and the mobile focus reel label a screenshot with the project's domain, so the
// href parsing lives here instead of being duplicated in each consumer.

const PRIVATE_LABEL = 'Private project';

/**
 * Human-readable source label for a card: its bare hostname when the card links
 * out, the raw href for non-http links, and a placeholder for cards that are
 * plain <article> elements with nowhere to go.
 */
export function getProjectDomain(card) {
    const href = card.tagName.toLowerCase() === 'a' ? card.getAttribute('href') || '' : '';
    if (!href) return PRIVATE_LABEL;
    if (!/^https?:\/\//i.test(href)) return href;

    try {
        return new URL(href).hostname.replace(/^www\./, '');
    } catch {
        return href;
    }
}
