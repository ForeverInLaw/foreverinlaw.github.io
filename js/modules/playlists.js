const PLAYLISTS_API = import.meta.env?.DEV
    ? '/api/playlists'
    : 'https://spotify-show-last-68db402e666c.herokuapp.com/api/playlists';

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[c]);

// Only allow http(s) URLs so remote data can't inject javascript:/data: into href/src
const safeUrl = (u) => {
    const s = String(u ?? '').trim();
    return /^https?:\/\//i.test(s) ? s : '';
};

function initPlaylistStack(container) {
    const items = Array.from(container.children);
    if (items.length === 0) return;

    let current = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchDeltaX = 0;
    let isSwiping = false;

    const dotsWrapper = document.createElement('div');
    dotsWrapper.className = 'stack-dots';
    items.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'stack-dot';
        dot.setAttribute('aria-label', `Playlist ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dotsWrapper.appendChild(dot);
    });
    container.parentNode.appendChild(dotsWrapper);
    const dots = dotsWrapper.querySelectorAll('.stack-dot');

    function updateHeight() {
        const activeItem = items[current];
        if (activeItem) {
            container.style.height = activeItem.offsetHeight + 'px';
        }
    }

    function applyStack() {
        items.forEach((item, i) => {
            item.classList.remove('stack-active', 'stack-next', 'stack-after', 'stack-hidden', 'stack-exit-left', 'stack-exit-right');

            const offset = ((i - current) + items.length) % items.length;
            if (offset === 0) {
                item.classList.add('stack-active');
            } else if (offset === 1) {
                item.classList.add('stack-next');
            } else if (offset === 2) {
                item.classList.add('stack-after');
            } else {
                item.classList.add('stack-hidden');
            }
        });
        dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
        updateHeight();
    }

    function goTo(index, direction) {
        if (index === current) return;
        const exitClass = direction === 'right' ? 'stack-exit-right' : 'stack-exit-left';
        const exitingItem = items[current];

        exitingItem.classList.remove('stack-active');
        exitingItem.classList.add(exitClass);

        current = index;

        items.forEach((item, i) => {
            if (item === exitingItem) return;
            item.classList.remove('stack-active', 'stack-next', 'stack-after', 'stack-hidden');
            const offset = ((i - current) + items.length) % items.length;
            if (offset === 0) item.classList.add('stack-active');
            else if (offset === 1) item.classList.add('stack-next');
            else if (offset === 2) item.classList.add('stack-after');
            else item.classList.add('stack-hidden');
        });
        dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
        updateHeight();

        setTimeout(() => {
            exitingItem.classList.remove(exitClass);
            const offset = ((items.indexOf(exitingItem) - current) + items.length) % items.length;
            if (offset === 1) exitingItem.classList.add('stack-next');
            else if (offset === 2) exitingItem.classList.add('stack-after');
            else exitingItem.classList.add('stack-hidden');
        }, 450);
    }

    function next() { goTo((current + 1) % items.length, 'left'); }
    function prev() { goTo((current - 1 + items.length) % items.length, 'right'); }

    container.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchDeltaX = 0;
        isSwiping = false;
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        touchDeltaX = e.touches[0].clientX - touchStartX;
        const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
        if (!isSwiping && Math.abs(touchDeltaX) > 15 && Math.abs(touchDeltaX) > deltaY) {
            isSwiping = true;
        }
    }, { passive: true });

    container.addEventListener('touchend', () => {
        if (isSwiping && Math.abs(touchDeltaX) > 50) {
            if (touchDeltaX < 0) next();
            else prev();
        }
        isSwiping = false;
    }, { passive: true });

    items.forEach(item => {
        item.addEventListener('click', (e) => {
            if (!item.classList.contains('stack-active')) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    });

    applyStack();
}

export async function initPlaylists() {
    const container = document.getElementById('playlists-container');
    if (!container) return;

    try {
        const response = await fetch(PLAYLISTS_API);
        if (!response.ok) throw new Error('Failed to fetch playlists');

        const playlists = await response.json();

        container.innerHTML = playlists.map(playlist => {
            const image = escapeHtml(safeUrl(playlist.image));
            const name = escapeHtml(playlist.name);
            return `
            <li>
                <a class="playlist-card" href="${escapeHtml(safeUrl(playlist.url))}" target="_blank" rel="noopener noreferrer">
                    <div class="vinyl-wrapper">
                        <div class="vinyl-record">
                            <div class="vinyl-rotator">
                                <div class="vinyl-label" data-image="${image}"></div>
                            </div>
                        </div>
                        <div class="playlist-cover-art">
                            <img src="${image}" alt="${name}" loading="lazy" />
                        </div>
                    </div>
                    <div class="playlist-content">
                        <span class="playlist-meta">${escapeHtml(playlist.tracks)} Tracks</span>
                        <div class="playlist-header">
                            <h3>${name}</h3>
                        </div>
                        <p class="playlist-description">${escapeHtml(playlist.description || 'A curated Spotify playlist.')}</p>
                    </div>
                </a>
            </li>`;
        }).join('');

        // Apply the vinyl-label art via the CSSOM (avoids CSS url() injection from remote data)
        container.querySelectorAll('.vinyl-label[data-image]').forEach(el => {
            const src = (el.getAttribute('data-image') || '').replace(/["\\]/g, '');
            if (src) el.style.backgroundImage = `url("${src}")`;
        });

        if (window.matchMedia('(max-width: 768px)').matches) {
            initPlaylistStack(container);
        } else {
            const cards = container.querySelectorAll('.playlist-card');
            cards.forEach(card => {
                card.addEventListener('click', (e) => {
                    if (!window.matchMedia('(max-width: 768px)').matches) return;
                    e.preventDefault();
                    if (card.classList.contains('is-active')) return;
                    const url = card.href;
                    cards.forEach(c => c.classList.remove('is-active'));
                    card.classList.add('is-active');
                    setTimeout(() => {
                        window.open(url, '_blank');
                        setTimeout(() => card.classList.remove('is-active'), 100);
                    }, 1000);
                });
            });
        }

        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }
    } catch (error) {
        console.error('Error loading playlists:', error);
        container.innerHTML = '<p style="color: var(--muted); padding: 20px;">Unable to load playlists at the moment.</p>';
    }
}
