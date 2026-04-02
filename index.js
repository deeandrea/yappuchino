require('dotenv').config();
const { Client, GatewayIntentBits, Events, ActivityType, PermissionsBitField, EmbedBuilder } = require('discord.js');
const express = require("express");
const { MongoClient } = require('mongodb');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- WEB SERVER ---
const app = express();
app.get("/", (req, res) => res.send("Bot is alive!"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));

// --- DISCORD CLIENT ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ]
});

const DEVELOPER_ID = '315770147665215488';
const PREFIX = 'bp.';

// --- MONGODB SETUP ---
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db, channelsColl, historyColl;
let chatEnabledChannels = new Set();
const chatSessions = new Map();

const isProcessing = new Set(); 
const aiCooldowns = new Map();

async function connectDB() {
    try {
        console.log("☁️  attempting to open the vault...");
        await mongoClient.connect();
        db = mongoClient.db('yappuchino_bot');
        channelsColl = db.collection('enabled_channels');
        historyColl = db.collection('chat_history');
        console.log("✨ connected to the vault (mongodb)!! ✨");

        const savedChannels = await channelsColl.find().toArray();
        savedChannels.forEach(ch => chatEnabledChannels.add(ch.channelId));
        console.log(`🌸 loaded ${chatEnabledChannels.size} channels fwom memowy!`);
    } catch (err) {
        console.error("aww, mongo broke: ", err);
    }
}

// --- GEMINI AI SETUP ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const yappuchinoAI = genAI.getGenerativeModel({ 
model: "gemini-3.1-flash-lite-preview",
    systemInstruction: `
    your name is yappuchino. you are a super chill, cute discord bot.
    
    personality & vibe:
    - ALWAYS type in all lowercase letters only.
    - KEEP IT SHORT. like, 1-3 sentences max. don't yap! 
    - talk like a real person in a group chat, not a wiki page.
    - don't list your hobbies (kittens, guitar, coding) unless someone specifically asks about them.
    - use discord slang like "fr", "tbh", "lol", and "omg".
    
    speech style:
    - replace "l" and "r" with "w" ONLY for common words (e.g., "hewwo", "vewy", "bestiew").
    - use 1-2 kaomojis per message max so it's not messy.
    - NEVER sound like an AI assistant.
`,
});

// --- URL & DOMAIN STUFF ---
const domainMap = {
    'twitter.com': 'fxtwitter.com',
    'x.com': 'fxtwitter.com',
    'tiktok.com': 'kktiktok.com', 
    'vm.tiktok.com': 'kktiktok.com',
    'vt.tiktok.com': 'kktiktok.com'
};

const escapedDomains = Object.keys(domainMap).map(d => d.replace(/\./g, '\\.')).join('|');
const urlRegex = new RegExp(`https?:\\/\\/(www\\.)?(${escapedDomains})\\/[^\\s]+`, 'gi');

function extractCreatorHandle(urlStr, hostname) {
    try {
        const url = new URL(urlStr);
        const pathParts = url.pathname.split('/').filter(p => p.length > 0);
        if (hostname.includes('tiktok')) {
            const handle = pathParts.find(p => p.startsWith('@'));
            return handle || 'TikTok Creator';
        }
        if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
            return pathParts[0] ? `@${pathParts[0]}` : 'Twitter User';
        }
        return 'Creator';
    } catch (e) { return 'Creator'; }
}

// --- HELPERS ---
async function fetchAniList(search, type, isAdult) {
    const query = `
    query ($search: String, $type: MediaType, $isAdult: Boolean) {
      Media (search: $search, type: $type, isAdult: $isAdult) {
        id title { romaji english native } description siteUrl
        coverImage { large color } status format genres
      }
    }`;
    const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query, variables: { search, type, isAdult } })
    });
    const data = await response.json();
    if (data.errors || !data.data || !data.data.Media) throw new Error('Media not found');
    return data.data.Media;
}

function formatUptime(ms) {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    let timeStr = '';
    if (days > 0) timeStr += `${days}d `;
    if (hours > 0) timeStr += `${hours}h `;
    if (minutes > 0) timeStr += `${minutes}m `;
    timeStr += `${seconds}s`;
    return timeStr.trim();
}

const cuteStatuses = [
    { text: 'nyan nyan 🐾', type: ActivityType.Playing },
    { text: 'f-fixing uwur winks~ ✨', type: ActivityType.Watching },
    { text: 'lo-fi beats (˘⌣˘)🎵', type: ActivityType.Listening },
    { text: 'w-wooking at embeds (owo)', type: ActivityType.Watching },
    { text: 'everything is oki doki 🌸', type: ActivityType.Custom },
    { text: 'with yarn balls 🧶', type: ActivityType.Playing },
    { text: 'headpats pls (⁄ ⁄•⁄ω⁄•⁄ ⁄)', type: ActivityType.Custom },
    { text: 'stargazing 🌌✨', type: ActivityType.Watching },
    { text: 'bp.help fow cmds! 🎀', type: ActivityType.Playing }
];

