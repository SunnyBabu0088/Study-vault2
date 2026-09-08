const MusicProvider = require('./MusicProvider');

const ORIGINALS_CATALOG = [
    {
        trackId: 'sv-orig-1',
        title: 'Alpha Waves Deep Study',
        artist: 'StudyVault Acoustics',
        album: 'Cognitive Boost Vol. 1',
        artworkUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop',
        previewUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
        duration: 165,
        previewDuration: 30,
        genre: 'Focus / Lo-Fi',
        language: 'Instrumental',
        isAvailable: true,
    },
    {
        trackId: 'sv-orig-2',
        title: 'Midnight Coding Flow',
        artist: 'CyberBeat Lab',
        album: 'Terminal Sessions',
        artworkUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop',
        previewUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=lofi-study-112191.mp3',
        duration: 190,
        previewDuration: 30,
        genre: 'Study',
        language: 'Instrumental',
        isAvailable: true,
    },
    {
        trackId: 'sv-orig-3',
        title: 'Peaceful Morning Piano',
        artist: 'Elena Rostova',
        album: 'Serenade of Silence',
        artworkUrl: 'https://images.unsplash.com/photo-1520523839898-507127053d37?w=600&auto=format&fit=crop',
        previewUrl: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_db6591201e.mp3?filename=piano-study-112191.mp3',
        duration: 210,
        previewDuration: 30,
        genre: 'Calm / Classical',
        language: 'Instrumental',
        isAvailable: true,
    },
    {
        trackId: 'sv-orig-4',
        title: 'Synthesizer Momentum',
        artist: 'StudyVault Soundworks',
        album: 'High Productivity State',
        artworkUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop',
        previewUrl: 'https://cdn.pixabay.com/download/audio/2022/02/10/audio_b282d8c361.mp3?filename=synth-focus-112191.mp3',
        duration: 170,
        previewDuration: 30,
        genre: 'Motivation',
        language: 'Instrumental',
        isAvailable: true,
    },
];

class StudyVaultOriginalsProvider extends MusicProvider {
    constructor() {
        super('originals');
    }

    async searchTracks({ query = '', category = '', language = '', limit = 25 }) {
        let results = ORIGINALS_CATALOG.map((t) => ({ ...t, provider: 'originals' }));

        if (query) {
            const q = query.toLowerCase();
            results = results.filter(
                (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || t.genre.toLowerCase().includes(q)
            );
        }

        if (category && category.toUpperCase() !== 'ALL' && category.toUpperCase() !== 'ORIGINALS') {
            const cat = category.toLowerCase();
            results = results.filter((t) => t.genre.toLowerCase().includes(cat));
        }

        return {
            tracks: results.slice(0, limit),
            total: results.length,
            hasMore: false,
            provider: 'originals',
        };
    }

    async getTrack(trackId) {
        const found = ORIGINALS_CATALOG.find((t) => t.trackId === trackId);
        return found ? { ...found, provider: 'originals' } : null;
    }

    async getCategories() {
        return ['STUDY', 'FOCUS', 'CALM', 'MOTIVATION', 'INSTRUMENTAL'];
    }

    async getTrending({ limit = 25 } = {}) {
        return {
            tracks: ORIGINALS_CATALOG.map((t) => ({ ...t, provider: 'originals' })).slice(0, limit),
            total: ORIGINALS_CATALOG.length,
            hasMore: false,
            provider: 'originals',
        };
    }

    async getPreview(trackId) {
        const track = await this.getTrack(trackId);
        return {
            previewUrl: track ? track.previewUrl : null,
            duration: 30,
            available: Boolean(track),
        };
    }

    async checkAvailability() {
        return true;
    }
}

module.exports = StudyVaultOriginalsProvider;
