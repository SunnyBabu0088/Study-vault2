# ==========================================
# Multi-stage Dockerfile for Frontend (Production)
# ==========================================

# 1. Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# In production behind Nginx, relative API paths (/api) are proxied
ENV VITE_API_BASE_URL=""

RUN npm run build

# 2. Production Web Server Stage (Nginx)
FROM nginx:1.27-alpine AS runner

# Remove default configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/studyvault.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Health check against Nginx healthz endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
