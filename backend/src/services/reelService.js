const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const env = require('../config/env');
const moderationService = require('./moderationService');

async function createReel(userId, { video_url, cover_url, caption, hashtags, visibility = 'public' }) {
  const normalizedVisibility = (visibility && visibility.toLowerCase() === 'private') ? 'private' : 'public';

  // 1. User restriction check
  const restriction = await moderationService.checkUserRestriction(userId);
  if (restriction.restricted) throw new Error(restriction.reason);

  // 2. Moderate text
  const fullText = `${caption || ''} ${hashtags || ''}`;
  const textMod = moderationService.moderateText(fullText);
  if (!textMod.allowed || textMod.status === 'REJECTED') {
    await moderationService.recordUserViolation(userId, textMod.reason, textMod.isMinorProtection);
    throw new Error("Upload blocked: This content doesn't meet StudyVault's community guidelines.");
  }

  // 3. Resolve video & cover file paths for multi-frame sampling
  let videoPath = video_url;
  let coverPath = cover_url;
  const uploadBase = path.resolve(process.cwd(), env.UPLOAD_DIR || 'uploads');

  try {
    if (video_url && video_url.includes('/')) {
      const vName = path.basename(new URL(video_url, 'http://localhost:5000').pathname);
      const publicVPath = path.join(uploadBase, 'public', vName);
      if (fs.existsSync(publicVPath)) videoPath = publicVPath;
      else videoPath = path.join(uploadBase, vName);
    }
    if (cover_url && cover_url.includes('/')) {
      const cName = path.basename(new URL(cover_url, 'http://localhost:5000').pathname);
      const publicCPath = path.join(uploadBase, 'public', cName);
      if (fs.existsSync(publicCPath)) coverPath = publicCPath;
      else coverPath = path.join(uploadBase, cName);
    }
  } catch (e) {
    // Keep fallback
  }

  // 4. Video multi-frame sampling moderation
  const videoMod = await moderationService.moderateVideo(videoPath, coverPath);
  if (!videoMod.allowed || videoMod.status === 'REJECTED') {
    await moderationService.recordUserViolation(userId, videoMod.reason, videoMod.isMinorProtection);
    throw new Error("Upload blocked: This content doesn't meet StudyVault's community guidelines.");
  }

  const modStatus = (textMod.status === 'REVIEW' || videoMod.status === 'REVIEW') ? 'REVIEW' : 'APPROVED';
  const modReason = videoMod.reason || textMod.reason || null;

  const result = await pool.query(
    `INSERT INTO reels (user_id, video_url, cover_url, caption, hashtags, visibility, moderation_status, moderation_reason, moderated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     RETURNING *`,
    [userId, video_url, cover_url || null, caption || '', hashtags || '', normalizedVisibility, modStatus, modReason]
  );
  return result.rows[0];
}

async function getAllReels(currentUserId = null) {
  const result = await pool.query(
    `SELECT 
       r.*,
       u.username AS author_username,
       u.avatar_url AS author_avatar,
       (SELECT COUNT(*)::int FROM reel_likes WHERE reel_id = r.id) AS likes_count,
       (SELECT COUNT(*)::int FROM reel_comments WHERE reel_id = r.id) AS comments_count,
       (SELECT COUNT(*)::int FROM reel_shares WHERE reel_id = r.id) AS shares_count,
       CASE 
         WHEN $1::uuid IS NULL THEN false 
         ELSE EXISTS(SELECT 1 FROM reel_likes WHERE reel_id = r.id AND user_id = $1::uuid)
       END AS liked,
       CASE 
         WHEN $1::uuid IS NULL THEN false 
         ELSE EXISTS(SELECT 1 FROM reel_saves WHERE reel_id = r.id AND user_id = $1::uuid)
       END AS saved
     FROM reels r
     JOIN users u ON r.user_id = u.id
     WHERE (
       r.user_id = $1::uuid
       OR (r.visibility = 'public' AND r.moderation_status = 'APPROVED')
       OR (r.visibility IN ('private', 'close_friends', 'close_friends_only') AND r.moderation_status = 'APPROVED' AND (
           EXISTS (SELECT 1 FROM friends f WHERE (f.user_id = r.user_id AND f.friend_id = $1::uuid) OR (f.friend_id = r.user_id AND f.user_id = $1::uuid))
           OR EXISTS (SELECT 1 FROM close_friends cf WHERE (cf.user_id = r.user_id AND cf.friend_id = $1::uuid) OR (cf.friend_id = r.user_id AND cf.user_id = $1::uuid))
       ))
     )
       AND r.user_id NOT IN (SELECT blocked_user_id FROM blocked_users WHERE user_id = $1::uuid)
       AND r.user_id NOT IN (SELECT user_id FROM blocked_users WHERE blocked_user_id = $1::uuid)
     ORDER BY r.created_at DESC`,
    [currentUserId]
  );
  return result.rows;
}

