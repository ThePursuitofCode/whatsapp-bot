# WhatsApp Anthropic Bot

A fun WhatsApp bot powered by Anthropic's Claude API with personality-driven responses and anti-abuse checks.

## Features
- **Personality Engine:** Uses Claude 3.5 Sonnet to respond with a specific tone.
- **Mention Detection:** Responds when mentioned (@Bot) or when its name is typed in a group.
- **Rate Limiting:** Prevents spam by limiting requests per user and enforcing a global cooldown.
- **Whitelisting:** Optional group ID whitelist to control where the bot operates.
- **Persistent Session:** Stays logged in using `LocalAuth`.

## Setup
1. **Clone/Copy** this directory.
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment:**
   - Copy `.env.example` to `.env`.
   - Add your `ANTHROPIC_API_KEY`.
   - Set your `BOT_NAME`.
   - (Optional) Add `WHITELISTED_GROUPS` (comma-separated IDs like `1234567890@g.us`).
4. **Run the Bot:**
   ```bash
   node index.js
   ```
5. **Authenticate:**
   - Scan the QR code that appears in your terminal using WhatsApp on your phone (Linked Devices).

## Anti-Abuse Checks
- **Rate Limit:** Defaults to 5 requests per 10 minutes per user.
- **Global Cooldown:** 5-second pause between any two bot responses.
- **Self-Filtering:** Ignores its own messages to prevent infinite loops.
- **Whitelist:** Only works in pre-approved groups if configured.

## Customization
To change the bot's personality, edit the `personality` string in `index.js`.
