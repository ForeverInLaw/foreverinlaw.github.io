window.addEventListener('scroll', e=> {
	document.body.style.cssText += `--scrollTop: ${this.scrollY}px`
})

document.addEventListener('DOMContentLoaded', () => {
    const spotifyWidget = document.getElementById('spotify-now-playing');
    const apiUrl = 'https://spotify-show-last-68db402e666c.herokuapp.com/api/now-playing';

    // Fallback proxies to bypass strict CORS on the API
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
                    try { data = JSON.parse(text); } catch (_) { continue; }
                }
                return data;
            } catch (_) {
                // try next attempt
            }
        }
        return null;
    }

    async function fetchNowPlaying() {
        try {
            const data = await fetchJsonWithFallback(apiUrl);
            if (!data || !data.trackId) {
                spotifyWidget.innerHTML = '';
                spotifyWidget.className = 'not-playing';
                return;
            }

            const spotifyTrackUrl = `https://open.spotify.com/track/${data.trackId}`;
            const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyTrackUrl)}`;
            
            const oembedData = await fetchJsonWithFallback(oembedUrl);

            if (oembedData && oembedData.html) {
                // The oEmbed response contains a self-sufficient iframe.
                // We just need to inject it into our container.
                spotifyWidget.innerHTML = oembedData.html;
                spotifyWidget.className = '';
            } else {
                spotifyWidget.innerHTML = '';
                spotifyWidget.className = 'not-playing';
            }
        } catch (error) {
            console.error('Ошибка при запросе к API:', error);
            spotifyWidget.innerHTML = '';
            spotifyWidget.className = 'not-playing';
        }
    }

    fetchNowPlaying();
    setInterval(fetchNowPlaying, 30000);

}); // Конец 'DOMContentLoaded'
