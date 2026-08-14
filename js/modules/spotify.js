const NP_API = import.meta.env?.DEV
    ? '/api/now-playing'
    : 'https://spotify-now-playing.foreverinlaw.workers.dev/';
const POLL_INTERVAL_MS = 15000;

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[c]);

export function initSpotify() {
    const spotifyWidget = document.getElementById('spotify-now-playing');
    const spotifyTitle = document.querySelector('.spotify-title');

    if (spotifyTitle) {
        spotifyTitle.classList.add('loading');
    }

    if (spotifyWidget) {
        spotifyWidget.innerHTML = '<div class="np-placeholder" aria-hidden="true"><div></div></div>';
    }

    const npState = {
        trackId: null,
        isPlaying: false,
        progressMs: 0,
        durationMs: 0,
        lastSyncAt: 0,
        rafId: 0,
    };
    let npFetching = false;
    let npFailCount = 0;

    function setTitleText(text) {
        if (!spotifyTitle || spotifyTitle.textContent === text) return;
        spotifyTitle.textContent = text;
        if (text === 'Loading...') {
            spotifyTitle.classList.add('loading');
        } else {
            spotifyTitle.classList.remove('loading');
        }
    }

    function progressPercent(data) {
        if (!data.durationMs || data.progressMs == null) return 0;
        const pct = (data.progressMs / data.durationMs) * 100;
        return Math.max(0, Math.min(100, pct));
    }

    function renderCard(data) {
        if (!spotifyWidget) return;
        const t = data.track;
        const isStale = !data.isPlaying;
        const pulse = data.isPlaying ? '<span class="np-card__pulse" aria-hidden="true"></span>' : '';
        const badge = '<span class="np-card__badge" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm3.67 11.54a.5.5 0 0 1-.69.17c-1.88-1.15-4.25-1.41-7.04-.77a.5.5 0 1 1-.22-.97c3.05-.7 5.67-.4 7.78.88a.5.5 0 0 1 .17.69Zm.98-2.18a.62.62 0 0 1-.86.21c-2.16-1.32-5.45-1.7-8-.93a.62.62 0 1 1-.36-1.2c2.93-.88 6.55-.46 9 1.06a.62.62 0 0 1 .22.86Zm.08-2.27c-2.59-1.54-6.86-1.68-9.34-.93a.75.75 0 0 1-.43-1.44c2.84-.85 7.55-.69 10.53 1.08a.75.75 0 0 1-.76 1.29Z"/></svg></span>';
        spotifyWidget.innerHTML = `
            <a class="np-card${isStale ? ' is-stale' : ''}" href="${escapeHtml(t.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(t.name)} by ${escapeHtml(t.artists)}">
                <div class="np-card__art">
                    ${t.albumArt ? `<img src="${escapeHtml(t.albumArt)}" alt="" loading="lazy" decoding="async">` : ''}
                    ${pulse}
                    ${badge}
                </div>
                <div class="np-card__info">
                    <div class="np-card__title">${escapeHtml(t.name)}</div>
                    <div class="np-card__artist">${escapeHtml(t.artists)}</div>
                    <div class="np-card__progress"><div class="np-card__bar" style="width: ${progressPercent(data)}%"></div></div>
                </div>
            </a>
        `;
    }

    function showEmpty() {
        if (!spotifyWidget) return;
        spotifyWidget.innerHTML = '<div class="np-placeholder" aria-hidden="true"><div></div></div>';
    }

    function showMessage(text) {
        if (!spotifyWidget) return;
        const el = document.createElement('div');
        el.className = 'np-message';
        el.textContent = text;
        spotifyWidget.replaceChildren(el);
    }

    function stopProgressLoop() {
        if (npState.rafId) {
            cancelAnimationFrame(npState.rafId);
            npState.rafId = 0;
        }
    }

    function startProgressLoop() {
        stopProgressLoop();
        if (!npState.isPlaying || !npState.durationMs) return;
        const tick = () => {
            const bar = spotifyWidget && spotifyWidget.querySelector('.np-card__bar');
            if (!bar) {
                npState.rafId = 0;
                return;
            }
            const elapsed = Date.now() - npState.lastSyncAt;
            const cur = Math.min(npState.durationMs, npState.progressMs + elapsed);
            const pct = (cur / npState.durationMs) * 100;
            bar.style.width = `${pct}%`;
            if (cur >= npState.durationMs) {
                npState.rafId = 0;
                return;
            }
            npState.rafId = requestAnimationFrame(tick);
        };
        npState.rafId = requestAnimationFrame(tick);
    }

    async function fetchNowPlaying() {
        if (npFetching) return;
        npFetching = true;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const res = await fetch(NP_API, { cache: 'no-store', signal: controller.signal });
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error(`status ${res.status}`);
            const data = await res.json();
            npFailCount = 0;

            if (!data || !data.track) {
                npState.trackId = null;
                npState.isPlaying = false;
                stopProgressLoop();
                setTitleText('Not playing');
                showMessage('Nothing playing right now.');
                return;
            }

            setTitleText(data.isPlaying ? 'Now Playing' : 'Last Played');

            const isNewTrack = data.track.id !== npState.trackId;
            npState.trackId = data.track.id;
            npState.isPlaying = !!data.isPlaying;
            npState.progressMs = data.progressMs || 0;
            npState.durationMs = data.durationMs || 0;
            npState.lastSyncAt = Date.now();

            if (isNewTrack || !spotifyWidget.querySelector('.np-card')) {
                renderCard(data);
            } else {
                const bar = spotifyWidget.querySelector('.np-card__bar');
                if (bar) bar.style.width = `${progressPercent(data)}%`;
                const card = spotifyWidget.querySelector('.np-card');
                if (card) card.classList.toggle('is-stale', !data.isPlaying);
                const pulse = spotifyWidget.querySelector('.np-card__pulse');
                if (data.isPlaying && !pulse) {
                    const art = spotifyWidget.querySelector('.np-card__art');
                    if (art) art.insertAdjacentHTML('beforeend', '<span class="np-card__pulse" aria-hidden="true"></span>');
                } else if (!data.isPlaying && pulse) {
                    pulse.remove();
                }
            }

            startProgressLoop();
        } catch (err) {
            console.error('now-playing fetch failed:', err);
            npFailCount++;
            // Keep the last view on a single blip; only show an error once it's clearly down
            if (npFailCount >= 2) {
                stopProgressLoop();
                setTitleText('Unavailable');
                showMessage("Can't reach Spotify right now.");
            }
        } finally {
            npFetching = false;
        }
    }

    if (!spotifyWidget) return;

    fetchNowPlaying();
    setInterval(fetchNowPlaying, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopProgressLoop();
        } else {
            fetchNowPlaying();
        }
    });
}
