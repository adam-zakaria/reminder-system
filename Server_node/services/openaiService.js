const OpenAI = require('openai');
const openai = new OpenAI(process.env.OPENAI_API_KEY);

// Generate response from OpenAI chat model
async function generateChatResponse(promptMessages) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: promptMessages,
    max_tokens: 150
  });
  return completion.choices[0].message.content.trim();
}

// Create a new thread for chat
async function createThread() {
  const thread = await openai.beta.threads.create();
  return thread;
}

module.exports = { generateChatResponse, createThread };
