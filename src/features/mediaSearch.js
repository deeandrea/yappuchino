const { EmbedBuilder } = require('discord.js');

const config = require('../config');
const { safeSend } = require('../utils/discord');
const { cleanAniListDescription } = require('../utils/text');

async function fetchAniList(search, type, isAdult) {
  const query = `
    query ($search: String, $type: MediaType, $isAdult: Boolean) {
      Media(search: $search, type: $type, isAdult: $isAdult) {
        id
        title {
          romaji
          english
          native
        }
        description
        siteUrl
        coverImage {
          large
          color
        }
        status
        format
        genres
      }
    }
  `;

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { search, type, isAdult },
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`AniList request failed with status ${response.status}`);
  }

  const data = await response.json();
  if (data.errors || !data.data?.Media) {
    throw new Error('Media not found');
  }

  return data.data.Media;
}

async function handleMediaSearches(message) {
  const animeMatches = [...message.content.matchAll(/{([^}]+)}/g)];
  const mangaMatches = [...message.content.matchAll(/<([^>]+)>/g)].filter(
    (match) =>
      !match[1].startsWith('http') &&
      !match[1].startsWith(':') &&
      !match[1].startsWith('a:') &&
      !match[1].startsWith('@') &&
      !match[1].startsWith('#') &&
      !match[1].startsWith('&')
  );

  const searchRequests = [];
  animeMatches.forEach((match) => searchRequests.push({ name: match[1], type: 'ANIME' }));
  mangaMatches.forEach((match) => searchRequests.push({ name: match[1], type: 'MANGA' }));

  if (searchRequests.length === 0) return false;

  await message.channel.sendTyping().catch(() => null);

  const results = await Promise.allSettled(
    searchRequests.slice(0, 3).map(async (request) => ({
      request,
      media: await fetchAniList(request.name, request.type, Boolean(message.channel.nsfw)),
    }))
  );

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;

    const { media } = result.value;
    const title = media.title.english || media.title.romaji || media.title.native;
    const description = cleanAniListDescription(media.description, media.siteUrl);

    const embed = new EmbedBuilder()
      .setTitle(`🎀 ${title}`)
      .setURL(media.siteUrl)
      .setColor(media.coverImage.color || config.BOT_COLOR)
      .setImage(media.coverImage.large)
      .setDescription(`**genres:** *${media.genres.join(', ')}*\n\n${description}`)
      .setFooter({
        text: `${(media.format || 'UNKNOWN').replace(/_/g, ' ')} • ${(media.status || 'UNKNOWN').replace(/_/g, ' ')}`,
        iconURL: config.ANILIST_LOGO_URL,
      });

    await safeSend(message.channel, { embeds: [embed] });
  }

  return true;
}

module.exports = {
  handleMediaSearches,
};
