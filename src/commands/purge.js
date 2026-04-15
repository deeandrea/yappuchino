const { PermissionsBitField } = require('discord.js');

const { safeReply, safeSend } = require('../utils/discord');

module.exports = {
  name: 'purge',
  aliases: ['cwean'],
  category: 'Moderation',
  description: 'bulk deletes recent messages',
  usage: 'purge <1-99>',
  requiredUserPermissions: [PermissionsBitField.Flags.ManageMessages],
  requiredBotPermissions: [PermissionsBitField.Flags.ManageMessages],
  userPermissionError: "n-no! u don't have pewmission to cwean messages!",
  botPermissionError: "i-i don't have `Manage Messages` hewe...",
  async execute({ message, args }) {
    const amount = Number.parseInt(args[0], 10);

    if (Number.isNaN(amount) || amount < 1 || amount > 99) {
      await safeReply(message, 'pwease gib me a numbew between 1 and 99!');
      return;
    }

    try {
      const deleted = await message.channel.bulkDelete(amount + 1, true);
      const deletedCount = Math.max(0, deleted.size - 1);

      const confirmation = await safeSend(
        message.channel,
        `yay!! i cweaned **${deletedCount}** messages fow u! 🧹✨`
      );

      if (confirmation) {
        setTimeout(() => {
          confirmation.delete().catch(() => null);
        }, 5000);
      }
    } catch {
      await safeReply(message, "i couldn't cwean those messages... maybe they're too owd?");
    }
  },
};
