const { Anthropic } = require('@anthropic-ai/sdk');
require('dotenv').config();

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generates a response from Claude with a specific personality.
 * @param {string} prompt - The user's message.
 * @param {string} personality - A description of the personality/style.
 * @returns {Promise<string>} - Claude's response.
 */
async function generateClaudeResponse(prompt, personality = "a helpful and witty assistant") {
    try {
        const response = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 500,
            system: `You are a WhatsApp bot with the following personality: ${personality}. 
            Keep your responses concise (max 3-4 sentences) as they are for a chat app. 
            Do not use excessive formatting. Be conversational and engaging.`,
            messages: [
                { role: "user", content: prompt }
            ],
        });

        return response.content[0].text;
    } catch (error) {
        console.error('Error calling Anthropic API:', error);
        return "Sorry, I'm having a bit of a brain fog right now. Try again later!";
    }
}

module.exports = { generateClaudeResponse };
