const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const env = require('../config/env');
const moderationService = require('./moderationService');

const getStories = async (userId) => {
  const storiesRes = await pool.query(
    `SELECT 
      s.id,
      s.user_id,
      s.content,
      s.media_url,
      s.media_type,
      s.background,
      s.moderation_status,
      s.created_at,
      u.username as name,
      u.avatar_url,
      EXISTS(SELECT 1 FROM story_reactions sr WHERE sr.story_id = s.id AND sr.user_id = $1) as reacted,
      (SELECT COUNT(*)::int FROM story_reactions sr WHERE sr.story_id = s.id) as reaction_count,
      CASE WHEN sm.id IS NOT NULL THEN json_build_object(
        'provider', sm.provider,
        'trackId', sm.track_id,
        'title', sm.title,
        'artist', sm.artist,
        'album', sm.album,
        'artworkUrl', sm.artwork_url,
        'previewUrl', sm.preview_url,
        'startTime', sm.start_time,
        'endTime', sm.end_time,
        'duration', sm.duration
      ) ELSE NULL END as music
     FROM stories s
     JOIN users u ON s.user_id = u.id
     LEFT JOIN story_music sm ON sm.story_id = s.id
     WHERE s.expires_at > NOW() 
       AND (s.moderation_status = 'APPROVED' OR s.user_id = $1)
       AND s.user_id NOT IN (SELECT blocked_user_id FROM blocked_users WHERE user_id = $1)
       AND s.user_id NOT IN (SELECT user_id FROM blocked_users WHERE blocked_user_id = $1)
     ORDER BY s.created_at DESC`,
    [userId]
  );

  return storiesRes.rows;
};

const createStory = async (userId, { content, mediaUrl, mediaType, background, music }) => {
  // 1. Check user restriction
  const restriction = await moderationService.checkUserRestriction(userId);
  if (restriction.restricted) throw new Error(restriction.reason);

  // 2. Moderate text
  const textMod = moderationService.moderateText(content || '');
  if (!textMod.allowed || textMod.status === 'REJECTED') {
    await moderationService.recordUserViolation(userId, textMod.reason, textMod.isMinorProtection);
    throw new Error("Upload blocked: This content doesn't meet StudyVault's community guidelines.");
  }

  // 3. Moderate media if present
  let modStatus = textMod.status;
  let modReason = textMod.reason;

  if (mediaUrl) {
    let filePath = mediaUrl;
    const uploadBase = path.resolve(process.cwd(), env.UPLOAD_DIR || 'uploads');
    try {
      if (mediaUrl.includes('/')) {
        const mName = path.basename(new URL(mediaUrl, 'http://localhost:5000').pathname);
        const publicPath = path.join(uploadBase, 'public', mName);
        if (fs.existsSync(publicPath)) filePath = publicPath;
        else filePath = path.join(uploadBase, mName);
      }
    } catch (e) {}

    const mediaMod = (mediaType && mediaType.startsWith('video'))
      ? await moderationService.moderateVideo(filePath)
      : await moderationService.moderateImage(filePath);

    if (!mediaMod.allowed || mediaMod.status === 'REJECTED') {
      await moderationService.recordUserViolation(userId, mediaMod.reason, mediaMod.isMinorProtection);
      throw new Error("Upload blocked: This content doesn't meet StudyVault's community guidelines.");
    }
    if (mediaMod.status === 'REVIEW') {
      modStatus = 'REVIEW';
      modReason = mediaMod.reason;
    }
  }

  const res = await pool.query(
    `INSERT INTO stories (user_id, content, media_url, media_type, background, moderation_status, moderation_reason, moderated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING *`,
    [userId, content || '', mediaUrl || null, mediaType || 'image', background || null, modStatus, modReason || null]
  );
  const story = res.rows[0];

  // 4. Save Story Music if attached
  if (music && (music.trackId || music.title)) {
    try {
      await pool.query(
        `INSERT INTO story_music (story_id, provider, track_id, title, artist, album, artwork_url, preview_url, start_time, end_time, duration, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
         ON CONFLICT (story_id) DO NOTHING`,
        [
          story.id,
          music.provider || 'itunes',
          String(music.trackId || 'track-1'),
          music.title,
          music.artist || 'Unknown Artist',
          music.album || '',
          music.artworkUrl || null,
          music.previewUrl || null,
          Number(music.startTime) || 0,
          Number(music.endTime) || 15,
          Number(music.duration) || 30,
        ]
      );

      // Record in user's recently used tracks
      await pool.query(
        `INSERT INTO user_music_recent (user_id, provider, track_id, title, artist, artwork_url, preview_url, used_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (user_id, provider, track_id)
         DO UPDATE SET used_at = NOW(), preview_url = EXCLUDED.preview_url`,
        [
          userId,
          music.provider || 'itunes',
          String(music.trackId || 'track-1'),
          music.title,
          music.artist || 'Unknown Artist',
          music.artworkUrl || null,
          music.previewUrl || null,
        ]
      );
    } catch (musicErr) {
      console.error('[StoryService] Error saving story music:', musicErr.message);
    }
  }

  return story;
};

