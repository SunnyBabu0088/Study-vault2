const postService = require('../services/postService');
const { validatePostPayload, validatePagination, validateIdParam } = require('../utils/validators');
const { sendSuccess, sendCreated } = require('../utils/response');

const listPosts = async (req, res, next) => {
    try {
        const { page, limit } = validatePagination(req.query);
        const offset = (page - 1) * limit;
        const posts = await postService.getPostsForUser(req.user.id, limit, offset);
        return sendSuccess(res, { posts, page, limit });
    } catch (error) {
        next(error);
    }
};

const getPost = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!validateIdParam(id)) {
            const error = new Error('Invalid post id');
            error.statusCode = 400;
            throw error;
        }

        const post = await postService.getPostById(req.user.id, id);
        if (!post) {
            const error = new Error('Post not found');
            error.statusCode = 404;
            throw error;
        }

        return sendSuccess(res, { post });
    } catch (error) {
        next(error);
    }
};

const createPost = async (req, res, next) => {
    try {
        const { valid, errors, sanitized } = validatePostPayload(req.body);
        if (!valid) {
            const error = new Error('Validation failed');
            error.statusCode = 400;
            error.details = errors;
            throw error;
        }

        const post = await postService.createPost({ userId: req.user.id, ...sanitized });
        return sendCreated(res, { post });
    } catch (error) {
        next(error);
    }
};

const updatePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!validateIdParam(id)) {
            const error = new Error('Invalid post id');
            error.statusCode = 400;
            throw error;
        }

        const { valid, errors, sanitized } = validatePostPayload(req.body, true);
        if (!valid) {
            const error = new Error('Validation failed');
            error.statusCode = 400;
            error.details = errors;
            throw error;
        }

        const post = await postService.updatePost(req.user.id, id, sanitized);
        if (!post) {
            const error = new Error('Post not found');
            error.statusCode = 404;
            throw error;
        }

        return sendSuccess(res, { post });
    } catch (error) {
        next(error);
    }
};

const deletePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!validateIdParam(id)) {
            const error = new Error('Invalid post id');
            error.statusCode = 400;
            throw error;
        }

        const deleted = await postService.deletePost(req.user.id, id);
        if (!deleted) {
            const error = new Error('Post not found');
            error.statusCode = 404;
            throw error;
        }

        return sendSuccess(res, { message: 'Post deleted successfully' });
    } catch (error) {
        next(error);
    }
};

const addComment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        if (!content || !content.trim()) {
            const error = new Error('Comment content is required');
            error.statusCode = 400;
            throw error;
        }
        const comment = await postService.addPostComment(id, req.user.id, content.trim());
        return sendCreated(res, { comment });
    } catch (error) {
        next(error);
    }
};

const getComments = async (req, res, next) => {
    try {
        const { id } = req.params;
        const comments = await postService.getPostComments(id);
        return sendSuccess(res, { comments });
    } catch (error) {
        next(error);
    }
};

const recordShare = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await postService.recordPostShare(id, req.user.id);
        return sendSuccess(res, result);
    } catch (error) {
        next(error);
    }
};

module.exports = { listPosts, getPost, createPost, updatePost, deletePost, addComment, getComments, recordShare };
