const { EmbedBuilder, PermissionsBitField } = require('discord.js');

const config = require('../config');
const { safeSend } = require('../utils/discord');
const {
  createUrlRegex,
  extractCreatorHandle,
  getRandomItem,
  truncate,
} = require('../utils/text');

const urlRegex = createUrlRegex(config.DOMAIN_MAP);

async function handleUrlFixes(message) {
  urlRegex.lastIndex = 0;
  const urlMatches = [...message.content.matchAll(urlRegex)];
  if (urlMatches.length === 0) return false;

  const fixedEntries = [];
  let originalText = message.content;

  for (const match of urlMatches) {
    const fullMatch = match[0];
    const matchIndex = match.index ?? -1;
    const isWrappedInAngleBrackets =
      matchIndex > 0 &&
      message.content[matchIndex - 1] === '<' &&
      message.content[matchIndex + fullMatch.length] === '>';

    if (isWrappedInAngleBrackets) continue;

    const cleanMatch = fullMatch.replace(/[.,;!)\]'"<>]+$/, '');
    if (!cleanMatch) continue;

    try {
      const parsedUrl = new URL(cleanMatch);
      const hostname = parsedUrl.hostname.replace(/^www\./, '');
      const replacementDomain = config.DOMAIN_MAP[hostname];

      if (!replacementDomain) continue;
      if (fixedEntries.some((entry) => entry.originalUrl === cleanMatch)) continue;

      parsedUrl.hostname = replacementDomain;

      fixedEntries.push({
        originalUrl: cleanMatch,
        proxyUrl: parsedUrl.toString(),
        handle: extractCreatorHandle(cleanMatch),
      });

      originalText = originalText.split(cleanMatch).join('');
    } catch {}
  }

  if (fixedEntries.length === 0) return false;

  const hasAttachments = message.attachments.size > 0;
  const isReply = message.reference !== null;
  const shouldKeepOriginalMessage = hasAttachments || isReply;
  const botPerms = message.guild.members.me?.permissionsIn(message.channel);

  let needsPerms = false;
  let messageDeleted = false;

  if (!shouldKeepOriginalMessage) {
    if (botPerms?.has(PermissionsBitField.Flags.ManageMessages)) {
      try {
        await message.delete();
        messageDeleted = true;
      } catch (err) {
        if (err.code === 50013) {
          needsPerms = true;
        }
      }
    } else {
      needsPerms = true;
    }
  }

  if (!messageDeleted && botPerms?.has(PermissionsBitField.Flags.ManageMessages)) {
    try {
      await message.suppressEmbeds(true);
    } catch {}
  }

  const cleanedText = truncate(originalText.replace(/\s+/g, ' ').trim(), 1000);

  const embed = new EmbedBuilder()
    .setColor(config.BOT_COLOR)
    .setAuthor({
      name: `${message.member?.displayName || message.author.username} shawed a post! ${getRandomItem(config.URL_FIXER_FACES)}`,
      iconURL: message.author.displayAvatarURL({ size: 256 }),
    });

  if (cleanedText) {
    embed.setDescription(`> 💬 *${cleanedText}*`);
  }

  fixedEntries.forEach((entry) => {
    embed.addFields({
      name: `creator: ${entry.handle}`,
      value: `[click to view owiginal](${entry.originalUrl})`,
      inline: false,
    });
  });

  let warningText = null;
  if (needsPerms) {
    warningText = '*(psst.. mods! i need `Manage Messages` to cwean up the owiginal message)*';
  } else if (!messageDeleted && shouldKeepOriginalMessage) {
    warningText = "*(psst.. i didn't dewete the owiginal so we wouldn't lose attachments or a weply chain!)*";
  }

  await safeSend(message.channel, {
    content: warningText || undefined,
    embeds: [embed],
  });

  await safeSend(message.channel, {
    content: fixedEntries.map((entry) => entry.proxyUrl).join('\n'),
  });

  return true;
}

module.exports = {
  handleUrlFixes,
};
