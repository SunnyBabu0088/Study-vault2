const reelService = require('../services/reelService');

async function createReel(req, res) {
  try {
    const userId = req.user.id;
    const { video_url, cover_url, caption, hashtags, visibility } = req.body;

    if (!video_url) {
      return res.status(400).json({ error: 'Video URL is required to create a reel.' });
    }

    const reel = await reelService.createReel(userId, {
      video_url,
      cover_url,
      caption,
      hashtags,
      visibility,
    });

    return res.status(201).json({ reel });
  } catch (err) {
    console.error('Create reel controller error:', err);
    return res.status(500).json({ error: 'Failed to create reel.' });
  }
}

async function getAllReels(req, res) {
  try {
    const userId = req.user ? req.user.id : null;
    const reels = await reelService.getAllReels(userId);
    return res.json({ reels });
  } catch (err) {
    console.error('Get reels controller error:', err);
    return res.status(500).json({ error: 'Failed to fetch reels.' });
  }
}

async function getReelById(req, res) {
  try {
    const userId = req.user ? req.user.id : null;
    const { id } = req.params;
    const reel = await reelService.getReelById(id, userId);

    if (!reel) {
      return res.status(404).json({ error: 'Reel not found.' });
    }

    return res.json({ reel });
  } catch (err) {
    console.error('Get reel by id error:', err);
    return res.status(500).json({ error: 'Failed to fetch reel.' });
  }
}

async function deleteReel(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const deleted = await reelService.deleteReel(id, userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Reel not found or unauthorized to delete.' });
    }

    return res.json({ message: 'Reel deleted successfully.' });
  } catch (err) {
    console.error('Delete reel controller error:', err);
    return res.status(500).json({ error: 'Failed to delete reel.' });
  }
}

async function toggleLike(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await reelService.toggleReelLike(id, userId);
    return res.json(result);
  } catch (err) {
    console.error('Toggle reel like error:', err);
    return res.status(500).json({ error: 'Failed to toggle like.' });
  }
}

async function toggleSave(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await reelService.toggleReelSave(id, userId);
    return res.json(result);
  } catch (err) {
    console.error('Toggle reel save error:', err);
    return res.status(500).json({ error: 'Failed to toggle save.' });
  }
}

async function recordShare(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await reelService.recordReelShare(id, userId);
    return res.json(result);
  } catch (err) {
    console.error('Record reel share error:', err);
    return res.status(500).json({ error: 'Failed to record share.' });
  }
}

async function recordView(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await reelService.recordReelView(id, userId);
    return res.json(result);
  } catch (err) {
    console.error('Record reel view error:', err);
    return res.status(500).json({ error: 'Failed to record view.' });
  }
}

async function addComment(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required.' });
    }

    const comment = await reelService.addReelComment(id, userId, content.trim());
    return res.status(201).json({ comment });
  } catch (err) {
    console.error('Add reel comment error:', err);
    return res.status(500).json({ error: 'Failed to add comment.' });
  }
}

async function getComments(req, res) {
  try {
    const { id } = req.params;
    const comments = await reelService.getReelComments(id);
    return res.json({ comments });
  } catch (err) {
    console.error('Get reel comments error:', err);
    return res.status(500).json({ error: 'Failed to fetch comments.' });
  }
}

async function getPersonalizedFeed(req, res) {
  try {
    const userId = req.user ? req.user.id : null;
    const reels = await reelService.getPersonalizedReelFeed(userId);
    return res.json({ reels });
  } catch (err) {
    console.error('Get personalized feed controller error:', err);
    return res.status(500).json({ error: 'Failed to fetch personalized feed.' });
  }
}

async function recordWatchTime(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { watched_seconds, completion_percentage, completed, replayed } = req.body;
    const result = await reelService.recordWatchTime(userId, id, {
      watched_seconds,
      completion_percentage,
      completed,
      replayed,
    });
    return res.json(result);
  } catch (err) {
    console.error('Record watch time controller error:', err);
    return res.status(500).json({ error: 'Failed to record watch time.' });
  }
}

module.exports = {
  createReel,
  getAllReels,
  getPersonalizedFeed,
  getReelById,
  deleteReel,
  toggleLike,
  toggleSave,
  recordShare,
  recordView,
  recordWatchTime,
  addComment,
  getComments,
};
