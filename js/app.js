(function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
})();

window.addEventListener('scroll', () => {
	document.body.style.cssText += `--scrollTop: ${window.scrollY}px`;
}, { passive: true });

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#f492f0' : '#c960c5');
            }
        });
    }
    gsap.registerPlugin(SplitText, ScrollTrigger);

    const heroTitle = document.querySelector('.hero__inner h1');
    if (heroTitle) {
        try {
            const split = new SplitText(heroTitle, { type: 'chars' });
            gsap.from(split.chars, {
                duration: 0.6,
                ease: 'power3.out',
                y: 40,
                opacity: 0,
                stagger: 0.05
            });
        } catch (error) {
            console.warn('SplitText animation failed:', error);
        }
    }

    const spotifyWidget = document.getElementById('spotify-now-playing');
    const spotifyTitle = document.querySelector('.spotify-title');
    const apiUrl = 'https://spotify-show-last-68db402e666c.herokuapp.com/api/now-playing';
    
    if (spotifyTitle) {
        spotifyTitle.classList.add('loading');
    }

    async function fetchJsonWithFallback(url, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                
                const response = await fetch(url, { 
                    cache: 'no-store',
                    signal: controller.signal 
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                if (i === retries - 1) {
                    console.error('Fetch failed after retries:', error);
                    return null;
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
        return null;
    }

    let currentTrackId = null;
    let currentIframe = null;
    let isFetching = false;
    
    function updateTitleText(newText) {
        if (!spotifyTitle || spotifyTitle.textContent === newText) return;
        
        spotifyTitle.classList.add('fade-out');
        
        setTimeout(() => {
            spotifyTitle.textContent = newText;
            spotifyTitle.classList.remove('fade-out');
            spotifyTitle.classList.add('fade-in');
            
            if (newText !== 'Loading...') {
                spotifyTitle.classList.remove('loading');
            }
            
            setTimeout(() => {
                spotifyTitle.classList.remove('fade-in');
            }, 500);
        }, 200);
    }

    if (spotifyWidget) {
        const placeholder = document.createElement('div');
        placeholder.className = 'np-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.innerHTML = '<div></div>';
        spotifyWidget.appendChild(placeholder);
    }

    function showTrack(html) {
        if (!spotifyWidget) return;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const newIframe = tempDiv.querySelector('iframe');

        if (!newIframe) return;

        if (currentIframe) {
            currentIframe.remove();
        }
        currentIframe = newIframe;
        
        newIframe.title = 'Spotify player';
        newIframe.loading = 'lazy';
        
        spotifyWidget.appendChild(currentIframe);

        currentIframe.onload = () => {
            spotifyWidget.classList.add('is-loaded');
        };
        
        currentIframe.onerror = () => {
            console.error('Failed to load Spotify iframe');
            showPlaceholder();
        };
    }

    function showPlaceholder() {
        if (spotifyWidget) {
            spotifyWidget.classList.remove('is-loaded');
        }
    }

    async function fetchNowPlaying() {
        if (isFetching) return;
        isFetching = true;
        
        try {
            const data = await fetchJsonWithFallback(apiUrl);

            if (!data) {
                throw new Error('No data received');
            }

            const newTitle = data?.isPlaying ? 'Now Playing' : 'Last Played';
            updateTitleText(newTitle);

            if (!data?.trackId) {
                if (currentTrackId !== null) {
                    currentTrackId = null;
                    showPlaceholder();
                }
                return;
            }

            if (data.trackId === currentTrackId) {
                return;
            }

            currentTrackId = data.trackId;
            const spotifyTrackUrl = `https://open.spotify.com/track/${encodeURIComponent(data.trackId)}`;
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
            updateTitleText('Loading...');
            if (spotifyTitle) {
                spotifyTitle.classList.add('loading');
            }
            showPlaceholder();
        } finally {
            isFetching = false;
        }
    }

    if (spotifyWidget) {
        fetchNowPlaying();
        setInterval(fetchNowPlaying, 15000);
    }

    window.masonryLayout = function() {
        const container = document.querySelector('.projects-row');
        if (!container) return;

        const items = Array.from(container.children);
        if (items.length === 0) return;

        const gap = 12;
        const containerWidth = container.offsetWidth;
        const itemMinWidth = 200;
        const columns = Math.max(1, Math.floor((containerWidth + gap) / (itemMinWidth + gap)));
        const itemWidth = (containerWidth - (gap * (columns - 1))) / columns;

        const columnHeights = new Array(columns).fill(0);

        items.forEach((item, index) => {
            const column = index % columns;
            
            item.style.width = `${itemWidth}px`;
            item.style.left = `${column * (itemWidth + gap)}px`;
            item.style.top = `${columnHeights[column]}px`;
            
            columnHeights[column] += item.offsetHeight + gap;
        });

        container.style.height = `${Math.max(...columnHeights) - gap}px`;
    }

    window.masonryLayout();

    const cards = document.querySelectorAll('.link-card, .project-card');
    gsap.set(cards, { autoAlpha: 0 });

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
                gsap.set(el, { clearProps: 'transform' });
            });
        })
    });

    const projectsRow = document.querySelector('.projects-row');
    const projectCards = document.querySelectorAll('.project-card');
    let revealedCount = 0;

    function markInteractiveIfDone() {
        if (!projectsRow || projectCards.length === 0) return;
        if (revealedCount >= projectCards.length) {
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
                gsap.set(el, { clearProps: 'transform' });
                if (!el.dataset.revealed) {
                    el.dataset.revealed = 'true';
                    revealedCount += 1;
                }
            });
            markInteractiveIfDone();
            setTimeout(() => {
                if (window.masonryLayout) window.masonryLayout();
            }, 100);
        })
    });

    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => markInteractiveIfDone());
    } else {
        setTimeout(markInteractiveIfDone, 500);
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
        ScrollTrigger.getAll().forEach(trigger => {
            trigger.kill();
        });
        gsap.set(cards, { autoAlpha: 1 });
    }

    window.addEventListener('beforeunload', () => {
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    });

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(window.masonryLayout, 150);
    });

    const observer = new MutationObserver(() => {
        window.masonryLayout();
    });

    const projectsContainer = document.querySelector('.projects-row');
    if (projectsContainer) {
        observer.observe(projectsContainer, {
            childList: true,
            subtree: true,
            attributes: true
        });
    }

});
