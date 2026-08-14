const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_URL = 'https://api.spotify.com/v1/me/player/currently-playing';
const RECENT_URL = 'https://api.spotify.com/v1/me/player/recently-played?limit=1';

export default {
    async fetch(request, env) {
        const origin = env.CORS_ORIGIN || '*';

        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders(origin),
            });
        }

        if (request.method !== 'GET') {
            return jsonResponse({ error: 'method not allowed' }, 405, origin);
        }

        try {
            const token = await getAccessToken(env);

            const nowRes = await fetch(NOW_PLAYING_URL, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (nowRes.status === 200) {
                const data = await nowRes.json();
                if (data && data.item) {
                    return jsonResponse(
                        buildPayload(data.item, !!data.is_playing, null, data.progress_ms),
                        200,
                        origin
                    );
                }
            }

            const recentRes = await fetch(RECENT_URL, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!recentRes.ok) {
                return jsonResponse({ isPlaying: false, track: null }, 200, origin);
            }

            const recent = await recentRes.json();
            const entry = recent.items && recent.items[0];
            if (!entry || !entry.track) {
                return jsonResponse({ isPlaying: false, track: null }, 200, origin);
            }

            return jsonResponse(
                buildPayload(entry.track, false, entry.played_at, null),
                200,
                origin
            );
        } catch (err) {
            return jsonResponse(
                { isPlaying: false, track: null, error: String(err && err.message || err) },
                500,
                origin
            );
        }
    },
};

async function getAccessToken(env) {
    const basic = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);
    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: env.SPOTIFY_REFRESH_TOKEN,
    });
    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`token refresh failed: ${res.status} ${text}`);
    }
    const data = await res.json();
    return data.access_token;
}

function buildPayload(item, isPlaying, playedAt, progressMs) {
    return {
        isPlaying,
        playedAt: playedAt || null,
        progressMs: progressMs == null ? null : progressMs,
        durationMs: item.duration_ms || null,
        track: {
            id: item.id,
            name: item.name,
            artists: (item.artists || []).map((a) => a.name).join(', '),
            album: item.album && item.album.name || '',
            albumArt: pickAlbumArt(item.album && item.album.images),
            url: item.external_urls && item.external_urls.spotify || '',
        },
    };
}

function pickAlbumArt(images) {
    if (!images || !images.length) return '';
    const sorted = images.slice().sort((a, b) => (b.width || 0) - (a.width || 0));
    const mid = sorted.find((img) => img.width && img.width <= 320) || sorted[sorted.length - 1];
    return mid.url;
}

function corsHeaders(origin) {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    };
}

function jsonResponse(data, status, origin) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=15, s-maxage=15',
            ...corsHeaders(origin),
        },
    });
}