const reactToStory = async (userId, storyId, reactionType = 'heart') => {
  const existing = await pool.query(
    `SELECT id FROM story_reactions WHERE story_id = $1 AND user_id = $2`,
    [storyId, userId]
  );

  if (existing.rows.length > 0) {
    await pool.query(
      `DELETE FROM story_reactions WHERE story_id = $1 AND user_id = $2`,
      [storyId, userId]
    );
    return { reacted: false };
  } else {
    await pool.query(
      `INSERT INTO story_reactions (story_id, user_id, reaction_type) VALUES ($1, $2, $3)`,
      [storyId, userId, reactionType]
    );
    return { reacted: true };
  }
};

const replyToStory = async (senderId, storyId, message) => {
  const textMod = moderationService.moderateText(message);
  if (!textMod.allowed || textMod.status === 'REJECTED') {
    throw new Error("Reply blocked: This content doesn't meet StudyVault's community guidelines.");
  }

  const replyRes = await pool.query(
    `INSERT INTO story_replies (story_id, sender_id, message)
     VALUES ($1, $2, $3)
     RETURNING id, story_id, sender_id, message, created_at`,
    [storyId, senderId, message]
  );

  const storyRes = await pool.query(
    `SELECT user_id, content FROM stories WHERE id = $1`,
    [storyId]
  );

  if (storyRes.rows.length > 0) {
    const authorId = storyRes.rows[0].user_id;
    let convRes = await pool.query(
      `SELECT cm1.conversation_id 
       FROM conversation_members cm1 
       JOIN conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id 
       WHERE cm1.user_id = $1 AND cm2.user_id = $2`,
      [senderId, authorId]
    );

    let conversationId;
    if (convRes.rows.length === 0) {
      const newConv = await pool.query(`INSERT INTO conversations DEFAULT VALUES RETURNING id`);
      conversationId = newConv.rows[0].id;
      await pool.query(`INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`, [conversationId, senderId, authorId]);
    } else {
      conversationId = convRes.rows[0].conversation_id;
    }

    await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)`,
      [conversationId, senderId, `Replied to story: "${message}"`]
    );
  }

  return replyRes.rows[0];
};

const viewStory = async (userId, storyId) => {
  await pool.query(
    `INSERT INTO story_views (story_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [storyId, userId]
  );
  return { success: true };
};

const deleteStory = async (userId, storyId) => {
  const res = await pool.query(
    `DELETE FROM stories WHERE id = $1 AND user_id = $2 RETURNING id`,
    [storyId, userId]
  );
  return res.rows[0] || null;
};

const getStoryActivity = async (userId) => {
  const reactionsRes = await pool.query(
    `SELECT sr.id, sr.created_at, 'reaction' as type, u.username as seed,
            CONCAT(u.username, ' reacted to your story') as text,
            s.content as story_content
     FROM story_reactions sr
     JOIN stories s ON s.id = sr.story_id
     JOIN users u ON u.id = sr.user_id
     WHERE s.user_id = $1
     ORDER BY sr.created_at DESC
     LIMIT 20`,
    [userId]
  );

  const viewsRes = await pool.query(
    `SELECT sv.id, sv.viewed_at as created_at, 'view' as type, u.username as seed,
            CONCAT(u.username, ' viewed your story') as text,
            s.content as story_content
     FROM story_views sv
     JOIN stories s ON s.id = sv.story_id
     JOIN users u ON u.id = sv.user_id
     WHERE s.user_id = $1 AND sv.user_id != $1
     ORDER BY sv.viewed_at DESC
     LIMIT 20`,
    [userId]
  );

  const repliesRes = await pool.query(
    `SELECT sr.id, sr.created_at, 'reply' as type, u.username as seed,
            CONCAT(u.username, ' replied: "', sr.message, '"') as text,
            s.content as story_content
     FROM story_replies sr
     JOIN stories s ON s.id = sr.story_id
     JOIN users u ON u.id = sr.sender_id
     WHERE s.user_id = $1
     ORDER BY sr.created_at DESC
     LIMIT 20`,
    [userId]
  );

  const combined = [...reactionsRes.rows, ...viewsRes.rows, ...repliesRes.rows].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return combined;
};

module.exports = {
  getStories,
  reactToStory,
  replyToStory,
  viewStory,
  createStory,
  deleteStory,
  getStoryActivity,
};
