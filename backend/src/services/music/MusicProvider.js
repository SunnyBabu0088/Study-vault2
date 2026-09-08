/**
 * Abstract MusicProvider Interface
 * All music providers (iTunes/Apple, Jamendo, StudyVault Originals, etc.) must implement this interface.
 */
class MusicProvider {
    constructor(name) {
        if (new.target === MusicProvider) {
            throw new TypeError('Cannot construct MusicProvider instances directly');
        }
        this.name = name;
    }

    /**
     * Search tracks by keyword, category, and language
     * @param {Object} options
     * @param {string} options.query - search text
     * @param {string} [options.category] - genre or category filter
     * @param {string} [options.language] - language filter
     * @param {number} [options.limit=25] - max results
     * @param {number} [options.page=1] - page number
     * @returns {Promise<{ tracks: Array, total: number, hasMore: boolean }>}
     */
    async searchTracks(options) {
        throw new Error('Method searchTracks() must be implemented');
    }

    /**
     * Get single track by provider track ID
     * @param {string} trackId
     * @returns {Promise<Object|null>}
     */
    async getTrack(trackId) {
        throw new Error('Method getTrack() must be implemented');
    }

    /**
     * Get supported categories and genres
     * @returns {Promise<Array<string>>}
     */
    async getCategories() {
        throw new Error('Method getCategories() must be implemented');
    }

    /**
     * Get trending / popular tracks
     * @param {Object} [options]
     * @returns {Promise<Array>}
     */
    async getTrending(options) {
        throw new Error('Method getTrending() must be implemented');
    }

    /**
     * Get streamable preview URL & validity
     * @param {string} trackId
     * @returns {Promise<{ previewUrl: string, duration: number, available: boolean }>}
     */
    async getPreview(trackId) {
        throw new Error('Method getPreview() must be implemented');
    }

    /**
     * Check track availability in a specific region
     * @param {string} trackId
     * @param {string} countryCode
     * @returns {Promise<boolean>}
     */
    async checkAvailability(trackId, countryCode) {
        return true;
    }
}

module.exports = MusicProvider;
