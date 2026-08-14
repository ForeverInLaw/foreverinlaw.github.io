// Shared plumbing for the two sections that render data from a remote API
// (spotify.js, playlists.js). Both interpolate remote strings into markup, so
// escaping and URL safety are decided here once rather than per module.

const HTML_ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

const DEFAULT_TIMEOUT_MS = 8000;

/** Escapes a value for interpolation into an HTML template. */
export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ENTITIES[c]);

/**
 * Only http(s) URLs survive, so remote data can't inject javascript: or data:
 * into an href or src. Returns '' for anything else.
 */
export const safeUrl = (value) => {
    const url = String(value ?? '').trim();
    return /^https?:\/\//i.test(url) ? url : '';
};

/**
 * Picks the dev proxy path when Vite is serving, the public URL otherwise.
 * Keeps the two-endpoint dance out of the calling modules.
 */
export const apiEndpoint = (devPath, publicUrl) => (import.meta.env?.DEV ? devPath : publicUrl);

/**
 * GET + parse JSON with a hard timeout, because a hanging request otherwise
 * leaves the section stuck on its loading state forever. Throws on non-2xx.
 */
export async function fetchJson(url, { timeoutMs = DEFAULT_TIMEOUT_MS, ...init } = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, { signal: controller.signal, ...init });
        if (!response.ok) throw new Error(`status ${response.status}`);
        return await response.json();
    } finally {
        clearTimeout(timeoutId);
    }
}
