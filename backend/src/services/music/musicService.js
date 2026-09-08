const { pool } = require('../../config/database');
const ITunesMusicProvider = require('./ITunesMusicProvider');
const StudyVaultOriginalsProvider = require('./StudyVaultOriginalsProvider');

class MusicService {
    constructor() {
        this.providers = {
            itunes: new ITunesMusicProvider(),
            originals: new StudyVaultOriginalsProvider(),
        };
        this.defaultProvider = 'itunes';
    }

    getProvider(name) {
        return this.providers[name] || this.providers[this.defaultProvider];
    }

    /**
     * Search tracks with fallback to cache
     */
    async searchTracks({ query = '', category = '', language = '', provider = 'itunes', limit = 25, page = 1 }) {
        const activeProvider = this.getProvider(provider);
        const result = await activeProvider.searchTracks({ query, category, language, limit, page });

        // Cache fetched tracks asynchronously in database
        if (result.tracks && result.tracks.length > 0) {
            this._cacheTracks(result.tracks).catch((err) => {
                console.error('[MusicService] Cache save error:', err.message);
            });
        }

        return result;
    }

    async _cacheTracks(tracks) {
        for (const t of tracks) {
            if (!t.trackId || !t.title) continue;
            await pool.query(
                `INSERT INTO music_catalog_cache (provider, provider_track_id, title, artist, album, artwork_url, language, genre, duration, preview_url, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
                 ON CONFLICT (provider, provider_track_id)
                 DO UPDATE SET
                     title = EXCLUDED.title,
                     artist = EXCLUDED.artist,
                     album = EXCLUDED.album,
                     artwork_url = EXCLUDED.artwork_url,
                     preview_url = EXCLUDED.preview_url,
                     updated_at = NOW()`,
                [
                    t.provider || 'itunes',
                    String(t.trackId),
                    t.title,
                    t.artist,
                    t.album || '',
                    t.artworkUrl || '',
                    t.language || '',
                    t.genre || '',
                    t.duration || 30,
                    t.previewUrl || null,
                ]
            );
        }
    }

    async getTrack(provider, trackId) {
        const activeProvider = this.getProvider(provider);
        const track = await activeProvider.getTrack(trackId);
        if (track) return track;

        // Fallback to cache if provider lookup fails
        const res = await pool.query(
            `SELECT * FROM music_catalog_cache WHERE provider = $1 AND provider_track_id = $2`,
            [provider || 'itunes', String(trackId)]
        );
        if (res.rows.length > 0) {
            const r = res.rows[0];
            return {
                provider: r.provider,
                trackId: r.provider_track_id,
                title: r.title,
                artist: r.artist,
                album: r.album,
                artworkUrl: r.artwork_url,
                previewUrl: r.preview_url,
                duration: r.duration,
                previewDuration: 30,
                genre: r.genre,
                language: r.language,
                isAvailable: Boolean(r.preview_url),
            };
        }
        return null;
    }

    async getCategories() {
        return [
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
            'ORIGINALS',
        ];
    }

    async getLanguages() {
        return [
            'All Languages',
            'English',
            'Telugu',
            'Hindi',
            'Tamil',
            'Kannada',
            'Malayalam',
            'Bengali',
            'Marathi',
            'Punjabi',
            'Urdu',
            'Korean',
            'Japanese',
            'Spanish',
            'French',
            'German',
            'Arabic',
            'Portuguese',
        ];
    }

    async getTrending({ language = '', limit = 25 } = {}) {
        return this.searchTracks({ query: '', category: 'TRENDING', language, limit });
    }

    /**
     * User Favorites Management
     */
    async getUserFavorites(userId) {
        const res = await pool.query(
            `SELECT provider, track_id, title, artist, artwork_url, preview_url, created_at
             FROM user_music_favorites
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );
        return res.rows.map((r) => ({
            provider: r.provider,
            trackId: r.track_id,
            title: r.title,
            artist: r.artist,
            artworkUrl: r.artwork_url,
            previewUrl: r.preview_url,
            isFavorite: true,
            isAvailable: Boolean(r.preview_url),
        }));
    }

    async toggleFavorite(userId, { provider = 'itunes', trackId, title, artist, artworkUrl, previewUrl }) {
        const existing = await pool.query(
            `SELECT id FROM user_music_favorites WHERE user_id = $1 AND provider = $2 AND track_id = $3`,
            [userId, provider, String(trackId)]
        );

        if (existing.rows.length > 0) {
            await pool.query(
                `DELETE FROM user_music_favorites WHERE user_id = $1 AND provider = $2 AND track_id = $3`,
                [userId, provider, String(trackId)]
            );
            return { isFavorite: false };
        } else {
            await pool.query(
                `INSERT INTO user_music_favorites (user_id, provider, track_id, title, artist, artwork_url, preview_url, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
                [userId, provider, String(trackId), title, artist, artworkUrl || null, previewUrl || null]
            );
            return { isFavorite: true };
        }
    }

    /**
     * User Recently Used Tracks
     */
    async getUserRecent(userId, limit = 20) {
        const res = await pool.query(
            `SELECT provider, track_id, title, artist, artwork_url, preview_url, used_at
             FROM user_music_recent
             WHERE user_id = $1
             ORDER BY used_at DESC
             LIMIT $2`,
            [userId, limit]
        );
        return res.rows.map((r) => ({
            provider: r.provider,
            trackId: r.track_id,
            title: r.title,
            artist: r.artist,
            artworkUrl: r.artwork_url,
            previewUrl: r.preview_url,
            usedAt: r.used_at,
            isAvailable: Boolean(r.preview_url),
        }));
    }

    async recordRecentTrack(userId, { provider = 'itunes', trackId, title, artist, artworkUrl, previewUrl }) {
        await pool.query(
            `INSERT INTO user_music_recent (user_id, provider, track_id, title, artist, artwork_url, preview_url, used_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
             ON CONFLICT (user_id, provider, track_id)
             DO UPDATE SET used_at = NOW(), preview_url = EXCLUDED.preview_url`,
            [userId, provider, String(trackId), title, artist, artworkUrl || null, previewUrl || null]
        );
    }

    /**
     * Admin Settings Management
     */
    async getProviderSettings() {
        const res = await pool.query(`SELECT provider, is_enabled, allowed_regions, updated_at FROM music_provider_settings`);
        return res.rows;
    }

    async updateProviderSettings(provider, { is_enabled, allowed_regions, api_key }) {
        const res = await pool.query(
            `INSERT INTO music_provider_settings (provider, is_enabled, allowed_regions, api_key, updated_at)
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT (provider)
             DO UPDATE SET
                 is_enabled = COALESCE($2, music_provider_settings.is_enabled),
                 allowed_regions = COALESCE($3, music_provider_settings.allowed_regions),
                 api_key = COALESCE($4, music_provider_settings.api_key),
                 updated_at = NOW()
             RETURNING provider, is_enabled, allowed_regions, updated_at`,
            [provider, is_enabled ?? true, allowed_regions || ['ALL'], api_key || null]
        );
        return res.rows[0];
    }
}

module.exports = new MusicService();
