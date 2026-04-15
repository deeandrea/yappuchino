const { EmbedBuilder } = require('discord.js');

const config = require('../config');
const { safeReply } = require('../utils/discord');

module.exports = {
  name: 'serverinfo',
  aliases: ['server'],
  category: 'General',
  description: 'shows info about this sewvew',
  usage: 'serverinfo',
  async execute({ message }) {
    const { guild } = message;

    const embed = new EmbedBuilder()
      .setColor(config.BOT_COLOR)
      .setAuthor({
        name: guild.name,
        iconURL: guild.iconURL({ size: 256 }) || undefined,
      })
      .addFields(
        { name: 'ownew', value: `<@${guild.ownerId}>`, inline: true },
        { name: 'membews', value: `${guild.memberCount} cuties`, inline: true },
        {
          name: 'cweated',
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
          inline: true,
        }
      )
      .setFooter({ text: 'such a cozy home!' });

    await safeReply(message, { embeds: [embed] });
  },
};
