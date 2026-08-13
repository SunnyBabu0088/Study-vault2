const userService = require('./userService');

const calculateStreak = async (userId, chatDate) => {
    const user = await userService.getUserById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    const today = chatDate;
    const lastDate = user.last_chat_date || null;

    if (!lastDate) {
        return { streakCount: 1, lastChatDate: today };
    }

    const last = new Date(lastDate);
    const current = new Date(today);
    const diffDays = Math.round((current - last) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
        return { streakCount: (user.streak_count || 0) + 1, lastChatDate: today };
    }

    if (diffDays > 1) {
        return { streakCount: Math.max(0, (user.streak_count || 0) - 7), lastChatDate: today };
    }

    return { streakCount: user.streak_count || 0, lastChatDate: user.last_chat_date };
};

const updateStreak = async (userId, chatDate) => {
    const result = await calculateStreak(userId, chatDate);
    await userService.updateUser(userId, {
        streakCount: result.streakCount,
        lastChatDate: result.lastChatDate,
    });
    return result;
};

module.exports = { calculateStreak, updateStreak };
