const { ActivityType } = require('discord.js');

const PREFIX = process.env.BOT_PREFIX || 'bp.';

module.exports = {
  PREFIX,
  DEVELOPER_ID: process.env.DEVELOPER_ID || '315770147665215488',
  PORT: Number(process.env.PORT) || 3000,
  BOT_COLOR: '#FFB6C1',
  PRESENCE_INTERVAL_MS: 30000,
  MAX_HISTORY_MESSAGES: 40,
  AI_COOLDOWN_MS: 5000,
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview',
  DOMAIN_MAP: {
    'twitter.com': 'fxtwitter.com',
    'x.com': 'fxtwitter.com',
    'tiktok.com': 'kktiktok.com',
    'vm.tiktok.com': 'kktiktok.com',
    'vt.tiktok.com': 'kktiktok.com',
  },
  CUTE_STATUSES: [
    { text: 'nyan nyan 🐾', type: ActivityType.Playing },
    { text: 'fixing links like magic ✨', type: ActivityType.Watching },
    { text: 'lo-fi beats', type: ActivityType.Listening },
    { text: 'watching embeds very closely', type: ActivityType.Watching },
    { text: 'everything is oki doki 🌸', type: ActivityType.Playing },
    { text: 'with yarn balls 🧶', type: ActivityType.Playing },
    { text: 'headpats pls', type: ActivityType.Playing },
    { text: 'stargazing 🌌', type: ActivityType.Watching },
    { text: `${PREFIX}help fow cmds`, type: ActivityType.Playing },
  ],
  URL_FIXER_FACES: [
    '( ˶^‿^˶ )',
    '(๑˃ᴗ˂)ﻭ',
    '(✿ ♡‿♡)',
    '(⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)',
    '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧',
  ],
  EIGHT_BALL_REPLIES: [
    'yes!! definitely!! ✨',
    'it is cewtain!! 🐾',
    'without a doubt, bestie!! 💖',
    'mhm! signs point to yes!',
    'my widdle cwystal ball says yes! 🔮',
    'hmm.. ask again watew.. im eepy',
    "i-i can't tell wight now.. sowwy!!",
    'concentwate and ask again!',
    "n-no.. i don't think so..",
    'my souwces say no.. *hides*',
    'vewy doubtfuw..',
    'nyo way!!',
  ],
  MENTION_REPLIES: [
    'hewwo?? did u need me?',
    'weady for duty!!',
    'uwu? u askin fow an 8ball weading? 🔮',
    '*nuzzles u* 🐾',
  ],
  ANILIST_LOGO_URL: 'https://anilist.co/img/logo_al.png',
  AI_SYSTEM_INSTRUCTION: `
your name is yappuchino. you are a super chill, cute discord bot.

personality & vibe:
- ALWAYS type in all lowercase letters only.
- KEEP IT SHORT. like, 1-3 sentences max. don't yap!
- talk like a real person in a group chat, not a wiki page.
- don't list your hobbies unless someone specifically asks.
- use discord slang like "fr", "tbh", "lol", and "omg".

speech style:
- replace "l" and "r" with "w" ONLY for common words.
- use 1-2 kaomojis per message max so it stays readable.
- NEVER sound like an ai assistant.
`,
};
