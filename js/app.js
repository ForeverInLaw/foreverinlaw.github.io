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
                metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#050505' : '#fafafa');
            }

            // Update aria-hidden attributes for GitHub stats images
            const darkImg = document.querySelector('.github-stats-img--dark');
            const lightImg = document.querySelector('.github-stats-img--light');
            if (darkImg && lightImg) {
                if (newTheme === 'dark') {
                    darkImg.setAttribute('aria-hidden', 'false');
                    lightImg.setAttribute('aria-hidden', 'true');
                } else {
                    darkImg.setAttribute('aria-hidden', 'true');
                    lightImg.setAttribute('aria-hidden', 'false');
                }
            }

            // Update hero title gradient colors with smooth transition
            updateHeroTitleColors();
        });
    }
    gsap.registerPlugin(SplitText, ScrollTrigger);

    function updateHeroTitleColors() {
        const heroTitle = document.querySelector('.hero__inner h1');
        if (!heroTitle || !heroTitle._rbsplitInstance) return;

        const computedStyle = getComputedStyle(document.documentElement);
        const fgColor = computedStyle.getPropertyValue('--fg').trim();
        const mutedColor = computedStyle.getPropertyValue('--muted').trim();

        const interpolateColor = (color1, color2, factor) => {
            const c1 = parseInt(color1.replace('#', ''), 16);
            const c2 = parseInt(color2.replace('#', ''), 16);

            const r1 = (c1 >> 16) & 0xff;
            const g1 = (c1 >> 8) & 0xff;
            const b1 = c1 & 0xff;

            const r2 = (c2 >> 16) & 0xff;
            const g2 = (c2 >> 8) & 0xff;
            const b2 = c2 & 0xff;

            const r = Math.round(r1 + (r2 - r1) * factor);
            const g = Math.round(g1 + (g2 - g1) * factor);
            const b = Math.round(b1 + (b2 - b1) * factor);

            return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        };

        const totalChars = heroTitle._rbsplitInstance.chars.length;

        // Animate color transition smoothly with GSAP
        heroTitle._rbsplitInstance.chars.forEach((char, index) => {
            const position = index / (totalChars - 1);
            let targetColor;
            if (position <= 0.2) {
                targetColor = fgColor;
            } else {
                const gradientFactor = (position - 0.2) / 0.8;
                targetColor = interpolateColor(fgColor, mutedColor, gradientFactor);
            }

            gsap.to(char, {
                color: targetColor,
                duration: 0.5,
                ease: 'power2.out'
            });
        });
    }

    function initPageAnimations() {
        const heroTitle = document.querySelector('.hero__inner h1');

        const runHeroAnimation = () => {
            if (!heroTitle) return;

            // Cleanup if exists
            if (heroTitle._rbsplitInstance) {
                try { heroTitle._rbsplitInstance.revert(); } catch (e) { }
                heroTitle._rbsplitInstance = null;
            }

            try {
                const splitInstance = new SplitText(heroTitle, {
                    type: 'chars',
                    smartWrap: true,
                    charsClass: 'split-char',
                    reduceWhiteSpace: false,
                    tag: 'span'
                });

                heroTitle._rbsplitInstance = splitInstance;

                // Get CSS variable colors
                const computedStyle = getComputedStyle(document.documentElement);
                const fgColor = computedStyle.getPropertyValue('--fg').trim();
                const mutedColor = computedStyle.getPropertyValue('--muted').trim();

                // Helper to interpolate between two hex colors
                const interpolateColor = (color1, color2, factor) => {
                    const c1 = parseInt(color1.replace('#', ''), 16);
                    const c2 = parseInt(color2.replace('#', ''), 16);

                    const r1 = (c1 >> 16) & 0xff;
                    const g1 = (c1 >> 8) & 0xff;
                    const b1 = c1 & 0xff;

                    const r2 = (c2 >> 16) & 0xff;
                    const g2 = (c2 >> 8) & 0xff;
                    const b2 = c2 & 0xff;

                    const r = Math.round(r1 + (r2 - r1) * factor);
                    const g = Math.round(g1 + (g2 - g1) * factor);
                    const b = Math.round(b1 + (b2 - b1) * factor);

                    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
                };

                // Assign color to each character based on position
                const totalChars = splitInstance.chars.length;
                splitInstance.chars.forEach((char, index) => {
                    const position = index / (totalChars - 1); // 0 to 1
                    let color;
                    if (position <= 0.2) {
                        color = fgColor;
                    } else {
                        const gradientFactor = (position - 0.2) / 0.8;
                        color = interpolateColor(fgColor, mutedColor, gradientFactor);
                    }
                    char.style.color = color;
                });

                // Set initial state
                gsap.set(splitInstance.chars, {
                    opacity: 0,
                    y: 40
                });

                // Animate in
                gsap.to(splitInstance.chars, {
                    duration: 0.6,
                    ease: 'power3.out',
                    opacity: 1,
                    y: 0,
                    stagger: 0.1,
                    willChange: 'transform, opacity',
                    force3D: true
                });
            } catch (error) {
                console.warn('SplitText animation failed:', error);
                // Fallback to visible if animation fails
                gsap.set(heroTitle, { opacity: 1, clearProps: 'all' });
            }
        };

        // Run animation when fonts load or after timeout
        Promise.race([
            document.fonts.ready,
            new Promise(resolve => setTimeout(resolve, 1000))
        ]).then(() => {
            runHeroAnimation();

            // Animate link cards after a short delay
            const linkCards = document.querySelectorAll('.link-card');

            gsap.to(linkCards, {
                autoAlpha: 1,
                y: 0,
                duration: 0.5,
                stagger: 0.1,
                ease: 'power3.out',
                delay: 0.3 // Start shortly after hero animation begins
            });
        });

        // Запускаем scroll анимации
        initScrollAnimations();
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

    window.masonryLayout = function () {
        const container = document.querySelector('.projects-row');
        if (!container) return;

        const items = Array.from(container.children);
        if (items.length === 0) return;

        // Reset styles if mobile
        if (window.innerWidth <= 768) {
            container.style.height = 'auto';
            items.forEach(item => {
                item.style.position = 'relative';
                item.style.top = 'auto';
                item.style.left = 'auto';
                item.style.width = '100%';
            });
            return;
        }

        const gap = 16;
        const containerWidth = container.offsetWidth;
        const itemMinWidth = 280;
        const columns = Math.max(1, Math.floor((containerWidth + gap) / (itemMinWidth + gap)));
        const itemWidth = (containerWidth - (gap * (columns - 1))) / columns;

        const columnHeights = new Array(columns).fill(0);

        items.forEach((item, index) => {
            item.style.width = `${itemWidth}px`;
            item.style.position = 'absolute';

            const column = index % columns;

            item.style.left = `${column * (itemWidth + gap)}px`;
            item.style.top = `${columnHeights[column]}px`;

            columnHeights[column] += item.offsetHeight + gap;
        });

        container.style.height = `${Math.max(...columnHeights)}px`;

        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }
    }

    window.addEventListener('load', window.masonryLayout);
    setTimeout(window.masonryLayout, 500);

    window.masonryLayout();

    // Проверяем, показывать ли entry screen
    const entryScreen = document.getElementById('entry-screen');
    const shouldShowEntry = entryScreen && !entryScreen.classList.contains('hidden');

    if (!shouldShowEntry) {
        // Если entry screen не показывается, запускаем анимации сразу
        initPageAnimations();
    } else {
        // Ждем события от slider (once: true - удаляет listener после первого срабатывания)
        window.addEventListener('entryCompleted', initPageAnimations, { once: true });
    }

    function initScrollAnimations() {
        const projectCards = document.querySelectorAll('.project-card');
        gsap.set(projectCards, { autoAlpha: 0 });

        // Используем более раннюю активацию для мобильных устройств
        const isMobile = window.innerWidth <= 768;
        const startPosition = isMobile ? 'top 105%' : 'top 90%';

        const projectsRow = document.querySelector('.projects-row');
        let revealedCount = 0;

        function markInteractiveIfDone() {
            if (!projectsRow || projectCards.length === 0) return;
            if (revealedCount >= projectCards.length) {
                projectsRow.classList.add('is-interactive');
            }
        }

        ScrollTrigger.batch('.project-card', {
            start: startPosition,
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
            gsap.set(projectCards, { autoAlpha: 1 });
        }

        window.addEventListener('beforeunload', () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        });
    }

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

    if (window.matchMedia('(pointer: fine)').matches) {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        document.body.appendChild(cursor);

        let mouseX = 0;
        let mouseY = 0;
        let cursorX = 0;
        let cursorY = 0;
        let hasMovedMouse = false;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            if (!hasMovedMouse) {
                cursorX = mouseX;
                cursorY = mouseY;
                cursor.classList.add('has-moved');
                hasMovedMouse = true;
            }
        });

        function animate() {
            cursorX += (mouseX - cursorX) * 0.15;
            cursorY += (mouseY - cursorY) * 0.15;

            cursor.style.setProperty('--cursor-x', cursorX + 'px');
            cursor.style.setProperty('--cursor-y', cursorY + 'px');

            requestAnimationFrame(animate);
        }

        animate();

        // Общий список интерактивных элементов для кастомного курсора
        window.INTERACTIVE_ELEMENTS = 'a, button, input, textarea, select, .link-card, .project-card, .theme-toggle, .slide-button-handle';

        document.addEventListener('mouseover', (e) => {
            if (e.target.closest(window.INTERACTIVE_ELEMENTS)) {
                cursor.classList.add('cursor-hover');
            }
        });

        document.addEventListener('mouseout', (e) => {
            // Не убираем hover если идет драг слайдера
            if (document.body.classList.contains('slider-dragging')) {
                return;
            }
            if (e.target.closest(window.INTERACTIVE_ELEMENTS)) {
                cursor.classList.remove('cursor-hover');
            }
        });
    }

});
