const { EmbedBuilder } = require('discord.js');

const config = require('../config');
const { safeReply } = require('../utils/discord');

module.exports = {
  name: 'avatar',
  aliases: ['av'],
  category: 'General',
  description: "shows someone's pwofile pictuwe",
  usage: 'avatar [@user]',
  async execute({ message }) {
    const target = message.mentions.users.first() || message.author;

    const embed = new EmbedBuilder()
      .setColor(config.BOT_COLOR)
      .setTitle(`${target.username}'s pwofile pictuwe!`)
      .setImage(target.displayAvatarURL({ size: 512 }))
      .setFooter({ text: 'so pwetty!' });

    await safeReply(message, { embeds: [embed] });
  },
};
