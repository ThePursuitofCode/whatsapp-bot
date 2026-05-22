const NodeCache = require('node-cache');
require('dotenv').config();

// Cache to store user request counts
// stdTTL is the window in seconds
const rateLimitCache = new NodeCache({ stdTTL: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 });
const globalCooldownCache = new NodeCache({ stdTTL: 5 }); // 5 seconds global cooldown

/**
 * Checks if a user is rate limited.
 * @param {string} userId - The WhatsApp user ID (sender).
 * @returns {boolean} - True if limited, false otherwise.
 */
function isRateLimited(userId) {
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX) || 5;
    
    // Check global cooldown
    if (globalCooldownCache.get('global')) {
        return true;
    }

    const currentRequests = rateLimitCache.get(userId) || 0;
    
    if (currentRequests >= maxRequests) {
        return true;
    }

    // Increment request count
    rateLimitCache.set(userId, currentRequests + 1);
    // Set global cooldown
    globalCooldownCache.set('global', true);
    
    return false;
}

module.exports = { isRateLimited };
