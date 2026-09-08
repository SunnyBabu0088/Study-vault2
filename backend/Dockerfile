# ==========================================
# Multi-stage Dockerfile for Backend (Production)
# ==========================================

# 1. Builder Stage
FROM node:20-alpine AS builder

# Install build dependencies for native compilation (bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Prune development dependencies for minimal production footprint
RUN npm prune --omit=dev

# 2. Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=5000

# Create uploads directory and set appropriate permissions
RUN mkdir -p /app/uploads && chown -R node:node /app

# Copy production node_modules and application code
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node migrations ./migrations

# Run as non-privileged user for security
USER node

EXPOSE 5000

# Native Node healthcheck verifying /api/health returns 200
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 5000) + '/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

CMD ["node", "src/server.js"]
