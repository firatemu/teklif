# syntax=docker/dockerfile:1.7
# ---- base image with Chromium runtime deps ----
FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    NODE_ENV=production
WORKDIR /app

# Chromium runtime dependencies (shared by deps + runner)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl git \
    fonts-liberation fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg \
    fonts-kacst fonts-freefont-ttf fonts-noto-cjk fonts-noto-color-emoji \
    libasound2t64 libatk-bridge2.0-0 libatk1.0-0 \
    libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 \
    libgcc-s1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 \
    libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
    libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
    libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
    dumb-init \
 && rm -rf /var/lib/apt/lists/*

# ---- deps: install full Chromium and npm packages ----
FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
 && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ---- builder: build Next.js + generate Prisma client ----
FROM deps AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
ENV DATABASE_URL="file:./build.db"
RUN npx prisma generate
RUN npm run build

# ---- runner: minimal runtime image ----
FROM base AS runner
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
 && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs \
 && mkdir -p /app/prisma /app/storage \
 && chown -R nextjs:nodejs /app

# Copy built standalone + static + prisma
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs
ENV PORT=3000 HOSTNAME=0.0.0.0 \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    DATABASE_URL="file:/app/prisma/dev.db"

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/login || exit 1

CMD ["dumb-init", "node", "server.js"]
