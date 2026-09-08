const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const noteThemes = ['lavender', 'sunrise', 'mint', 'midnight'];
const priorities = ['Low', 'Medium', 'High'];

const validateRegistration = (data) => {
    const errors = {};
    const username = String(data.username || '').trim();
    const email = String(data.email || '').trim().toLowerCase();
    const password = String(data.password || '');
    const phone = String(data.phone || '').trim();
    const roll_number = String(data.roll_number || '').trim();
    const avatar_url = String(data.avatar_url || '').trim();

    if (!username || username.length < 3 || username.length > 30) {
        errors.username = 'Username must be between 3 and 30 characters.';
    }

    if (!email || !emailRegex.test(email)) {
        errors.email = 'A valid email address is required.';
    }

    if (!password || password.length < 8) {
        errors.password = 'Password must be at least 8 characters long.';
    }

    if (phone && phone.length < 8) {
        errors.phone = 'Phone must be at least 8 characters if provided.';
    }

    if (roll_number && roll_number.length < 2) {
        errors.roll_number = 'Roll number is too short.';
    }

    if (avatar_url && !avatar_url.startsWith('http')) {
        errors.avatar_url = 'Avatar URL must be a valid URL.';
    }

    return { valid: Object.keys(errors).length === 0, errors, sanitized: { username, email, password, phone, roll_number, avatar_url } };
};

const validateLogin = (data) => {
    const errors = {};
    const email = String(data.email || '').trim().toLowerCase();
    const password = String(data.password || '');

    if (!email || !emailRegex.test(email)) {
        errors.email = 'A valid email address is required.';
    }

    if (!password) {
        errors.password = 'Password is required.';
    }

    return { valid: Object.keys(errors).length === 0, errors, sanitized: { email, password } };
};

const validateIdParam = (id) => {
    return typeof id === 'string' && uuidRegex.test(id);
};

const validatePagination = (query) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    return { page: page > 0 ? page : 1, limit: limit > 0 && limit <= 100 ? limit : 20 };
};

const validateProfilePayload = (data) => {
    const errors = {};
    const username = String(data.username || '').trim();
    const email = String(data.email || '').trim().toLowerCase();
    const phone = String(data.phone || '').trim();
    const roll_number = String(data.roll_number || '').trim();
    const bio = String(data.bio || '').trim();
    const avatar_url = String(data.avatar_url || '').trim();

    if (!username || username.length < 3 || username.length > 30) {
        errors.username = 'Username must be between 3 and 30 characters.';
    }

    if (!email || !emailRegex.test(email)) {
        errors.email = 'A valid email address is required.';
    }

    if (phone && phone.length < 8) {
        errors.phone = 'Phone must be at least 8 characters if provided.';
    }

    if (roll_number && roll_number.length < 2) {
        errors.roll_number = 'Roll number is too short.';
    }

    if (avatar_url && !avatar_url.startsWith('http') && !avatar_url.startsWith('/') && !avatar_url.startsWith('data:')) {
        errors.avatar_url = 'Avatar URL must be a valid URL or path.';
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
        sanitized: { username, email, phone, roll_number, bio, avatar_url },
    };
};

const validateNotePayload = (data, partial = false) => {
    const errors = {};
    const title = data.title !== undefined ? String(data.title).trim() : undefined;
    const content = data.content !== undefined ? String(data.content).trim() : undefined;
    const theme = data.theme !== undefined ? String(data.theme).trim() : undefined;

    if (!partial || title !== undefined) {
        if (!title || title.length < 1 || title.length > 200) {
            errors.title = 'Title is required and must be under 200 characters.';
        }
    }

    if (!partial || content !== undefined) {
        if (!content || content.length < 1) {
            errors.content = 'Content is required.';
        }
    }

    if (!partial || theme !== undefined) {
        if (!theme || !noteThemes.includes(theme)) {
            errors.theme = 'Theme is required and must be one of lavender, sunrise, mint, or midnight.';
        }
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
        sanitized: {
            ...(title !== undefined ? { title } : {}),
            ...(content !== undefined ? { content } : {}),
            ...(theme !== undefined ? { theme } : {}),
        },
    };
};

const validateConversationPayload = (data) => {
    const errors = {};
    const participants = Array.isArray(data.participants) ? data.participants.map(String).map((username) => username.trim()).filter(Boolean) : [];

    if (participants.length === 0) {
        errors.participants = 'At least one participant is required.';
    }

    if (participants.some((name) => name.length < 1 || name.length > 30)) {
        errors.participants = 'Participant usernames must be between 1 and 30 characters.';
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
        sanitized: { participants },
    };
};

const validateMessagePayload = (data) => {
    const errors = {};
    const content = String(data.content || '').trim();

    if (!content) {
        errors.content = 'Message cannot be empty.';
    } else if (content.length > 2000) {
        errors.content = 'Message is too long.';
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
        sanitized: { content: sanitizeMessageContent(content) },
    };
};

const sanitizeMessageContent = (content) => {
    const trimmed = String(content || '').trim();
    const withoutTags = trimmed.replace(/<[^>]*>/g, '');
    return withoutTags.replace(/[\u0000-\u001F\u007F]+/g, '');
};

