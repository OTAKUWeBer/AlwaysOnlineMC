# ==========================================
# AlwaysOnlineMC - Production Dockerfile
# ==========================================

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set node environment
ENV NODE_ENV=production

# Install dependencies first for better caching
COPY package*.json pnpm-lock.yaml* ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application source code
COPY . .

# Expose web healthcheck port if enabled
EXPOSE 10000 3000

# Run bot as non-root node user for security
USER node

# Healthcheck to verify bot process is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-10000}/health || exit 0

# Start command
CMD ["node", "bot.js"]
