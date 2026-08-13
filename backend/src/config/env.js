require('dotenv').config();

const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: Number(process.env.PORT || 5000),
    DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/studyvault',
    JWT_SECRET: process.env.JWT_SECRET || 'development-jwt-secret',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'development-refresh-secret',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5500',
    COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
    UPLOAD_MAX_SIZE_MB: Number(process.env.UPLOAD_MAX_SIZE_MB || 10),
};

module.exports = env;