function updatePresence() {
    const status = cuteStatuses[Math.floor(Math.random() * cuteStatuses.length)];
    client.user.setPresence({ activities: [{ name: status.text, type: status.type }], status: 'online' });
}

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;
    const msgLower = message.content.toLowerCase();
    
    if (msgLower.includes('good bot')) message.react('💖').catch(() => {});
    else if (msgLower.includes('bad bot')) message.react('🥺').catch(() => {});

    if (msgLower.startsWith(PREFIX)) {
        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'help' || command === 'cmds') {
            const helpEmbed = new EmbedBuilder()
                .setColor('#FFB6C1')
                .setTitle('🎀 hewwo! here are my cmds! 🎀')
                .setDescription('i mostly just sit hewe and fix ur messy social media links automatically!')
                .addFields(
                    { name: `🛠️ ${PREFIX}help`, value: 'shows this menu!' },
                    { name: `🖼️ ${PREFIX}avatar <@user>`, value: 'shows a pfp!' },
                    { name: `🧹 ${PREFIX}purge <num>`, value: 'cleans up messages!' },
                    { name: `🤫 ${PREFIX}enablechat / ${PREFIX}disablechat`, value: 'toggles my brain!' }
                )
                .setFooter({ text: 'pwovided with wuv by uwur dev 💕' });

            if (message.author.id === DEVELOPER_ID) {
                helpEmbed.addFields({ name: `👑 Dev Only`, value: `**${PREFIX}restart** / **${PREFIX}stats**` });
            }
            return message.reply({ embeds: [helpEmbed] }).catch(() => {});
        }

        if (command === 'enablechat') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return message.reply("n-no! only mods can let me talk hewe!");
            chatEnabledChannels.add(message.channel.id);
            if(channelsColl) await channelsColl.updateOne({ channelId: message.channel.id }, { $set: { channelId: message.channel.id } }, { upsert: true });
            return message.reply("yay!! i'ww remember to tawk hewe! ✨");
        }

        if (command === 'disablechat') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return message.reply("n-no! only mods can teww me to stop!");
            chatEnabledChannels.delete(message.channel.id);
            chatSessions.delete(message.channel.id);
            if(channelsColl) await channelsColl.deleteOne({ channelId: message.channel.id });
            return message.reply("oki doki... nite nite! (∪｡∪)｡｡｡zzZ");
        }
        
        // Add other commands (avatar, purge, etc) here as needed from your previous logic
        return;
    }

    // --- URL FIXERS ---
    const urlMatches = [...message.content.matchAll(urlRegex)];
    if (urlMatches.length > 0) {
        // ... (Keep your URL fixing logic from your original script here)
        // Ensure you return if urlFixed is true to prevent AI response to links
    }

    // --- AI CHAT HANDLING ---
    if (chatEnabledChannels.has(message.channel.id)) {
        if (!message.content || message.content.trim() === '') return;

        const userCooldown = aiCooldowns.get(message.author.id) || 0;
        if (Date.now() - userCooldown < 5000) return message.react('⏳').catch(() => {});
        aiCooldowns.set(message.author.id, Date.now());

        if (isProcessing.has(message.channel.id)) return message.react('⏳').catch(() => {});
        isProcessing.add(message.channel.id);

        try {
            await message.channel.sendTyping();
            let chat = chatSessions.get(message.channel.id);
            
            if (!chat) {
                let formattedHistory = [];
                if (historyColl) {
                    const dbHistory = await historyColl.findOne({ channelId: message.channel.id });
                    if (dbHistory && dbHistory.messages) {
                        // FIX: Mapping old data to Gemini's strict 'parts' format
                        formattedHistory = dbHistory.messages.map(msg => ({
                            role: msg.role === "assistant" ? "model" : msg.role,
                            parts: [{ text: msg.parts ? msg.parts[0].text : (msg.content || "") }]
                        }));
                    }
                }
                
                chat = yappuchinoAI.startChat({ 
                    history: formattedHistory, 
                    generationConfig: { maxOutputTokens: 500 } 
                });
                chatSessions.set(message.channel.id, chat);
            }

            const prompt = `[${message.author.username}]: ${message.cleanContent}`;
            const result = await chat.sendMessage(prompt);
            const responseText = result.response.text();
            
            if (historyColl) {
                await historyColl.updateOne(
                    { channelId: message.channel.id },
                    { $push: { messages: { 
                        $each: [
                            { role: "user", parts: [{ text: prompt }] },
                            { role: "model", parts: [{ text: responseText }] }
                        ],
                        $slice: -40 
                    } } },
                    { upsert: true }
                );
            }
            return message.reply(responseText.substring(0, 2000));
        } catch (error) {
            console.error("Gemini API Error:", error);
            chatSessions.delete(message.channel.id);
            return message.reply("s-sowwy... my bwain is huwting wight now (,,>﹏<,,)");
        } finally {
            isProcessing.delete(message.channel.id);
        }
    }
});

(async () => {
    try {
        await client.login(process.env.DISCORD_TOKEN);
        console.clear();
        console.log(`✧✧･ﾟ* hewwo!! yappuchino is onwine as ${client.user.tag} (๑>ᴗ<๑) *:･ﾟ✧*:･ﾟ✧`);
        await connectDB();
        setInterval(updatePresence, 30000); 
    } catch (err) {
        console.error("❌ Fatal Startup Error:", err);
    }
})();