const { MongoClient } = require('mongodb');

async function connectDatabase({ uri, logger = console }) {
  if (!uri) {
    return {
      mongoClient: null,
      channelsColl: null,
      historyColl: null,
      chatEnabledChannelIds: new Set(),
    };
  }

  const mongoClient = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  try {
    logger.log('attempting to open the vault...');
    await mongoClient.connect();

    const db = mongoClient.db('yappuchino_bot');
    const channelsColl = db.collection('enabled_channels');
    const historyColl = db.collection('chat_history');

    logger.log('connected to the vault (mongodb)!');

    const savedChannels = await channelsColl.find({}, { projection: { channelId: 1 } }).toArray();
    const chatEnabledChannelIds = new Set(
      savedChannels.map(({ channelId }) => channelId).filter(Boolean)
    );

    logger.log(`loaded ${chatEnabledChannelIds.size} chat-enabled channels from memory!`);

    return {
      mongoClient,
      channelsColl,
      historyColl,
      chatEnabledChannelIds,
    };
  } catch (err) {
    logger.error('mongo connection failed, so persistence is offline:', err);

    try {
      await mongoClient.close();
    } catch {}

    return {
      mongoClient: null,
      channelsColl: null,
      historyColl: null,
      chatEnabledChannelIds: new Set(),
    };
  }
}

async function loadChannelHistory(historyColl, channelId) {
  if (!historyColl) return [];

  const dbHistory = await historyColl.findOne({ channelId });
  if (!dbHistory || !Array.isArray(dbHistory.messages)) return [];

  return dbHistory.messages
    .map((entry) => {
      const text = entry?.parts?.[0]?.text || entry?.content || '';
      const role = entry?.role === 'assistant' ? 'model' : entry?.role;

      if (!text || (role !== 'user' && role !== 'model')) {
        return null;
      }

      return {
        role,
        parts: [{ text }],
      };
    })
    .filter(Boolean);
}

async function persistChannelExchange(
  historyColl,
  channelId,
  prompt,
  responseText,
  maxHistoryMessages
) {
  if (!historyColl) return;

  await historyColl.updateOne(
    { channelId },
    {
      $push: {
        messages: {
          $each: [
            { role: 'user', parts: [{ text: prompt }] },
            { role: 'model', parts: [{ text: responseText }] },
          ],
          $slice: -maxHistoryMessages,
        },
      },
      $set: {
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

module.exports = {
  connectDatabase,
  loadChannelHistory,
  persistChannelExchange,
};
