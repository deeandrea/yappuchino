process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

require('dotenv').config();

const path = require('path');
const express = require('express');
const { Client, Events, GatewayIntentBits } = require('discord.js');

const config = require('./src/config');
const { loadCommands } = require('./src/commands/loadCommands');
const { handleAIChat } = require('./src/features/aiChat');
const { handleMagic8Ball } = require('./src/features/magic8Ball');
const { handleMediaSearches } = require('./src/features/mediaSearch');
const { handleUrlFixes } = require('./src/features/urlFixer');
const { updatePresence } = require('./src/presence');
const { createAIModel } = require('./src/services/ai');
const {
  connectDatabase,
  loadChannelHistory,
  persistChannelExchange,
} = require('./src/services/database');
const { safeReact, safeReply } = require('./src/utils/discord');

const app = express();
const runtime = {
  httpServer: null,
  presenceInterval: null,
  isShuttingDown: false,
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

const state = {
  chatEnabledChannels: new Set(),
  chatSessions: new Map(),
  channelProcessingLocks: new Set(),
  aiCooldowns: new Map(),
};

const dbState = {
  mongoClient: null,
  channelsColl: null,
  historyColl: null,
};

const yappuchinoAI = createAIModel({
  apiKey: process.env.GEMINI_API_KEY,
  model: config.GEMINI_MODEL,
  systemInstruction: config.AI_SYSTEM_INSTRUCTION,
});

const commandRegistry = loadCommands(path.join(__dirname, 'src', 'commands'));

app.get('/', (_req, res) => {
  res.send('Bot is alive!');
});

function validateEnvironment() {
  if (!process.env.DISCORD_TOKEN) {
    throw new Error('DISCORD_TOKEN is required.');
  }

  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is missing. AI chat features will stay disabled.');
  }

  if (!process.env.MONGO_URI) {
    console.warn(
      'MONGO_URI is missing. Enabled chat channels and AI history will only last until restart.'
    );
  }
}

async function startWebServer() {
  runtime.httpServer = await new Promise((resolve, reject) => {
    const server = app.listen(config.PORT, () => {
      console.log(`Web server running on port ${config.PORT}`);
      resolve(server);
    });

    server.once('error', reject);
  });
}

async function connectDB() {
  const result = await connectDatabase({
    uri: process.env.MONGO_URI,
    logger: console,
  });

  dbState.mongoClient = result.mongoClient;
  dbState.channelsColl = result.channelsColl;
  dbState.historyColl = result.historyColl;

  result.chatEnabledChannelIds.forEach((channelId) => {
    state.chatEnabledChannels.add(channelId);
  });
}

function getRuntimeContext() {
  return {
    client,
    config,
    state,
    commandRegistry,
    shutdown,
    services: {
      aiModel: yappuchinoAI,
      getCollections() {
        return {
          channelsColl: dbState.channelsColl,
          historyColl: dbState.historyColl,
        };
      },
      loadChannelHistory(channelId) {
        return loadChannelHistory(dbState.historyColl, channelId);
      },
      persistChannelExchange(channelId, prompt, responseText) {
        return persistChannelExchange(
          dbState.historyColl,
          channelId,
          prompt,
          responseText,
          config.MAX_HISTORY_MESSAGES
        );
      },
    },
  };
}

async function shutdown(reason, exitCode = 0) {
  if (runtime.isShuttingDown) return;
  runtime.isShuttingDown = true;

  console.log(`Shutting down (${reason})...`);

  if (runtime.presenceInterval) {
    clearInterval(runtime.presenceInterval);
    runtime.presenceInterval = null;
  }

  if (runtime.httpServer) {
    await Promise.race([
      new Promise((resolve) => runtime.httpServer.close(() => resolve())),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
    runtime.httpServer = null;
  }

  if (dbState.mongoClient) {
    try {
      await dbState.mongoClient.close();
    } catch (err) {
      console.error('Failed to close Mongo cleanly:', err);
    }
  }

  try {
    client.destroy();
  } catch {}

  process.exit(exitCode);
}

async function checkCommandAccess(command, message) {
  if (command.developerOnly && message.author.id !== config.DEVELOPER_ID) {
    await safeReply(message, 'that cmd is dev-only, sowwy!');
    return false;
  }

  if (
    command.requiredUserPermissions &&
    !message.member?.permissions.has(command.requiredUserPermissions)
  ) {
    await safeReply(
      message,
      command.userPermissionError || "n-no! u don't have pewmission for that!"
    );
    return false;
  }

  if (
    command.requiredBotPermissions &&
    !message.guild.members.me
      ?.permissionsIn(message.channel)
      .has(command.requiredBotPermissions)
  ) {
    await safeReply(
      message,
      command.botPermissionError || "i-i don't have the pewmissions fow that..."
    );
    return false;
  }

  return true;
}

async function handlePrefixCommand(message) {
  if (!message.content.toLowerCase().startsWith(config.PREFIX.toLowerCase())) {
    return false;
  }

  const rawInput = message.content.slice(config.PREFIX.length).trim();
  if (!rawInput) {
    await safeReply(message, `twy \`${config.PREFIX}help\` if u need my cmds!`);
    return true;
  }

  const args = rawInput.split(/\s+/);
  const commandName = (args.shift() || '').toLowerCase();
  const command = commandRegistry.get(commandName);

  if (!command) {
    await safeReply(message, `i don't know that cmd yet... twy \`${config.PREFIX}help\`!`);
    return true;
  }

  if (!(await checkCommandAccess(command, message))) {
    return true;
  }

  try {
    await command.execute({
      message,
      args,
      context: getRuntimeContext(),
      command,
    });
  } catch (error) {
    console.error(`Command "${command.name}" failed:`, error);
    await safeReply(message, 's-sowwy... that cmd bonked my bwain a little');
  }

  return true;
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`yappuchino is online as ${readyClient.user.tag}`);
  updatePresence(readyClient);
  runtime.presenceInterval = setInterval(
    () => updatePresence(readyClient),
    config.PRESENCE_INTERVAL_MS
  );
});

client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

client.on(Events.MessageCreate, async (message) => {
  try {
    if (message.author.bot || !message.guild) return;

    const msgLower = message.content.toLowerCase();

    if (msgLower.includes('good bot')) {
      await safeReact(message, '💖');
    } else if (msgLower.includes('bad bot')) {
      await safeReact(message, '🥺');
    }

    if (await handlePrefixCommand(message)) return;

    await handleMediaSearches(message, getRuntimeContext());

    if (await handleUrlFixes(message, getRuntimeContext())) return;
    if (await handleMagic8Ball(message, getRuntimeContext())) return;

    await handleAIChat(message, getRuntimeContext());
  } catch (error) {
    console.error('Message handler error:', error);
  }
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    void shutdown(signal);
  });
}

async function startBot() {
  validateEnvironment();
  await startWebServer();
  await connectDB();
  await client.login(process.env.DISCORD_TOKEN);
}

void startBot().catch(async (err) => {
  console.error('Fatal Startup Error:', err);
  await shutdown('startup failure', 1);
});
