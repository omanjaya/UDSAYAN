# syntax=docker.io/docker/dockerfile:1

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client again for build
RUN npx prisma generate

# Set DATABASE_URL for build time (required for static page generation)
ENV DATABASE_URL="file:/app/prisma/dev.db"

# Create database with migrations
RUN npx prisma db push --accept-data-loss

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create data directory for persistent database
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Copy database template
COPY --from=builder --chown=nextjs:nodejs /app/prisma/dev.db ./prisma/dev.db

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'if [ ! -f /app/data/dev.db ]; then' >> /app/start.sh && \
    echo '  echo "Initializing database..."' >> /app/start.sh && \
    echo '  cp /app/prisma/dev.db /app/data/dev.db' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    echo 'exec node server.js' >> /app/start.sh && \
    chmod +x /app/start.sh && \
    chown nextjs:nodejs /app/start.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/dev.db"

CMD ["/app/start.sh"]
