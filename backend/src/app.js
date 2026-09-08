const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const cookieParser = require('./middleware/cookieParser');
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const taskRoutes = require('./routes/taskRoutes');
const profileRoutes = require('./routes/profileRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const postRoutes = require('./routes/postRoutes');
const interactionRoutes = require('./routes/interactionRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const highlightRoutes = require('./routes/highlightRoutes');
const memoryRoutes = require('./routes/memoryRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const privacyRoutes = require('./routes/privacyRoutes');
const storyRoutes = require('./routes/storyRoutes');
const reelRoutes = require('./routes/reelRoutes');
const vaultRoutes = require('./routes/vaultRoutes');
const healthRoutes = require('./routes/healthRoutes');
const musicRoutes = require('./routes/musicRoutes');
const notFound = require('./middleware/notFound');

const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const env = require('./config/env');

const app = express();
app.set('trust proxy', 1);

const corsOptions = {
    origin: function (origin, callback) {
        // Allow request if no origin (mobile app / curl / socket) or matches pattern
        if (!origin || origin === 'capacitor://localhost' || origin === 'https://localhost' || origin === 'http://localhost' || origin.includes('10.') || origin.includes('192.168.') || origin.includes('localhost')) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

// Apply general rate limiting to all API routes
app.use('/api', generalLimiter);

app.use(cookieParser);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

const reportRoutes = require('./routes/reportRoutes');
const adminModerationRoutes = require('./routes/adminModerationRoutes');
const aiRoutes = require('./routes/aiRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/highlights', memoryRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin/moderation', adminModerationRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/music', musicRoutes);


app.get('/', (req, res) => {
    res.json({
        message: 'StudyVault API Server is running',
        status: 'online',
        healthCheck: '/api/health',
        frontendUrl: env.FRONTEND_URL || 'http://localhost:5500'
    });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
