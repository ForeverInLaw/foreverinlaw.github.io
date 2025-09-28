window.addEventListener('scroll', e=> {
	document.body.style.cssText += `--scrollTop: ${this.scrollY}px`
})

document.addEventListener('DOMContentLoaded', () => {
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
                    try { data = JSON.parse(text); } catch (_) { continue; }
                }
                return data;
            } catch (_) { /* try next attempt */ }
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
                spotifyTitle.textContent = data && data.isPlaying ? 'Now Playing' : 'Last Played';
            }

            if (!data || !data.trackId) {
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

            if (oembedData && oembedData.html) {
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

}); // End of 'DOMContentLoaded'
