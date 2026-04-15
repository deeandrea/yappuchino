const { PermissionsBitField } = require('discord.js');

const { safeReply } = require('../utils/discord');

module.exports = {
  name: 'enablechat',
  aliases: [],
  category: 'AI & Social',
  description: 'lets the ai chat in this channel',
  usage: 'enablechat',
  requiredUserPermissions: [PermissionsBitField.Flags.ManageChannels],
  userPermissionError: 'n-no! only mods can let me tawk hewe!',
  async execute({ message, context }) {
    const { aiModel, getCollections } = context.services;

    if (!aiModel) {
      await safeReply(
        message,
        "i can't turn on ai chat wight now because `GEMINI_API_KEY` is missing."
      );
      return;
    }

    const { chatEnabledChannels } = context.state;
    const { channelsColl, historyColl } = getCollections();

    chatEnabledChannels.add(message.channel.id);

    if (channelsColl) {
      await channelsColl.updateOne(
        { channelId: message.channel.id },
        {
          $set: {
            channelId: message.channel.id,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    const memoryNote = historyColl
      ? "yay!! i'll remember to tawk hewe even if i take a nap! ✨"
      : "yay!! i can tawk hewe now, but without mongo i'll fowget after a restart!";

    await safeReply(message, memoryNote);
  },
};
