const config = require('../config');
const { safeReact, safeReply } = require('../utils/discord');
const { truncate } = require('../utils/text');

async function handleAIChat(message, context) {
  const { chatEnabledChannels, aiCooldowns, channelProcessingLocks, chatSessions } = context.state;
  const { aiModel } = context.services;

  if (!chatEnabledChannels.has(message.channel.id) || !aiModel) {
    return false;
  }

  if (!message.content || !message.content.trim()) {
    return false;
  }

  const lastCooldown = aiCooldowns.get(message.author.id) || 0;
  if (Date.now() - lastCooldown < config.AI_COOLDOWN_MS) {
    await safeReact(message, '⏳');
    return true;
  }

  aiCooldowns.set(message.author.id, Date.now());

  if (channelProcessingLocks.has(message.channel.id)) {
    await safeReact(message, '⏳');
    return true;
  }

  channelProcessingLocks.add(message.channel.id);

  try {
    await message.channel.sendTyping().catch(() => null);

    let chat = chatSessions.get(message.channel.id);

    if (!chat) {
      const history = await context.services.loadChannelHistory(message.channel.id);
      chat = aiModel.startChat({
        history,
        generationConfig: {
          maxOutputTokens: 500,
        },
      });

      chatSessions.set(message.channel.id, chat);
    }

    const prompt = `[${message.author.username}]: ${message.cleanContent}`;
    const result = await chat.sendMessage(prompt);
    const rawResponse = result.response.text().trim();
    const responseText = rawResponse || 'my bwain went blank fow a sec.. twy again?';

    await context.services.persistChannelExchange(message.channel.id, prompt, responseText);
    await safeReply(message, truncate(responseText, 2000));
    return true;
  } catch (error) {
    console.error('Gemini API Error:', error);
    chatSessions.delete(message.channel.id);
    await safeReply(message, 's-sowwy... my bwain is huwting wight now');
    return true;
  } finally {
    channelProcessingLocks.delete(message.channel.id);
  }
}

module.exports = {
  handleAIChat,
};
