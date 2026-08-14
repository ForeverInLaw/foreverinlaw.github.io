export function initGithubStats() {
    // Stat/graph images are static SVGs; if an asset 404s, swap the broken
    // image box for a readable fallback instead of a broken-image icon.
    const handleStatImgError = (img) => {
        const wrap = img.closest('.stats-image-wrapper, .graph-wrapper');
        if (!wrap || wrap.querySelector('.stats-error')) return;
        const msg = document.createElement('p');
        msg.className = 'stats-error';
        msg.textContent = 'GitHub stats are unavailable right now.';
        wrap.replaceChildren(msg);
    };
    document.querySelectorAll('.stats-img, .graph-img').forEach(img => {
        if (img.complete && img.naturalWidth === 0) {
            handleStatImgError(img);
            return;
        }
        img.addEventListener('error', () => handleStatImgError(img), { once: true });
    });

    const graphContent = document.querySelector('.graph-card .card-content');
    if (!graphContent) return;

    const scrollToEnd = () => { graphContent.scrollLeft = graphContent.scrollWidth; };

    const graphImgs = graphContent.querySelectorAll('img');
    if (graphImgs.length) {
        graphImgs.forEach(img => {
            if (img.complete) return;
            img.addEventListener('load', scrollToEnd, { once: true });
        });
    }
    scrollToEnd();

    const updateFade = () => {
        const atLeft = graphContent.scrollLeft <= 10;
        const atRight = graphContent.scrollLeft + graphContent.clientWidth >= graphContent.scrollWidth - 10;

        graphContent.classList.remove('fade-left', 'fade-right', 'fade-both');
        if (!atLeft && !atRight) graphContent.classList.add('fade-both');
        else if (!atLeft) graphContent.classList.add('fade-left');
        else if (!atRight) graphContent.classList.add('fade-right');
    };
    graphContent.addEventListener('scroll', updateFade, { passive: true });
    updateFade();
}
