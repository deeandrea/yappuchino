const config = require('./config');
const { getRandomItem } = require('./utils/text');

function updatePresence(client) {
  if (!client?.user) return;

  const status = getRandomItem(config.CUTE_STATUSES);

  try {
    client.user.setPresence({
      activities: [{ name: status.text, type: status.type }],
      status: 'online',
    });
  } catch (err) {
    console.error('Failed to update presence:', err);
  }
}

module.exports = {
  updatePresence,
};
