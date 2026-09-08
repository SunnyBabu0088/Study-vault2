const storyService = require('../services/storyService');

const getStories = async (req, res, next) => {
  try {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    const stories = await storyService.getStories(userId);
    res.json({ success: true, stories });
  } catch (err) {
    next(err);
  }
};

const reactToStory = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { reactionType } = req.body || {};
    const result = await storyService.reactToStory(userId, id, reactionType);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const replyToStory = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const reply = await storyService.replyToStory(userId, id, message.trim());
    res.json({ success: true, reply });
  } catch (err) {
    next(err);
  }
};

const viewStory = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.json({ success: true });

    const { id } = req.params;
    const result = await storyService.viewStory(userId, id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const createStory = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { content, mediaUrl, mediaType, background, music } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Story content is required' });
    }

    const story = await storyService.createStory(userId, { content, mediaUrl, mediaType, background, music });
    res.status(201).json({ success: true, story });
  } catch (err) {
    next(err);
  }
};

const deleteStory = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const result = await storyService.deleteStory(userId, id);
    if (!result) return res.status(404).json({ error: 'Story not found or unauthorized' });

    res.json({ success: true, message: 'Story deleted' });
  } catch (err) {
    next(err);
  }
};

const getActivity = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const activity = await storyService.getStoryActivity(userId);
    res.json({ success: true, activity });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStories,
  reactToStory,
  replyToStory,
  viewStory,
  createStory,
  deleteStory,
  getActivity,
};