async function getReelById(reelId, currentUserId = null) {
  const result = await pool.query(
    `SELECT 
       r.*,
       u.username AS author_username,
       u.avatar_url AS author_avatar,
       (SELECT COUNT(*)::int FROM reel_likes WHERE reel_id = r.id) AS likes_count,
       (SELECT COUNT(*)::int FROM reel_comments WHERE reel_id = r.id) AS comments_count,
       (SELECT COUNT(*)::int FROM reel_shares WHERE reel_id = r.id) AS shares_count,
       CASE 
         WHEN $2::uuid IS NULL THEN false 
         ELSE EXISTS(SELECT 1 FROM reel_likes WHERE reel_id = r.id AND user_id = $2::uuid)
       END AS liked,
       CASE 
         WHEN $2::uuid IS NULL THEN false 
         ELSE EXISTS(SELECT 1 FROM reel_saves WHERE reel_id = r.id AND user_id = $2::uuid)
       END AS saved
     FROM reels r
     JOIN users u ON r.user_id = u.id
     WHERE r.id = $1
       AND (
         r.user_id = $2::uuid
         OR (r.visibility = 'public' AND r.moderation_status = 'APPROVED')
         OR (r.visibility IN ('private', 'close_friends', 'close_friends_only') AND r.moderation_status = 'APPROVED' AND (
             EXISTS (SELECT 1 FROM friends f WHERE (f.user_id = r.user_id AND f.friend_id = $2::uuid) OR (f.friend_id = r.user_id AND f.user_id = $2::uuid))
             OR EXISTS (SELECT 1 FROM close_friends cf WHERE (cf.user_id = r.user_id AND cf.friend_id = $2::uuid) OR (cf.friend_id = r.user_id AND cf.user_id = $2::uuid))
         ))
       )
       AND r.user_id NOT IN (SELECT blocked_user_id FROM blocked_users WHERE user_id = $2::uuid)
       AND r.user_id NOT IN (SELECT user_id FROM blocked_users WHERE blocked_user_id = $2::uuid)`,
    [reelId, currentUserId]
  );
  return result.rows[0] || null;
}

async function deleteReel(reelId, userId) {
  const result = await pool.query(
    `DELETE FROM reels WHERE id = $1 AND user_id = $2 RETURNING *`,
    [reelId, userId]
  );
  return result.rows[0] || null;
}

async function toggleReelLike(reelId, userId) {
  const existing = await pool.query(
    `SELECT id FROM reel_likes WHERE reel_id = $1 AND user_id = $2`,
    [reelId, userId]
  );

  if (existing.rows.length > 0) {
    await pool.query(
      `DELETE FROM reel_likes WHERE reel_id = $1 AND user_id = $2`,
      [reelId, userId]
    );
    return { liked: false };
  } else {
    await pool.query(
      `INSERT INTO reel_likes (reel_id, user_id) VALUES ($1, $2)`,
      [reelId, userId]
    );
    return { liked: true };
  }
}

async function toggleReelSave(reelId, userId) {
  const existing = await pool.query(
    `SELECT id FROM reel_saves WHERE reel_id = $1 AND user_id = $2`,
    [reelId, userId]
  );

  if (existing.rows.length > 0) {
    await pool.query(
      `DELETE FROM reel_saves WHERE reel_id = $1 AND user_id = $2`,
      [reelId, userId]
    );
    return { saved: false };
  } else {
    await pool.query(
      `INSERT INTO reel_saves (reel_id, user_id) VALUES ($1, $2)`,
      [reelId, userId]
    );
    return { saved: true };
  }
}

async function recordReelShare(reelId, userId) {
  await pool.query(
    `INSERT INTO reel_shares (reel_id, user_id) VALUES ($1, $2)`,
    [reelId, userId]
  );
  return { shared: true };
}