const validateTaskPayload = (data, partial = false) => {
    const errors = {};
    const subject = data.subject !== undefined ? String(data.subject).trim() : undefined;
    const title = data.title !== undefined ? String(data.title).trim() : undefined;
    const content = data.content !== undefined ? String(data.content).trim() : undefined;
    const priority = data.priority !== undefined ? String(data.priority).trim() : undefined;
    const due_date = data.due_date !== undefined ? String(data.due_date).trim() : undefined;
    const completed = data.completed !== undefined ? Boolean(data.completed) : undefined;

    if (!partial || subject !== undefined) {
        if (!subject || subject.length < 1 || subject.length > 100) {
            errors.subject = 'Subject is required and must be under 100 characters.';
        }
    }

    if (!partial || title !== undefined) {
        if (!title || title.length < 1 || title.length > 200) {
            errors.title = 'Title is required and must be under 200 characters.';
        }
    }

    if (!partial || content !== undefined) {
        if (!content || content.length < 1) {
            errors.content = 'Content is required.';
        }
    }

    if (!partial || priority !== undefined) {
        if (!priority || !priorities.includes(priority)) {
            errors.priority = 'Priority is required and must be Low, Medium, or High.';
        }
    }

    if (!partial || due_date !== undefined) {
        if (due_date) {
            const date = new Date(due_date);
            if (Number.isNaN(date.getTime())) {
                errors.due_date = 'Due date must be a valid date string.';
            }
        }
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
        sanitized: {
            ...(subject !== undefined ? { subject } : {}),
            ...(title !== undefined ? { title } : {}),
            ...(content !== undefined ? { content } : {}),
            ...(priority !== undefined ? { priority } : {}),
            ...(due_date !== undefined ? { due_date: due_date || null } : {}),
            ...(completed !== undefined ? { completed } : {}),
        },
    };
};

const normalizeUserResponse = (user) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone || null,
    roll_number: user.roll_number || null,
    bio: user.bio || null,
    avatar_url: user.avatar_url || null,
    streak_count: user.streak_count || 0,
    last_chat_date: user.last_chat_date || null,
    created_at: user.created_at,
    updated_at: user.updated_at,
});

const validatePostPayload = (data, partial = false) => {
    const errors = {};
    const title = data.title !== undefined ? String(data.title).trim() : undefined;
    const content = data.content !== undefined ? String(data.content).trim() : undefined;
    const hashtags = data.hashtags !== undefined ? String(data.hashtags).trim() : undefined;
    const visibility = data.visibility !== undefined ? String(data.visibility).trim().toLowerCase() : undefined;
    const scheduled_date = data.scheduled_date !== undefined ? String(data.scheduled_date).trim() : undefined;
    const media_url = data.media_url !== undefined ? String(data.media_url).trim() : undefined;
    const media_type = data.media_type !== undefined ? String(data.media_type).trim().toLowerCase() : undefined;
    const category = data.category !== undefined ? String(data.category).trim().toLowerCase() : undefined;

    if (!partial || title !== undefined) {
        if (!title || title.length < 1 || title.length > 200) {
            errors.title = 'Title is required and must be under 200 characters.';
        }
    }

    if (!partial || content !== undefined) {
        if (!content || content.length < 1) {
            errors.content = 'Content is required.';
        }
    }

    if (!partial || visibility !== undefined) {
        if (!visibility || !['public', 'private'].includes(visibility)) {
            errors.visibility = 'Visibility must be public or private.';
        }
    }

    if (!partial || scheduled_date !== undefined && scheduled_date) {
        const parsed = new Date(scheduled_date || '');
        if (scheduled_date && Number.isNaN(parsed.getTime())) {
            errors.scheduled_date = 'Scheduled date must be a valid date string.';
        }
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
        sanitized: {
            ...(title !== undefined ? { title } : {}),
            ...(content !== undefined ? { content } : {}),
            ...(hashtags !== undefined ? { hashtags } : {}),
            ...(visibility !== undefined ? { visibility } : {}),
            ...(scheduled_date !== undefined ? { scheduled_date: scheduled_date || null } : {}),
            ...(media_url !== undefined ? { media_url } : {}),
            ...(media_type !== undefined ? { media_type } : {}),
            ...(category !== undefined ? { category: category || 'startup' } : {}),
        },
    };
};

const validateSuggestionPayload = (data) => {
    const errors = {};
    const content = String(data.content || '').trim();

    if (!content) {
        errors.content = 'Suggestion content is required.';
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
        sanitized: { content },
    };
};

const validateUploadPayload = (data) => {
    const errors = {};
    const filename = String(data.filename || '').trim();
    const mimeType = String(data.mimeType || '').trim();
    const content = String(data.content || '').trim();

    if (!filename) {
        errors.filename = 'Filename is required.';
    }

    if (!mimeType) {
        errors.mimeType = 'Mime type is required.';
    }

    if (!content) {
        errors.content = 'File content is required.';
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
        sanitized: { filename, mimeType, content },
    };
};

module.exports = {
    validateRegistration,
    validateLogin,
    validateProfilePayload,
    validateConversationPayload,
    validateMessagePayload,
    sanitizeMessageContent,
    validateIdParam,
    validatePagination,
    validateNotePayload,
    validateTaskPayload,
    validatePostPayload,
    validateSuggestionPayload,
    validateUploadPayload,
    normalizeUserResponse,
};
