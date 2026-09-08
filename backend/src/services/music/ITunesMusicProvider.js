const MusicProvider = require('./MusicProvider');

const COUNTRY_LANGUAGE_MAP = {
    telugu: 'IN',
    hindi: 'IN',
    tamil: 'IN',
    kannada: 'IN',
    malayalam: 'IN',
    bengali: 'IN',
    punjabi: 'IN',
    urdu: 'IN',
    korean: 'KR',
    japanese: 'JP',
    spanish: 'US',
    french: 'FR',
    german: 'DE',
    arabic: 'AE',
    portuguese: 'BR',
    english: 'US',
};

const WORLDWIDE_CATEGORIES = [
    'TRENDING',
    'POPULAR',
    'NEW RELEASES',
    'STUDY',
    'FOCUS',
    'MOTIVATION',
    'CALM',
    'INSTRUMENTAL',
    'WORKOUT',
    'CHILL',
    'LOFI',
    'CHRISTIAN',
    'GOSPEL',
    'WORSHIP',
    'DEVOTIONAL',
    'ROMANTIC',
    'PARTY',
    'CLASSICAL',
];

const CATEGORY_SEARCH_HINTS = {
    TRENDING: 'Top Hits',
    POPULAR: 'Billboard',
    'NEW RELEASES': 'New Music',
    STUDY: 'Study Beats Lo-Fi',
    FOCUS: 'Deep Focus Ambient',
    MOTIVATION: 'Workout Motivation',
    CALM: 'Peaceful Calm Piano',
    INSTRUMENTAL: 'Acoustic Instrumental',
    WORKOUT: 'EDM Gym Workout',
    CHILL: 'Chillout Vibes',
    LOFI: 'Lofi Hip Hop Chill',
    CHRISTIAN: 'Contemporary Christian Music',
    GOSPEL: 'Gospel Worship',
    WORSHIP: 'Praise and Worship Songs',
    DEVOTIONAL: 'Devotional Songs',
    ROMANTIC: 'Love Songs Romantic',
    PARTY: 'Dance Party Hits',
    CLASSICAL: 'Classical Masterpieces',
};

class ITunesMusicProvider extends MusicProvider {
    constructor() {
        super('itunes');
        this.baseUrl = 'https://itunes.apple.com';
    }

    _determineCountry(language, explicitCountry) {
        if (explicitCountry) return explicitCountry.toUpperCase();
        if (language) {
            const langKey = language.toLowerCase().trim();
            if (COUNTRY_LANGUAGE_MAP[langKey]) return COUNTRY_LANGUAGE_MAP[langKey];
        }
        return 'US';
    }

    _normalizeTrack(item, language = null) {
        if (!item || !item.trackId || !item.trackName) return null;

        // Upgrade artwork from 100x100 to 600x600 for sharp mobile rendering
        let artworkUrl = item.artworkUrl100 || item.artworkUrl60 || '';
        if (artworkUrl.includes('100x100bb')) {
            artworkUrl = artworkUrl.replace('100x100bb', '600x600bb');
        }

        const durationSeconds = item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 30;

        return {
            provider: 'itunes',
            trackId: String(item.trackId),
            title: item.trackName,
            artist: item.artistName || 'Unknown Artist',
            album: item.collectionName || item.trackName,
            artworkUrl,
            previewUrl: item.previewUrl || null,
            duration: durationSeconds,
            previewDuration: 30, // Official preview is 30s
            genre: item.primaryGenreName || 'Music',
            language: language || (item.country === 'IND' ? 'Indian' : 'English'),
            isAvailable: Boolean(item.previewUrl),
            releaseDate: item.releaseDate || null,
        };
    }

    async searchTracks({ query = '', category = '', language = '', limit = 25, page = 1 }) {
        try {
            const effectiveLimit = Math.min(Math.max(Number(limit) || 25, 1), 50);
            const country = this._determineCountry(language);

            let terms = [];
            const cleanQuery = String(query || '').trim();
            const cleanCategory = String(category || '').trim().toUpperCase();
            const cleanLanguage = String(language || '').trim();

            if (cleanQuery) {
                terms.push(cleanQuery);
            } else if (cleanCategory && CATEGORY_SEARCH_HINTS[cleanCategory]) {
                terms.push(CATEGORY_SEARCH_HINTS[cleanCategory]);
            } else {
                terms.push('Top Hits 2026');
            }

            if (cleanLanguage && cleanLanguage.toLowerCase() !== 'all' && cleanLanguage.toLowerCase() !== 'all languages') {
                terms.push(cleanLanguage);
            }

            const searchTerm = encodeURIComponent(terms.join(' '));
            const url = `${this.baseUrl}/search?term=${searchTerm}&media=music&entity=song&limit=${effectiveLimit}&country=${country}`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'StudyVault-Mobile/1.0',
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`iTunes Search API error: HTTP ${response.status}`);
            }

            const data = await response.json();
            const rawResults = Array.isArray(data.results) ? data.results : [];

            // Filter for songs with valid playable preview URLs
            const tracks = rawResults
                .map((item) => this._normalizeTrack(item, cleanLanguage))
                .filter((t) => t && t.previewUrl);

            return {
                tracks,
                total: data.resultCount || tracks.length,
                hasMore: rawResults.length >= effectiveLimit,
                provider: 'itunes',
            };
        } catch (error) {
            console.error('[ITunesMusicProvider] search error:', error.message);
            return { tracks: [], total: 0, hasMore: false, error: error.message };
        }
    }

    async getTrack(trackId) {
        try {
            const url = `${this.baseUrl}/lookup?id=${encodeURIComponent(trackId)}&entity=song`;
            const response = await fetch(url, {
                headers: { 'User-Agent': 'StudyVault-Mobile/1.0', 'Accept': 'application/json' },
            });

            if (!response.ok) return null;
            const data = await response.json();
            if (!data.results || data.results.length === 0) return null;

            return this._normalizeTrack(data.results[0]);
        } catch (error) {
            console.error('[ITunesMusicProvider] lookup error:', error.message);
            return null;
        }
    }

    async getCategories() {
        return WORLDWIDE_CATEGORIES;
    }

    async getTrending({ limit = 25, language = '' } = {}) {
        return this.searchTracks({ query: '', category: 'TRENDING', language, limit });
    }

    async getPreview(trackId) {
        const track = await this.getTrack(trackId);
        if (!track || !track.previewUrl) {
            return { previewUrl: null, duration: 0, available: false };
        }
        return {
            previewUrl: track.previewUrl,
            duration: 30,
            available: true,
        };
    }

    async checkAvailability(trackId, countryCode = 'US') {
        const track = await this.getTrack(trackId);
        return Boolean(track && track.previewUrl);
    }
}

module.exports = ITunesMusicProvider;
