const { safeReply, safeSend } = require('../utils/discord');

module.exports = {
  name: 'hug',
  aliases: [],
  category: 'AI & Social',
  description: 'give someone a big warm hug',
  usage: 'hug <@user>',
  async execute({ message }) {
    const target = message.mentions.users.first();

    if (!target) {
      await safeReply(message, 'u gotta ping someone to hug them!');
      return;
    }

    if (target.id === message.client.user.id) {
      await safeReply(message, 'aww.. u wanna hug me?? *blushes*');
      return;
    }

    if (target.id === message.author.id) {
      await safeReply(message, "giving urself a hug?? i'll hug u instead! *hugs u* 💖");
      return;
    }

    await safeSend(
      message.channel,
      `**${target.username}**, u got a big squishy hug fwom **${message.author.username}**! 🫂💖`
    );
  },
};
