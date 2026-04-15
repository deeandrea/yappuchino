const { EmbedBuilder } = require('discord.js');

const config = require('../config');
const { safeReply } = require('../utils/discord');
const { formatUptime } = require('../utils/text');

module.exports = {
  name: 'stats',
  aliases: ['info'],
  category: 'Developer',
  description: 'shows ping, uptime, memory, and runtime status',
  usage: 'stats',
  developerOnly: true,
  async execute({ message, context }) {
    const { channelsColl, historyColl } = context.services.getCollections();
    const memoryUsageMb = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

    const embed = new EmbedBuilder()
      .setColor(config.BOT_COLOR)
      .setAuthor({
        name: 'my widdle stats!',
        iconURL: message.client.user.displayAvatarURL({ size: 256 }),
      })
      .addFields(
        {
          name: 'awake fow',
          value: `\`${formatUptime(message.client.uptime || 0)}\``,
          inline: true,
        },
        {
          name: 'ping',
          value: `\`${message.client.ws.ping}ms\``,
          inline: true,
        },
        {
          name: 'memowy',
          value: `\`${memoryUsageMb} MB\``,
          inline: true,
        },
        {
          name: 'sewvews',
          value: `\`${message.client.guilds.cache.size}\` cozy homes`,
          inline: true,
        },
        {
          name: 'commands',
          value: `\`${context.commandRegistry.commands.length}\` loaded`,
          inline: true,
        },
        {
          name: 'database',
          value: channelsColl && historyColl ? '`online`' : '`offline`',
          inline: true,
        },
        {
          name: 'ai',
          value: context.services.aiModel ? `\`${config.GEMINI_MODEL}\`` : '`disabled`',
          inline: true,
        }
      )
      .setFooter({ text: 'wowking hawd to fix ur winks! 💖' });

    await safeReply(message, { embeds: [embed] });
  },
};
