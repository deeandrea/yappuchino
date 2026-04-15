function withSafeMentions(payload, repliedUser = false) {
  const normalized = typeof payload === 'string' ? { content: payload } : { ...payload };
  const existing = normalized.allowedMentions || {};

  normalized.allowedMentions = {
    parse: existing.parse ?? [],
    repliedUser: existing.repliedUser ?? repliedUser,
  };

  if (existing.users) normalized.allowedMentions.users = existing.users;
  if (existing.roles) normalized.allowedMentions.roles = existing.roles;

  return normalized;
}

async function safeReply(message, payload) {
  return message.reply(withSafeMentions(payload)).catch(() => null);
}

async function safeSend(channel, payload) {
  return channel.send(withSafeMentions(payload)).catch(() => null);
}

async function safeReact(message, emoji) {
  return message.react(emoji).catch(() => null);
}

module.exports = {
  safeReact,
  safeReply,
  safeSend,
  withSafeMentions,
};
