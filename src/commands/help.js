const { EmbedBuilder } = require('discord.js');

const config = require('../config');
const { safeReply } = require('../utils/discord');

const CATEGORY_ORDER = ['General', 'AI & Social', 'Moderation', 'Developer'];

function buildCommandLabel(command) {
  const names = [command.name, ...(command.aliases || [])].map((name) => `${config.PREFIX}${name}`);
  return names.join(' / ');
}

function buildDetailEmbed(command) {
  const aliases = command.aliases?.length
    ? command.aliases.map((alias) => `\`${config.PREFIX}${alias}\``).join(', ')
    : 'none';

  const usage = `\`${config.PREFIX}${command.usage || command.name}\``;

  const embed = new EmbedBuilder()
    .setColor(config.BOT_COLOR)
    .setTitle(`${config.PREFIX}${command.name}`)
    .setDescription(command.description)
    .addFields(
      { name: 'usage', value: usage, inline: false },
      { name: 'aliases', value: aliases, inline: false },
      { name: 'category', value: command.category, inline: true }
    )
    .setFooter({ text: 'tip: passive features still work without a prefix too ✨' });

  if (command.developerOnly) {
    embed.addFields({ name: 'dev only', value: 'yes', inline: true });
  }

  return embed;
}

module.exports = {
  name: 'help',
  aliases: ['cmds'],
  category: 'General',
  description: 'shows my command menu and command details',
  usage: 'help [command]',
  async execute({ message, args, context }) {
    const isDeveloper = message.author.id === config.DEVELOPER_ID;
    const visibleCommands = context.commandRegistry.commands.filter(
      (command) => isDeveloper || !command.developerOnly
    );

    if (args[0]) {
      const target = context.commandRegistry.get(args[0]);

      if (!target || (!isDeveloper && target.developerOnly)) {
        await safeReply(message, `i couldn't find that one... twy \`${config.PREFIX}help\`!`);
        return;
      }

      await safeReply(message, { embeds: [buildDetailEmbed(target)] });
      return;
    }

    const groupedCommands = new Map();

    for (const command of visibleCommands) {
      if (!groupedCommands.has(command.category)) {
        groupedCommands.set(command.category, []);
      }

      groupedCommands.get(command.category).push(command);
    }

    const embed = new EmbedBuilder()
      .setColor(config.BOT_COLOR)
      .setTitle('hewwo! here are my cmds!')
      .setDescription(
        'my passive stuff still works without commands, but these prefix cmds are easier to manage now too!'
      )
      .setFooter({ text: `tip: twy ${config.PREFIX}help <command> fow details` });

    for (const category of CATEGORY_ORDER) {
      const commands = groupedCommands.get(category);
      if (!commands?.length) continue;

      const value = commands
        .map((command) => `\`${buildCommandLabel(command)}\` - ${command.description}`)
        .join('\n');

      embed.addFields({
        name: category,
        value,
        inline: false,
      });
    }

    await safeReply(message, { embeds: [embed] });
  },
};
