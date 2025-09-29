window.addEventListener('scroll', e=> {
	document.body.style.cssText += `--scrollTop: ${this.scrollY}px`
})

document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(SplitText, ScrollTrigger);

    const heroTitle = document.querySelector('.hero__inner h1');
    if (heroTitle) {
        const split = new SplitText(heroTitle, { type: 'chars' });
        gsap.from(split.chars, {
            duration: 0.6,
            ease: 'power3.out',
            y: 40,
            opacity: 0,
            stagger: 0.05
        });
    }

    const spotifyWidget = document.getElementById('spotify-now-playing');
    const spotifyTitle = document.querySelector('.spotify-title');
    const apiUrl = 'https://spotify-show-last-68db402e666c.herokuapp.com/api/now-playing';

    // --- Helper Functions ---
    const proxyBuilders = [
        (url) => `https://cors.isomorphic-git.org/${url}`,
        (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    ];
    
    async function fetchJsonWithFallback(url) {
        const attempts = [url, ...proxyBuilders.map(b => b(url))];
        for (const attemptUrl of attempts) {
            try {
                const response = await fetch(attemptUrl, { cache: 'no-store' });
                if (!response.ok) continue;
                const contentType = response.headers.get('content-type') || '';
                let data;
                if (contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    try { data = JSON.parse(text); } catch (err) { console.warn('JSON parse failed for attempt', err); continue; }
                }
                return data;
            } catch (err) { console.warn('Fetch attempt failed, trying next proxy…', err); }
        }
        return null;
    }

    // --- State and DOM Management ---
    let currentTrackId = null;
    let currentIframe = null;

    // Create and append the placeholder initially
    const placeholder = document.createElement('div');
    placeholder.className = 'np-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.innerHTML = '<div></div>'; // for the shimmer effect
    spotifyWidget.appendChild(placeholder);

    function showTrack(html) {
        // Create a new iframe from the oEmbed HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const newIframe = tempDiv.querySelector('iframe');

        if (!newIframe) return;

        // Remove the old iframe if it exists
        if (currentIframe) {
            currentIframe.remove();
        }
        currentIframe = newIframe;
        
        // Append the new iframe (it's initially invisible due to CSS)
        spotifyWidget.appendChild(currentIframe);

        // Once the iframe content has loaded, trigger the cross-fade
        currentIframe.onload = () => {
            spotifyWidget.classList.add('is-loaded');
        };
    }

    function showPlaceholder() {
        spotifyWidget.classList.remove('is-loaded');
    }

    // --- Main Logic ---
    async function fetchNowPlaying() {
        try {
            const data = await fetchJsonWithFallback(apiUrl);

            if (spotifyTitle) {
                spotifyTitle.textContent = data?.isPlaying ? 'Now Playing' : 'Last Played';
            }

            if (!data?.trackId) {
                if (currentTrackId !== null) {
                    currentTrackId = null;
                    showPlaceholder();
                }
                return;
            }

            if (data.trackId === currentTrackId) {
                return; // Track hasn't changed
            }

            currentTrackId = data.trackId;
            const spotifyTrackUrl = `https://open.spotify.com/track/${data.trackId}`;
            const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyTrackUrl)}`;
            const oembedData = await fetchJsonWithFallback(oembedUrl);

            if (oembedData?.html) {
                showTrack(oembedData.html);
            } else {
                throw new Error('Invalid oEmbed data');
            }
        } catch (error) {
            console.error('Error fetching Spotify data:', error);
            currentTrackId = null;
            showPlaceholder();
        }
    }

    fetchNowPlaying();
    setInterval(fetchNowPlaying, 15000);

    // Reveal animations (desktop & mobile consistent)
    // Initial state for cards: match desktop effect (fade + scale)
    // Also add a temporary class to disable CSS transform transitions during reveal
    const cards = document.querySelectorAll('.link-card, .project-card');
    // Start hidden; avoid initial transform that could block :hover
    gsap.set(cards, { autoAlpha: 0 });

    // Batch-animate link cards on enter
    ScrollTrigger.batch('.link-card', {
        start: 'top 90%',
        once: true,
        onEnter: (batch) => gsap.to(batch, {
            duration: 0.5,
            autoAlpha: 1,
            stagger: 0.08,
            ease: 'power3.out',
            overwrite: 'auto'
        }).then(() => {
            batch.forEach(el => {
                // Clear inline transform so :hover can work seamlessly
                gsap.set(el, { clearProps: 'transform' });
            });
        })
    });

    // Batch-animate project cards on enter and enable hover only after all revealed
    const projectsRow = document.querySelector('.projects-row');
    const projectCards = document.querySelectorAll('.project-card');
    let revealedCount = 0;

    function markInteractiveIfDone() {
        if (!projectsRow) return;
        if (revealedCount >= projectCards.length && projectCards.length > 0) {
            projectsRow.classList.add('is-interactive');
        }
    }

    ScrollTrigger.batch('.project-card', {
        start: 'top 90%',
        once: true,
        onEnter: (batch) => gsap.to(batch, {
            duration: 0.6,
            autoAlpha: 1,
            stagger: 0.08,
            ease: 'power3.out',
            overwrite: 'auto'
        }).then(() => {
            batch.forEach(el => {
                // Ensure no inline transform remains to block CSS :hover
                gsap.set(el, { clearProps: 'transform' });
                if (!el.dataset.revealed) {
                    el.dataset.revealed = 'true';
                    revealedCount += 1;
                }
            });
            markInteractiveIfDone();
        })
    });

    // Keep the global flag logic (harmless now), but it’s no longer required for hover to work.
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => markInteractiveIfDone());
    } else {
        setTimeout(markInteractiveIfDone, 500);
    }

}); // End of 'DOMContentLoaded'
