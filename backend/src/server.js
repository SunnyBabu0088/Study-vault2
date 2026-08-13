const app = require('./app');
const { pool } = require('./config/database');
const { initializeSchema } = require('./config/schema');
const { initSocket } = require('./socket');
const env = require('./config/env');

const PORT = env.PORT;

let server;

const startServer = async () => {
    try {
        await initializeSchema();
        console.log('Database schema initialized successfully.');
    } catch (error) {
        console.warn('Database schema initialization unavailable, continuing in degraded mode:', error.message);
    }

    server = app.listen(PORT, () => {
        console.log(`StudyVault API listening on port ${PORT}`);
    });

    initSocket(server);
    return server;
};

startServer().catch((error) => {
    console.error('Failed to initialize StudyVault backend', error);
    process.exit(1);
});

const shutdown = async (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);

    if (server && typeof server.close === 'function') {
        server.close(async (err) => {
            if (err) {
                console.error('Server close error:', err);
                process.exit(1);
            }
            try {
                await pool.end();
                console.log('PostgreSQL pool has ended.');
                process.exit(0);
            } catch (closeErr) {
                console.error('Error closing DB pool:', closeErr);
                process.exit(1);
            }
        });
        return;
    }

    try {
        await pool.end();
        console.log('PostgreSQL pool has ended.');
        process.exit(0);
    } catch (closeErr) {
        console.error('Error closing DB pool:', closeErr);
        process.exit(1);
    }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    shutdown('unhandledRejection');
});
