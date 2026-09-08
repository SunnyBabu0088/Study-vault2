const { pool } = require('./database');

const initializeSchema = async () => {
    const statements = [
        `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
        `CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            username VARCHAR(30) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            phone VARCHAR(40),
            roll_number VARCHAR(50),
            avatar_url TEXT,
            streak_count INT NOT NULL DEFAULT 0,
            last_chat_date DATE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_count INT NOT NULL DEFAULT 0;`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_chat_date DATE;`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;`,
        `CREATE TABLE IF NOT EXISTS close_friends (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(user_id, friend_id)
        );`,
        `CREATE TABLE IF NOT EXISTS blocked_users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(user_id, blocked_user_id)
        );`,
        `CREATE TABLE IF NOT EXISTS user_sessions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            refresh_token_hash TEXT NOT NULL,
            user_agent TEXT,
            ip_address INET,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            revoked_at TIMESTAMPTZ
        );`,
        `CREATE TABLE IF NOT EXISTS notes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            theme TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS study_tasks (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            subject TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            priority VARCHAR(10) NOT NULL,
            due_date DATE,
            completed BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS conversations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS conversation_members (
            conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (conversation_id, user_id)
        );`,
        `CREATE TABLE IF NOT EXISTS messages (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            read_at TIMESTAMPTZ
        );`,
        `CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_id);`,
        `CREATE INDEX IF NOT EXISTS conversation_members_user_idx ON conversation_members(user_id);`,
        `CREATE TABLE IF NOT EXISTS startup_posts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            hashtags TEXT,
            visibility VARCHAR(20) NOT NULL DEFAULT 'public',
            scheduled_date TIMESTAMPTZ,
            media_url TEXT,
            media_type VARCHAR(20),
            category VARCHAR(30) NOT NULL DEFAULT 'startup',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS post_likes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            post_id UUID NOT NULL REFERENCES startup_posts(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (post_id, user_id)
        );`,
        `CREATE TABLE IF NOT EXISTS post_saves (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            post_id UUID NOT NULL REFERENCES startup_posts(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (post_id, user_id)
        );`,
        `CREATE TABLE IF NOT EXISTS post_suggestions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            post_id UUID NOT NULL REFERENCES startup_posts(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS uploads (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            original_name TEXT NOT NULL,
            stored_name TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            size_bytes BIGINT NOT NULL,
            bucket TEXT NOT NULL,
            object_key TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS stories (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            media_url TEXT,
            media_type VARCHAR(20) DEFAULT 'image',
            content TEXT NOT NULL,
            background VARCHAR(100),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
        );`,
        `CREATE TABLE IF NOT EXISTS story_views (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (story_id, user_id)
        );`,
        `CREATE TABLE IF NOT EXISTS story_reactions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            reaction_type VARCHAR(20) DEFAULT 'heart',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (story_id, user_id)
        );`,
        `CREATE TABLE IF NOT EXISTS story_replies (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
            sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            message TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS highlights (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(50) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS highlight_stories (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
            story_id TEXT NOT NULL,
            position INT NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (highlight_id, story_id)
        );`,
        `CREATE TABLE IF NOT EXISTS memories (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(50) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS memory_stories (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
            story_id TEXT NOT NULL,
            position INT NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (memory_id, story_id)
        );`,
        `DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'highlights') THEN
                INSERT INTO memories (id, user_id, name, created_at, updated_at)
                SELECT id, user_id, name, created_at, updated_at FROM highlights
                ON CONFLICT (id) DO NOTHING;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'highlight_stories') THEN
                INSERT INTO memory_stories (id, memory_id, story_id, position, created_at)
                SELECT id, highlight_id, story_id, position, created_at FROM highlight_stories
                ON CONFLICT (memory_id, story_id) DO NOTHING;
            END IF;
        END $$;`,
        `CREATE TABLE IF NOT EXISTS user_settings (
            user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            settings JSONB NOT NULL DEFAULT '{}',
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS conversation_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            theme_id VARCHAR(50) DEFAULT 'minimalist',
            nickname VARCHAR(100),
            muted_until TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (conversation_id, user_id)
        );`,
        `CREATE TABLE IF NOT EXISTS call_sessions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            caller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
            call_type VARCHAR(20) NOT NULL DEFAULT 'audio',
            status VARCHAR(20) NOT NULL DEFAULT 'initiated',
            started_at TIMESTAMPTZ,
            ended_at TIMESTAMPTZ,
            duration_seconds INT DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            payload JSONB DEFAULT '{}',
            read_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS cleared_conversations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            cleared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (conversation_id, user_id)
        );`,
        `CREATE TABLE IF NOT EXISTS subjects (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL,
            code VARCHAR(20),
            color VARCHAR(30) DEFAULT '#3b52cf',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS study_materials (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            topic TEXT,
            material_type VARCHAR(30) NOT NULL,
            content_url TEXT,
            thumbnail_url TEXT,
            duration_seconds INT DEFAULT 0,
            description TEXT,
            difficulty VARCHAR(20) DEFAULT 'Medium',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS study_sessions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
            material_id UUID REFERENCES study_materials(id) ON DELETE SET NULL,
            activity_type VARCHAR(30) NOT NULL,
            started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            ended_at TIMESTAMPTZ,
            duration_seconds INT DEFAULT 0,
            status VARCHAR(20) DEFAULT 'active',
            last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS material_progress (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            material_id UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
            last_position_seconds INT DEFAULT 0,
            watched_seconds INT DEFAULT 0,
            progress_percentage INT DEFAULT 0,
            completed BOOLEAN DEFAULT false,
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE (user_id, material_id)
        );`,
        `CREATE TABLE IF NOT EXISTS quizzes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            subject_name VARCHAR(100) NOT NULL,
            quiz_date DATE NOT NULL DEFAULT CURRENT_DATE,
            level INT DEFAULT 1,
            xp_reward INT DEFAULT 100,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS quiz_questions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
            question TEXT NOT NULL,
            option_a TEXT NOT NULL,
            option_b TEXT NOT NULL,
            option_c TEXT NOT NULL,
            option_d TEXT NOT NULL,
            correct_answer VARCHAR(1) NOT NULL,
            explanation TEXT
        );`,
        `CREATE TABLE IF NOT EXISTS quiz_attempts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
            score INT DEFAULT 0,
            total_questions INT DEFAULT 0,
            xp_earned INT DEFAULT 0,
            completed_at TIMESTAMPTZ DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS quiz_level_progress (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            level INT NOT NULL,
            completed_at TIMESTAMPTZ DEFAULT NOW(),
            unlocks_at TIMESTAMPTZ NOT NULL,
            status VARCHAR(20) DEFAULT 'completed',
            UNIQUE (user_id, level)
        );`,
        `CREATE TABLE IF NOT EXISTS user_xp (
            user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            total_xp INT DEFAULT 0,
            quiz_streak INT DEFAULT 0,
            last_quiz_date DATE,
            current_level INT DEFAULT 1
        );`,
        `CREATE TABLE IF NOT EXISTS friends (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status VARCHAR(20) DEFAULT 'accepted',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE (user_id, friend_id)
        );`,
        `CREATE TABLE IF NOT EXISTS friend_requests (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE (sender_id, receiver_id)
        );`,
        `CREATE TABLE IF NOT EXISTS message_reactions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            reaction VARCHAR(20) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE (message_id, user_id)
        );`,
        `CREATE TABLE IF NOT EXISTS password_resets (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS reels (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            video_url TEXT NOT NULL,
            cover_url TEXT,
            caption TEXT,
            hashtags TEXT,
            visibility VARCHAR(20) NOT NULL DEFAULT 'public',
            views_count INT DEFAULT 0,
            is_demo BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `ALTER TABLE reels ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;`,
        `CREATE TABLE IF NOT EXISTS reel_likes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            reel_id UUID NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (reel_id, user_id)
        );`,
        `CREATE TABLE IF NOT EXISTS reel_comments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            reel_id UUID NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS reel_saves (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            reel_id UUID NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (reel_id, user_id)
        );`,
        `CREATE TABLE IF NOT EXISTS reel_shares (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            reel_id UUID NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS reel_views (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            reel_id UUID NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            watched_seconds INT DEFAULT 0,
            completion_percentage INT DEFAULT 0,
            completed BOOLEAN DEFAULT false,
            replayed BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (reel_id, user_id)
        );`,
        `ALTER TABLE reel_views ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW();`,
        `ALTER TABLE reel_views ADD COLUMN IF NOT EXISTS watched_seconds INT DEFAULT 0;`,
        `ALTER TABLE reel_views ADD COLUMN IF NOT EXISTS completion_percentage INT DEFAULT 0;`,
        `ALTER TABLE reel_views ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;`,
        `ALTER TABLE reel_views ADD COLUMN IF NOT EXISTS replayed BOOLEAN DEFAULT false;`,
        `CREATE TABLE IF NOT EXISTS user_interests (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            topic VARCHAR(100) NOT NULL,
            score FLOAT NOT NULL DEFAULT 1.0,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (user_id, topic)
        );`,
        `CREATE TABLE IF NOT EXISTS creator_follows (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (user_id, creator_id)
        );`,
        `CREATE TABLE IF NOT EXISTS post_comments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            post_id UUID NOT NULL REFERENCES startup_posts(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS post_shares (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            post_id UUID NOT NULL REFERENCES startup_posts(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `ALTER TABLE startup_posts ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) NOT NULL DEFAULT 'APPROVED';`,
        `ALTER TABLE startup_posts ADD COLUMN IF NOT EXISTS moderation_reason TEXT;`,
        `ALTER TABLE startup_posts ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;`,
        `ALTER TABLE reels ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) NOT NULL DEFAULT 'APPROVED';`,
        `ALTER TABLE reels ADD COLUMN IF NOT EXISTS moderation_reason TEXT;`,
        `ALTER TABLE reels ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;`,
        `ALTER TABLE stories ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) NOT NULL DEFAULT 'APPROVED';`,
        `ALTER TABLE stories ADD COLUMN IF NOT EXISTS moderation_reason TEXT;`,
        `ALTER TABLE stories ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_moderation_status VARCHAR(20) NOT NULL DEFAULT 'APPROVED';`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_moderation_reason TEXT;`,
        `ALTER TABLE uploads ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) NOT NULL DEFAULT 'APPROVED';`,
        `ALTER TABLE uploads ADD COLUMN IF NOT EXISTS moderation_reason TEXT;`,
        `ALTER TABLE uploads ADD COLUMN IF NOT EXISTS is_quarantine BOOLEAN NOT NULL DEFAULT false;`,
        `ALTER TABLE uploads ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;`,
        `ALTER TABLE messages ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) NOT NULL DEFAULT 'APPROVED';`,
        `ALTER TABLE messages ADD COLUMN IF NOT EXISTS moderation_reason TEXT;`,
        `CREATE TABLE IF NOT EXISTS reports (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            entity_type VARCHAR(30) NOT NULL,
            entity_id UUID NOT NULL,
            reason VARCHAR(50) NOT NULL,
            description TEXT,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS content_moderation_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            entity_type VARCHAR(30) NOT NULL,
            entity_id UUID,
            media_url TEXT,
            status VARCHAR(20) NOT NULL,
            reason TEXT,
            confidence FLOAT DEFAULT 1.0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS user_moderation_strikes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
            strike_count INT NOT NULL DEFAULT 0,
            last_violation_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            restriction_until TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS ai_conversations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            mode VARCHAR(30) NOT NULL DEFAULT 'AI',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS ai_messages (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role VARCHAR(20) NOT NULL,
            content TEXT NOT NULL,
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS ai_generated_images (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            prompt TEXT NOT NULL,
            image_url TEXT NOT NULL,
            aspect_ratio VARCHAR(20) DEFAULT '1:1',
            style VARCHAR(30) DEFAULT 'Cinematic',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS ai_quizzes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            topic TEXT NOT NULL,
            score INT NOT NULL,
            total_questions INT NOT NULL,
            difficulty VARCHAR(20) NOT NULL DEFAULT 'Medium',
            weak_areas TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS music_catalog_cache (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            provider VARCHAR(50) NOT NULL,
            provider_track_id VARCHAR(100) NOT NULL,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            album TEXT,
            artwork_url TEXT,
            language VARCHAR(50),
            genre VARCHAR(100),
            duration INT NOT NULL DEFAULT 30,
            preview_url TEXT,
            region_availability TEXT[] DEFAULT ARRAY['ALL'],
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(provider, provider_track_id)
        );`,
        `CREATE TABLE IF NOT EXISTS story_music (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
            provider VARCHAR(50) NOT NULL,
            track_id VARCHAR(100) NOT NULL,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            album TEXT,
            artwork_url TEXT,
            preview_url TEXT,
            start_time NUMERIC(5,2) DEFAULT 0,
            end_time NUMERIC(5,2) DEFAULT 15,
            duration INT DEFAULT 30,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(story_id)
        );`,
        `CREATE TABLE IF NOT EXISTS user_music_favorites (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            provider VARCHAR(50) NOT NULL,
            track_id VARCHAR(100) NOT NULL,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            artwork_url TEXT,
            preview_url TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(user_id, provider, track_id)
        );`,
        `CREATE TABLE IF NOT EXISTS user_music_recent (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            provider VARCHAR(50) NOT NULL,
            track_id VARCHAR(100) NOT NULL,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            artwork_url TEXT,
            preview_url TEXT,
            used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(user_id, provider, track_id)
        );`,
        `CREATE TABLE IF NOT EXISTS music_provider_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            provider VARCHAR(50) NOT NULL UNIQUE,
            is_enabled BOOLEAN NOT NULL DEFAULT true,
            api_key TEXT,
            allowed_regions TEXT[] DEFAULT ARRAY['ALL'],
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`
    ];

    for (const statement of statements) {
        try {
            await pool.query(statement);
        } catch (err) {
            // Log individual statement notice/warning without halting the remaining table initializations
            console.log(`[Schema Init] Statement notice: ${err.message}`);
        }
    }
};

module.exports = { initializeSchema };
