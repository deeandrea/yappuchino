const { PermissionsBitField } = require('discord.js');

const { safeReply } = require('../utils/discord');

module.exports = {
  name: 'disablechat',
  aliases: [],
  category: 'AI & Social',
  description: 'silences ai chat in this channel and clears saved memory',
  usage: 'disablechat',
  requiredUserPermissions: [PermissionsBitField.Flags.ManageChannels],
  userPermissionError: 'n-no! only mods can teww me to stop!',
  async execute({ message, context }) {
    const { chatEnabledChannels, chatSessions } = context.state;
    const { channelsColl, historyColl } = context.services.getCollections();

    chatEnabledChannels.delete(message.channel.id);
    chatSessions.delete(message.channel.id);

    if (channelsColl) {
      await channelsColl.deleteOne({ channelId: message.channel.id });
    }

    if (historyColl) {
      await historyColl.deleteOne({ channelId: message.channel.id });
    }

    await safeReply(message, "oki doki... i've fowgotten this place now. nite nite!");
  },
};
