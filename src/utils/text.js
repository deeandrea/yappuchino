function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function truncate(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

function formatUptime(ms = 0) {
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((ms % (60 * 1000)) / 1000);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(' ');
}

function cleanAniListDescription(description, siteUrl) {
  if (!description) return 'no description avaiwable...';

  const cleanDescription = description
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .trim();

  if (cleanDescription.length <= 300) return cleanDescription;
  return `${cleanDescription.slice(0, 300)}... [read morwe](${siteUrl})`;
}

function extractCreatorHandle(urlStr) {
  try {
    const url = new URL(urlStr);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const hostname = url.hostname.replace(/^www\./, '');

    if (hostname.includes('tiktok')) {
      return pathParts.find((part) => part.startsWith('@')) || 'TikTok Creator';
    }

    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return pathParts[0] ? `@${pathParts[0]}` : 'Twitter User';
    }

    return 'Creator';
  } catch {
    return 'Creator';
  }
}

function createUrlRegex(domainMap) {
  const escapedDomains = Object.keys(domainMap)
    .map((domain) => domain.replace(/\./g, '\\.'))
    .join('|');

  return new RegExp(`https?:\\/\\/(www\\.)?(${escapedDomains})\\/[^\\s]+`, 'gi');
}

module.exports = {
  cleanAniListDescription,
  createUrlRegex,
  extractCreatorHandle,
  formatUptime,
  getRandomItem,
  truncate,
};
