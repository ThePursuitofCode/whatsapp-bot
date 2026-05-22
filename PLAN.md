# WhatsApp Anthropic Bot Implementation Plan

## 1. Tech Stack
- **Runtime:** Node.js
- **WhatsApp Library:** `whatsapp-web.js` (Easiest for group interaction)
- **AI API:** Anthropic SDK (`@anthropic-ai/sdk`)
- **Utilities:** `qrcode-terminal` (for login), `dotenv` (secrets), `node-cache` (rate limiting)

## 2. Project Structure
- `index.js`: Main entry point and WhatsApp client logic.
- `claude.js`: Anthropic API integration and personality management.
- `middleware/`:
  - `rateLimiter.js`: Handles anti-abuse checks.
  - `filters.js`: Content filtering logic.
- `.env`: API keys and configuration.
- `session/`: Directory to store WhatsApp session (persistent login).

## 3. Anti-Abuse Strategy
- **Per-User Rate Limit:** Maximum 5 requests per 10 minutes per user.
- **Global Cooldown:** 5-second delay between any two responses to prevent message loops.
- **Whitelisted Groups:** The bot will only respond in specific group IDs (to prevent it being added to random groups).
- **Max Response Length:** Claude will be instructed to keep responses under a certain token limit.
- **Content Filter:** Basic keyword blocking and safety instructions in the system prompt.

## 4. Implementation Steps
1. **Initialize Project:** `npm init -y` and install dependencies.
2. **Setup WhatsApp Client:** Implement QR code generation and session persistence using `LocalAuth`.
3. **Claude Integration:** Setup the Anthropic client and a `generateResponse` function with a custom system prompt.
4. **Logic Loop:**
   - Detect `@BotName` in group messages.
   - Run rate limit and whitelist checks.
   - Call Claude API.
   - Send response back to the group.
5. **Testing:** Test in a private group first.
