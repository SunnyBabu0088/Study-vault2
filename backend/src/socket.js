const { Server } = require('socket.io');
const { verifyToken } = require('./utils/jwt');
const userService = require('./services/userService');
const conversationService = require('./services/conversationService');
const messageService = require('./services/messageService');
const { sanitizeMessageContent } = require('./utils/validators');

const parseCookies = (cookieHeader = '') => {
    return cookieHeader.split(';').reduce((cookies, pair) => {
        const [name, ...rest] = pair.trim().split('=');
        if (!name) return cookies;
        cookies[name] = rest.join('=');
        return cookies;
    }, {});
};

const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5500',
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });

    io.use(async (socket, next) => {
        try {
            const cookies = parseCookies(socket.handshake.headers.cookie || '');
            const token = cookies.token || socket.handshake.auth?.token || null;
            if (!token) {
                return next(new Error('Authentication token missing'));
            }

            const payload = verifyToken(token);
            if (!payload || !payload.userId) {
                return next(new Error('Invalid authentication token'));
            }

            const user = await userService.getUserById(payload.userId);
            if (!user) {
                return next(new Error('User no longer exists'));
            }

            socket.user = { id: user.id, username: user.username };
            next();
        } catch (error) {
            next(new Error('Expired or invalid authentication token'));
        }
    });

    io.on('connection', (socket) => {
        socket.join(`user:${socket.user.id}`);
        
        // Broadcast user online status
        socket.broadcast.emit('user_status', { userId: socket.user.id, status: 'online' });

        socket.on('join_conversation', async ({ conversationId }, callback) => {
            try {
                const conversation = await conversationService.getConversationById(socket.user.id, conversationId);
                if (!conversation) {
                    return callback({ error: 'Conversation not found or access denied' });
                }
                socket.join(`conversation:${conversationId}`);
                callback({ success: true, conversationId });
            } catch (error) {
                callback({ error: error.message || 'Unable to join conversation' });
            }
        });

        socket.on('send_message', async ({ conversationId, content }, callback) => {
            try {
                const conversation = await conversationService.getConversationById(socket.user.id, conversationId);
                if (!conversation) {
                    return callback({ error: 'Conversation not found or access denied' });
                }
                const sanitized = sanitizeMessageContent(content);
                if (!sanitized) {
                    return callback({ error: 'Message cannot be empty' });
                }
                if (sanitized.length > 2000) {
                    return callback({ error: 'Message is too long' });
                }
                const message = await messageService.createAndPersistMessage(socket.user.id, conversationId, sanitized);
                const sender = { id: socket.user.id, username: socket.user.username };
                const payload = {
                    id: message.id,
                    conversation_id: message.conversation_id,
                    sender_id: message.sender_id,
                    sender_username: sender.username,
                    content: message.content,
                    created_at: message.created_at,
                    read_at: message.read_at,
                };
                io.to(`conversation:${conversationId}`).emit('new_message', payload);
                callback({ data: payload });
            } catch (error) {
                callback({ error: error.message || 'Unable to send message' });
            }
        });

        socket.on('typing_start', async ({ conversationId }) => {
            if (!conversationId) return;
            const conversation = await conversationService.getConversationById(socket.user.id, conversationId);
            if (!conversation) return;
            socket.to(`conversation:${conversationId}`).emit('typing_start', {
                conversationId,
                userId: socket.user.id,
                username: socket.user.username,
            });
        });

        socket.on('typing_stop', async ({ conversationId }) => {
            if (!conversationId) return;
            const conversation = await conversationService.getConversationById(socket.user.id, conversationId);
            if (!conversation) return;
            socket.to(`conversation:${conversationId}`).emit('typing_stop', {
                conversationId,
                userId: socket.user.id,
            });
        });

        socket.on('message_read', async ({ messageId }) => {
            try {
                const message = await messageService.markMessageRead(socket.user.id, messageId);
                if (!message) return;
                io.to(`conversation:${message.conversation_id}`).emit('message_read', {
                    messageId: message.id,
                    conversationId: message.conversation_id,
                    readerId: socket.user.id,
                    readAt: message.read_at,
                });
            } catch (_) {
                // ignore read acknowledgement failures
            }
        });

        socket.on('disconnect', () => {
            // Broadcast user offline status
            socket.broadcast.emit('user_status', { userId: socket.user.id, status: 'offline' });
        });
    });
};

module.exports = { initSocket };