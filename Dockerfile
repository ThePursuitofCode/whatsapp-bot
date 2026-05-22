# ─────────────────────────────────────────────────
# WhatsApp Bot — Production Docker Image
# Optimized for whatsapp-web.js + Puppeteer/Chromium
# ─────────────────────────────────────────────────

FROM node:18-slim

# Install system dependencies required by Chromium/Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    chromium \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to skip its bundled Chromium download and use the system one
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy dependency manifests first (Docker cache layer optimization)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy app source code
COPY . .

# Create session directory for WhatsApp auth persistence
RUN mkdir -p /app/session

# Run as non-root user for security (Chromium --no-sandbox still required)
RUN groupadd -r botuser && useradd -r -g botuser -d /app botuser \
    && chown -R botuser:botuser /app
USER botuser

CMD ["node", "index.js"]
