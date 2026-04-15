const config = require('../config');
const { safeReply } = require('../utils/discord');
const { getRandomItem } = require('../utils/text');

async function handleMagic8Ball(message, context) {
  if (
    context.state.chatEnabledChannels.has(message.channel.id) ||
    !message.mentions.has(message.client.user)
  ) {
    return false;
  }

  const textWithoutPing = message.content
    .replace(new RegExp(`<@!?${message.client.user.id}>`, 'g'), '')
    .trim();

  if (textWithoutPing.length > 0) {
    await safeReply(message, getRandomItem(config.EIGHT_BALL_REPLIES));
    return true;
  }

  await safeReply(message, getRandomItem(config.MENTION_REPLIES));
  return true;
}

module.exports = {
  handleMagic8Ball,
};
