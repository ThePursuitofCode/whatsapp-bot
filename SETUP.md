# 🤖 WhatsApp Bot — Complete Setup Guide

This guide walks you through deploying your WhatsApp Anthropic Bot on **Coolify** so it runs 24/7, and connecting it to your WhatsApp account.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Get Your Anthropic API Key](#2-get-your-anthropic-api-key)
3. [Push Your Code to Git](#3-push-your-code-to-git)
4. [Deploy on Coolify](#4-deploy-on-coolify)
5. [Connect WhatsApp to the Bot](#5-connect-whatsapp-to-the-bot)
6. [Customize Your Bot](#6-customize-your-bot)
7. [Managing & Troubleshooting](#7-managing--troubleshooting)

---

## 1. Prerequisites

Before you begin, make sure you have:

| Requirement | Why |
|---|---|
| **Coolify instance** | A running Coolify installation on a VPS (e.g. Hetzner, DigitalOcean, Contabo). Coolify needs at least **2 GB RAM** — the bot uses Chromium under the hood. |
| **Git repo** | Your bot code pushed to GitHub, GitLab, or any Git host Coolify can connect to. |
| **Anthropic API key** | From [console.anthropic.com](https://console.anthropic.com). |
| **A phone with WhatsApp** | The account that will "become" the bot. This can be your personal WhatsApp or a secondary number. |

> ⚠️ **Important:** WhatsApp only allows one linked session per phone number at a time. If you already have WhatsApp Web open elsewhere, the bot will take over that session. Consider using a **secondary phone number** (even a cheap prepaid SIM) dedicated to the bot.

---

## 2. Get Your Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign in or create an account
3. Navigate to **API Keys** in the left sidebar
4. Click **Create Key**
5. Copy the key — you'll need it in Step 4

> 💡 Keep this key secret. Never commit it to Git.

---

## 3. Push Your Code to Git

If you haven't already, initialize a Git repo and push:

```bash
cd "Whatsapp Bot"
git init
git add .
git commit -m "Initial commit - WhatsApp bot"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/whatsapp-bot.git
git push -u origin main
```

Make sure these files are **in the repo**:
- `index.js`
- `claude.js`
- `middleware/rateLimiter.js`
- `package.json`
- `package-lock.json`
- `Dockerfile`
- `.dockerignore`
- `.env.example`

Make sure `.env` is **NOT** in the repo (it's in `.gitignore`).

---

## 4. Deploy on Coolify

### 4.1 — Connect Your Git Repository

1. Log in to your **Coolify dashboard**
2. Click **"+ Create New Resource"**
3. Select **"Public Repository"** (or connect your GitHub/GitLab account under Sources first for private repos)
4. Paste your repository URL
5. Select the **`main`** branch

### 4.2 — Select Build Pack

1. When prompted for a Build Pack, change from **Nixpacks** → **Dockerfile**
2. Coolify will automatically detect and use your `Dockerfile`

### 4.3 — Configure Environment Variables

Go to the **Environment Variables** tab and add each of these:

| Variable | Value | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` (your real key) | ✅ Yes |
| `BOT_NAME` | Whatever you want the bot called (e.g. `Jarvis`) | ✅ Yes |
| `BOT_PERSONALITY` | e.g. `a sarcastic but loyal friend who loves puns and 80s movie references` | Optional (has default) |
| `WHITELISTED_GROUPS` | Comma-separated group IDs like `120363001234567890@g.us` (leave empty to allow all groups) | Optional |
| `RATE_LIMIT_MAX` | Max requests per user per window (default: `5`) | Optional |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms (default: `600000` = 10 min) | Optional |

> 💡 **Tip:** Use the "Developer View" toggle in Coolify's env var tab to paste all variables at once in `KEY=value` format.

### 4.4 — Add Persistent Storage (CRITICAL!)

This is the most important step. Without persistent storage, the bot will lose its WhatsApp session every time the container restarts and you'll have to scan the QR code again.

1. Go to the **"Storage"** tab in your app settings
2. Click **"+ Add"**
3. Set the mapping:
   - **Source Path (on host):** `/data/whatsapp-bot/session`  
   - **Destination Path (in container):** `/app/session`

> This ensures the WhatsApp login session persists across container restarts and redeployments.

### 4.5 — Disable Health Checks

Since this bot is **not a web server** (it doesn't expose any HTTP port), you need to disable health checks or Coolify will think the app is down:

1. Go to the **"Health Check"** tab
2. **Disable** health checks entirely

Also:
- In **General** settings, you can leave "Ports Exposes" blank or set it to nothing — this app doesn't serve HTTP traffic.

### 4.6 — Deploy!

1. Click **"Deploy"**
2. Go to the **"Logs"** tab to watch the build and startup in real-time
3. You should see output like:
   ```
   Scan this QR code to log in:
   ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
   █ ▄▄▄▄▄ █ ...
   ```

---

## 5. Connect WhatsApp to the Bot

### 5.1 — Find the QR Code

1. In your Coolify dashboard, go to **Logs** for your deployed app
2. You will see a QR code printed in the terminal output
3. If the QR code looks garbled in the logs, you can also SSH into your Coolify server and run:
   ```bash
   docker logs <container_id> --follow
   ```
   To find the container ID:
   ```bash
   docker ps | grep whatsapp
   ```

### 5.2 — Scan the QR Code

1. Open **WhatsApp** on your phone
2. Go to **Settings → Linked Devices**
3. Tap **"Link a Device"**
4. Scan the QR code from the logs

> ⏰ **You have about 60 seconds** before the QR code expires. If it expires, the bot will generate a new one — just check the logs again.

### 5.3 — Verify It's Working

Once scanned, you should see in the logs:

```
WhatsApp Bot is ready!
```

Now test it:
1. If you left `WHITELISTED_GROUPS` empty, the bot responds in **all groups** where it's a member and in **all DMs**
2. In a **group chat**, type the bot's name (e.g. "Hey Jarvis, what's up?")  
3. In a **DM**, just send any message
4. The bot should reply within a few seconds!

### 5.4 — Finding Group IDs (for Whitelisting)

If you want the bot to only work in specific groups:

1. Temporarily set `WHITELISTED_GROUPS` to empty (so the bot responds everywhere)
2. Send a message mentioning the bot in the target group
3. Check the Coolify logs — you'll see the group ID in the format `120363001234567890@g.us`
4. Copy those IDs and add them to the `WHITELISTED_GROUPS` env var (comma-separated)
5. Redeploy

---

## 6. Customize Your Bot

### Change the Personality

Set the `BOT_PERSONALITY` environment variable to any description you want. Examples:

| Style | Value |
|---|---|
| **Chill bro** | `a laid-back California surfer dude who calls everyone "bro"` |
| **Professional** | `a polite and professional executive assistant who is always formal` |
| **Meme lord** | `a gen-z meme expert who responds with internet slang and references` |
| **Pirate** | `a 17th century pirate captain who speaks in nautical terms` |

After changing the env var, click **Redeploy** in Coolify.

### Change the Bot Name

Update the `BOT_NAME` env var. This is the keyword the bot listens for in group chats.

---

## 7. Managing & Troubleshooting

### Viewing Logs
In Coolify: **App → Logs** tab  
Or via SSH:
```bash
docker logs <container_id> --follow
```

### Restarting the Bot
In Coolify: **App → Restart**  
Because you set up persistent storage in Step 4.4, the bot will reconnect automatically without needing a new QR scan.

### Common Issues

| Problem | Solution |
|---|---|
| **QR code garbled in Coolify logs** | SSH into the server and use `docker logs --follow` to see it cleanly |
| **Bot stops responding after a few hours** | This is usually a WhatsApp Web disconnection. Check logs for errors. Restart the container. |
| **"Session expired" or needs new QR** | Make sure persistent storage is correctly mapped (Step 4.4). The `/app/session` directory must survive restarts. |
| **Container crashes immediately** | Your server may not have enough RAM. `whatsapp-web.js` + Chromium needs at least **1.5 GB free RAM**. Check with `free -h` on your server. |
| **"Failed to launch the browser process"** | The Chromium dependencies aren't installed. Make sure you're using the provided `Dockerfile` (not Nixpacks). |
| **Rate limited messages** | The bot silently drops messages from users who exceed 5 messages per 10 minutes. Check logs for "rate limited" entries. |
| **Bot responds in unwanted groups** | Add group IDs to `WHITELISTED_GROUPS` to restrict it. See Section 5.4. |

### Updating the Bot

1. Push changes to your Git repo
2. In Coolify, click **"Deploy"** (or enable auto-deploy on push)
3. The bot will rebuild and restart with your changes
4. Session is preserved — no new QR scan needed

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│              Your VPS (Coolify)              │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │         Docker Container              │  │
│  │                                       │  │
│  │  index.js ──→ whatsapp-web.js         │  │
│  │     │             │                   │  │
│  │     │         Puppeteer + Chromium     │  │
│  │     │             │                   │  │
│  │     │        WhatsApp Web Session     │  │
│  │     │                                 │  │
│  │     └──→ claude.js ──→ Anthropic API  │  │
│  │                                       │  │
│  │  /app/session ←──→ /data/.../session  │  │
│  │   (persistent volume mount)           │  │
│  └───────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Quick Reference — All Environment Variables

```env
# Required
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
BOT_NAME=Jarvis

# Optional
BOT_PERSONALITY=a sarcastic but loyal friend who loves puns and 80s movie references
WHITELISTED_GROUPS=120363001234567890@g.us,120363009876543210@g.us
RATE_LIMIT_MAX=5
RATE_LIMIT_WINDOW_MS=600000
```

---

**That's it! Your bot is now running 24/7 on Coolify.** 🎉
