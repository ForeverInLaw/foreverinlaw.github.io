export function initConnectCodeHover() {
    const cards = document.querySelectorAll('.hero__links .link-card');
    if (!cards.length) return;

    const characterSet = '!"№;%:?*()_+|/.,<>~`-=.,@#$^&[]{}';

    const generateRandomString = (length) => {
        return Array.from({ length }, () => {
            return characterSet[Math.floor(Math.random() * characterSet.length)];
        }).join('');
    };

    cards.forEach((card) => {
        if (card.querySelector('.link-card__code-bg')) return;

        const codeBg = document.createElement('div');
        codeBg.className = 'link-card__code-bg';
        codeBg.setAttribute('aria-hidden', 'true');
        card.appendChild(codeBg);

        const updatePointer = (clientX, clientY) => {
            const rect = card.getBoundingClientRect();
            const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
            const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
            card.style.setProperty('--code-x', `${x}px`);
            card.style.setProperty('--code-y', `${y}px`);
        };

        const refreshText = () => {
            const rect = card.getBoundingClientRect();
            const estimatedLength = Math.max(650, Math.min(2200, Math.round((rect.width * rect.height) / 14)));
            codeBg.textContent = generateRandomString(estimatedLength);
        };

        // Regenerating up to ~2200 chars on every mousemove is high-frequency
        // churn (Motion Restraint). Gate refreshes by distance + time so the
        // "code rain" still follows the cursor without reflowing every frame.
        const REFRESH_MIN_DISTANCE_PX = 6;
        const REFRESH_MIN_INTERVAL_MS = 70;
        let lastRefreshX = 0;
        let lastRefreshY = 0;
        let lastRefreshAt = 0;

        const maybeRefresh = (clientX, clientY) => {
            const dx = clientX - lastRefreshX;
            const dy = clientY - lastRefreshY;
            const now = performance.now();
            if (now - lastRefreshAt < REFRESH_MIN_INTERVAL_MS && (dx * dx + dy * dy) < REFRESH_MIN_DISTANCE_PX * REFRESH_MIN_DISTANCE_PX) {
                return;
            }
            lastRefreshX = clientX;
            lastRefreshY = clientY;
            lastRefreshAt = now;
            refreshText();
        };

        const start = () => {
            card.classList.add('is-code-hover');
            if (!codeBg.textContent) {
                refreshText();
            }
        };

        const stop = () => {
            card.classList.remove('is-code-hover');
        };

        card.addEventListener('mouseenter', (event) => {
            updatePointer(event.clientX, event.clientY);
            lastRefreshX = event.clientX;
            lastRefreshY = event.clientY;
            lastRefreshAt = performance.now();
            start();
        });

        card.addEventListener('mousemove', (event) => {
            updatePointer(event.clientX, event.clientY);
            maybeRefresh(event.clientX, event.clientY);
        });

        card.addEventListener('mouseleave', stop);
        card.addEventListener('focusin', start);
        card.addEventListener('focusout', stop);

        card.addEventListener('touchstart', (event) => {
            const touch = event.touches[0];
            if (!touch) return;
            updatePointer(touch.clientX, touch.clientY);
            lastRefreshX = touch.clientX;
            lastRefreshY = touch.clientY;
            lastRefreshAt = performance.now();
            start();
        }, { passive: true });

        card.addEventListener('touchmove', (event) => {
            const touch = event.touches[0];
            if (!touch) return;
            updatePointer(touch.clientX, touch.clientY);
            maybeRefresh(touch.clientX, touch.clientY);
        }, { passive: true });

        card.addEventListener('touchend', stop, { passive: true });
        card.addEventListener('touchcancel', stop, { passive: true });
    });
}
