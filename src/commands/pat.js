const { safeReply, safeSend } = require('../utils/discord');

module.exports = {
  name: 'pat',
  aliases: [],
  category: 'AI & Social',
  description: 'give someone soft headpats',
  usage: 'pat <@user>',
  async execute({ message }) {
    const target = message.mentions.users.first();

    if (!target) {
      await safeReply(message, 'u gotta ping someone to pat them!');
      return;
    }

    if (target.id === message.client.user.id) {
      await safeReply(message, 'aww.. u wanna pat me?? *blushes*');
      return;
    }

    if (target.id === message.author.id) {
      await safeReply(message, "giving urself pats?? i'll pat u instead! *pats u* 💖");
      return;
    }

    await safeSend(
      message.channel,
      `**${target.username}**, u got soft headpats fwom **${message.author.username}**! 🐾✨`
    );
  },
};
