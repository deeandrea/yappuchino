const { safeReply } = require('../utils/discord');

module.exports = {
  name: 'restart',
  aliases: [],
  category: 'Developer',
  description: 'safely shuts the bot down so the process can restart',
  usage: 'restart',
  developerOnly: true,
  async execute({ message, context }) {
    await safeReply(message, 'nite nite.. westawting now!');
    await context.shutdown('restart command');
  },
};