async function recordReelView(reelId, userId) {
  await pool.query(
    `INSERT INTO reel_views (reel_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [reelId, userId]
  );
  await pool.query(
    `UPDATE reels SET views_count = views_count + 1 WHERE id = $1`,
    [reelId]
  );
  return { viewed: true };
}

async function addReelComment(reelId, userId, content) {
  const textMod = moderationService.moderateText(content);
  if (!textMod.allowed || textMod.status === 'REJECTED') {
    throw new Error("Comment blocked: This content doesn't meet StudyVault's community guidelines.");
  }

  const result = await pool.query(
    `INSERT INTO reel_comments (reel_id, user_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [reelId, userId, content]
  );
  const comment = result.rows[0];
  const userResult = await pool.query(
    `SELECT username, avatar_url FROM users WHERE id = $1`,
    [userId]
  );
  return {
    ...comment,
    username: userResult.rows[0]?.username || 'Student',
    avatar_url: userResult.rows[0]?.avatar_url || null,
  };
}

async function getReelComments(reelId) {
  const result = await pool.query(
    `SELECT 
       rc.*,
       u.username,
       u.avatar_url
     FROM reel_comments rc
     JOIN users u ON rc.user_id = u.id
     WHERE rc.reel_id = $1
     ORDER BY rc.created_at ASC`,
    [reelId]
  );
  return result.rows;
}

async function recordWatchTime(userId, reelId, { watched_seconds = 0, completion_percentage = 0, completed = false, replayed = false }) {
  await pool.query(
    `INSERT INTO reel_views (reel_id, user_id, watched_seconds, completion_percentage, completed, replayed)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (reel_id, user_id) DO UPDATE SET
       watched_seconds = EXCLUDED.watched_seconds,
       completion_percentage = EXCLUDED.completion_percentage,
       completed = EXCLUDED.completed,
       replayed = EXCLUDED.replayed`,
    [reelId, userId, watched_seconds, completion_percentage, completed, replayed]
  );

  const reelRes = await pool.query(`SELECT hashtags, user_id FROM reels WHERE id = $1`, [reelId]);
  const reel = reelRes.rows[0];
  if (reel && reel.hashtags) {
    const tags = reel.hashtags.split(/\s+/).filter((t) => t.startsWith('#'));
    const scoreDelta = completion_percentage >= 80 ? 0.5 : completion_percentage >= 50 ? 0.2 : 0.05;
    for (const tag of tags) {
      await pool.query(
        `INSERT INTO user_interests (user_id, topic, score)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, topic) DO UPDATE SET
           score = user_interests.score + $3,
           updated_at = NOW()`,
        [userId, tag.toLowerCase(), scoreDelta]
      );
    }
  }
  return { success: true };
}

async function getPersonalizedReelFeed(currentUserId = null) {
  const allReels = await getAllReels(currentUserId);
  if (!currentUserId || allReels.length === 0) {
    return allReels;
  }

  const interestsRes = await pool.query(`SELECT topic, score FROM user_interests WHERE user_id = $1`, [currentUserId]);
  const interestMap = {};
  interestsRes.rows.forEach((row) => {
    interestMap[row.topic.toLowerCase()] = row.score;
  });

  const now = Date.now();

  const scoredReels = allReels.map((reel) => {
    let topicScore = 0;
    if (reel.hashtags) {
      const tags = reel.hashtags.split(/\s+/).filter((t) => t.startsWith('#'));
      tags.forEach((tag) => {
        topicScore += interestMap[tag.toLowerCase()] || 0;
      });
    }

    const likesCount = Number(reel.likes_count || 0);
    const likeScore = reel.liked ? 1.0 : 0.0;
    const saveScore = reel.saved ? 1.0 : 0.0;
    const creatorScore = 0.5;

    const ageInHours = (now - new Date(reel.created_at).getTime()) / (1000 * 60 * 60);
    const freshnessScore = Math.max(0, 1.0 - ageInHours / 168);

    const finalScore =
      topicScore * 0.30 +
      likesCount * 0.25 +
      likeScore * 0.15 +
      saveScore * 0.15 +
      creatorScore * 0.10 +
      freshnessScore * 0.05;

    return { ...reel, recommendation_score: finalScore };
  });

  scoredReels.sort((a, b) => b.recommendation_score - a.recommendation_score);
  return scoredReels;
}

module.exports = {
  createReel,
  getAllReels,
  getPersonalizedReelFeed,
  getReelById,
  deleteReel,
  toggleReelLike,
  toggleReelSave,
  recordReelShare,
  recordReelView,
  recordWatchTime,
  addReelComment,
  getReelComments,
};
