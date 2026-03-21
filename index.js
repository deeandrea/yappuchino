require('dotenv').config();
const { Client, GatewayIntentBits, Events, ActivityType, PermissionsBitField, EmbedBuilder } = require('discord.js');
const express = require("express");
const { MongoClient } = require('mongodb');
const Groq = require('groq-sdk');

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

// --- GROQ AI SETUP ---
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const SYSTEM_PROMPT = `
    you are yappuchino, a chill cute discord bot.

rules:
- lowercase only
- short replies (1-3 sentences)
- casual slang (fr, tbh, lol, omg)
- sound human, never like ai

style:
- normal spelling only
- allow a few "w" words (hewwo, sowwy, pwease)
- 1-2 kaomojis max (^-^ :3)

reactions:
- occasionally, you can suggest a reaction for the user's message.
- to do this, end your message with [react: emoji] (e.g., [react: 💖] or [react: ✨]).
- only use standard discord emojis.
`;

// --- URL & DOMAIN STUFF (INTEGRATED FIXES) ---
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
    } catch (e) {
        return 'Creator';
    }
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
    
    // --- 0. Reactions ---
    if (msgLower.includes('good bot')) message.react('💖').catch(() => {});
    else if (msgLower.includes('bad bot')) message.react('🥺').catch(() => {});

    // --- 1. PREFIX COMMANDS ---
    if (msgLower.startsWith(PREFIX)) {
        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'help' || command === 'cmds') {
            const helpEmbed = new EmbedBuilder()
                .setColor('#FFB6C1')
                .setTitle('🎀 hewwo! here are my cmds! 🎀')
                .setDescription('i mostly just sit hewe and fix ur messy social media links automatically! but u can also do these:')
                .addFields(
                    { name: `🛠️ ${PREFIX}help / ${PREFIX}cmds`, value: 'shows this cute widdle menu! 🌸' },
                    { name: `🖼️ ${PREFIX}avatar / ${PREFIX}av <@user>`, value: 'shows someone\'s pwofile pictuwe! 📸' },
                    { name: `🏡 ${PREFIX}serverinfo / ${PREFIX}server`, value: 'shows cute info about this sewvew! ✨' },
                    { name: `🧹 ${PREFIX}cwean / ${PREFIX}purge <number>`, value: 'bulk deletes messages (requires \`Manage Messages\` pewm) ✨' },
                    { name: `🫂 ${PREFIX}hug <@user>`, value: 'give someone a big warm hug! ( ˶ˆ꒳ˆ˵ )' },
                    { name: `🐾 ${PREFIX}pat <@user>`, value: 'give someone soft headpats! ૮ ˶ᵔ ᵕ ᵔ˶ ა' },
                    { name: `🤫 ${PREFIX}enablechat / ${PREFIX}disablechat`, value: 'teww me when i can tawk and when to be quiet! ✨' },
                    { name: `🔮 @Bot <question>`, value: 'ping me with a question fow a magic 8-ball answew! ✨' },
                    { name: `📖 {anime} / <manga>`, value: 'type an anime in {} or manga in <> and i wiww find it fow u! ✨' }
                )
                .setFooter({ text: 'pwovided with wuv by uwur dev 💕' });

            if (message.author.id === DEVELOPER_ID) {
                helpEmbed.addFields({ 
                    name: `👑 __**Devewopew Secwet Cmds**__ 👑`, 
                    value: `**${PREFIX}restart** - nite nite bot (restarts)\n**${PREFIX}stats / ${PREFIX}info** - shows my ping, uptime, and othew newdy stuff! 🏓✨` 
                });
            }
            return message.reply({ embeds: [helpEmbed] }).catch(() => {});
        }

        if (command === 'avatar' || command === 'av') {
            const target = message.mentions.users.first() || message.author;
            const avEmbed = new EmbedBuilder()
                .setColor('#FFB6C1')
                .setTitle(`🎀 ${target.username}'s pwofile pictuwe! 🎀`)
                .setImage(target.displayAvatarURL({ dynamic: true, size: 512 }))
                .setFooter({ text: 'so pwetty! (๑>ᴗ<๑)' });
            return message.reply({ embeds: [avEmbed] }).catch(() => {});
        }

        if (command === 'serverinfo' || command === 'server') {
            const { guild } = message;
            const serverEmbed = new EmbedBuilder()
                .setColor('#FFB6C1')
                .setAuthor({ name: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
                .addFields(
                    { name: '👑 **Ownew**', value: `<@${guild.ownerId}>`, inline: true },
                    { name: '👥 **Membews**', value: `${guild.memberCount} cuties`, inline: true },
                    { name: '📅 **Cweated**', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
                )
                .setFooter({ text: 'such a cozy home! 🏡💕' });
            return message.reply({ embeds: [serverEmbed] }).catch(() => {});
        }

        if (command === 'hug' || command === 'pat') {
            const target = message.mentions.users.first();
            if (!target) return message.reply(`u gotta ping someone to ${command} them! (｡•́︿•̀｡)`).catch(() => {});
            if (target.id === client.user.id) return message.reply(`aww.. u wanna ${command} me?? *blushes* (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)♡`).catch(() => {});
            if (target.id === message.author.id) return message.reply(`giving urself a ${command}?? i'll ${command} u instead! *${command}s u* 🥺💖`).catch(() => {});

            const action = command === 'hug' ? 'big squishy hug' : 'soft headpats';
            const emoji = command === 'hug' ? '🫂💖' : '🐾✨';
            return message.channel.send(`**${target.username}**, u got a ${action} fwom **${message.author.username}**! ${emoji}`).catch(() => {});
        }

        if (command === 'purge' || command === 'cwean') {
            if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return message.reply('n-no! u don\'t have pewmission to cwean messages! (｡•́︿•̀｡) 🛑').catch(() => {});
            }
            if (!message.guild.members.me?.permissionsIn(message.channel).has(PermissionsBitField.Flags.ManageMessages)) {
                return message.reply('i-i don\'t have pewmissions to cwean messages hewe... (,,>﹏<,,) pwease give me `Manage Messages`!').catch(() => {});
            }
            const amount = parseInt(args[0]);
            if (isNaN(amount) || amount < 1 || amount > 99) {
                return message.reply('pwease gib me a numbew between 1 and 99! (๑>ᴗ<๑) 🔢').catch(() => {});
            }
            try {
                const fetchMsgs = await message.channel.messages.fetch({ limit: amount + 1 });
                await message.channel.bulkDelete(fetchMsgs, true);
                const reply = await message.channel.send(`yay!! i cweaned **${amount}** messages fow u! 🧹✨ ( ˶ˆ꒳ˆ˵ )`);
                setTimeout(() => reply.delete().catch(() => {}), 5000);
            } catch (err) {
                return message.reply('i couldn\'t cwean the messages... maybe they awe too owd? 🥺').catch(() => {});
            }
            return;
        }

        if (command === 'enablechat') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return message.reply("n-no! only mods can let me talk hewe! (｡•́︿•̀｡)");
            if (!chatEnabledChannels.has(message.channel.id)) {
                chatEnabledChannels.add(message.channel.id);
                if(channelsColl) {
                    await channelsColl.updateOne({ channelId: message.channel.id }, { $set: { channelId: message.channel.id } }, { upsert: true });
                }
            }
            return message.reply("yay!! i'ww remember to tawk hewe even if i take a nap! ( ˶ˆ꒳ˆ˵ )✨");
        }

        if (command === 'disablechat') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return message.reply("n-no! only mods can teww me to stop! (｡•́︿•̀｡)");
            chatEnabledChannels.delete(message.channel.id);
            chatSessions.delete(message.channel.id);
            if(channelsColl) await channelsColl.deleteOne({ channelId: message.channel.id });
            if(historyColl) await historyColl.deleteOne({ channelId: message.channel.id });
            return message.reply("oki doki... i've fowgotten this place now. nite nite! (∪｡∪)｡｡｡zzZ");
        }

        if (message.author.id === DEVELOPER_ID) {
            if (command === 'restart') {
                await message.reply('n-nite nite.. westarting now! (∪｡∪)｡｡｡zzZ 👋🌸').catch(() => {});
                process.exit(0);
            }
            if (command === 'stats' || command === 'info') {
                const uptimeStr = formatUptime(client.uptime);
                const statsEmbed = new EmbedBuilder()
                    .setColor('#FFB6C1')
                    .setAuthor({ name: `my widdle stats! 📊✨`, iconURL: client.user.displayAvatarURL() })
                    .addFields(
                        { name: '⏳ **Awake Fow**', value: `\`${uptimeStr}\``, inline: true },
                        { name: '🏓 **Ping**', value: `\`${client.ws.ping}ms\``, inline: true },
                        { name: '🧠 **Memowy**', value: `\`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\``, inline: true },
                        { name: '🏡 **Sewvews**', value: `\`${client.guilds.cache.size}\` cozy homes`, inline: true }
                    ).setFooter({ text: 'wowking hawd to fix ur winks! 💕' });
                return message.reply({ embeds: [statsEmbed] }).catch(() => {});
            }
        }
        return; 
    }

    // --- 2. ANIME/MANGA MATCHERS ---
    const animeMatches = [...message.content.matchAll(/{([^}]+)}/g)];
    const mangaMatches = [...message.content.matchAll(/<([^>]+)>/g)]
        .filter(m => !m[1].startsWith('http') && !m[1].startsWith(':') && !m[1].startsWith('a:') && !m[1].startsWith('@') && !m[1].startsWith('#') && !m[1].startsWith('&'));

    const searchRequests = [];
    animeMatches.forEach(m => searchRequests.push({ name: m[1], type: 'ANIME' }));
    mangaMatches.forEach(m => searchRequests.push({ name: m[1], type: 'MANGA' }));

    if (searchRequests.length > 0) {
        await message.channel.sendTyping().catch(() => {});
        for (const req of searchRequests.slice(0, 3)) {
            try {
                const media = await fetchAniList(req.name, req.type, message.channel.nsfw);
                const title = media.title.english || media.title.romaji || media.title.native;
                let cleanDesc = media.description ? media.description.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>?/gm, '') : 'No description awaiwable... 🥺';
                if (cleanDesc.length > 300) cleanDesc = cleanDesc.substring(0, 300) + `... [read morwe](${media.siteUrl})`;

                const mediaEmbed = new EmbedBuilder()
                    .setTitle(`🎀 ${title}`).setURL(media.siteUrl)
                    .setColor(media.coverImage.color ? media.coverImage.color : '#FFB6C1')
                    .setImage(media.coverImage.large) 
                    .setDescription(`**Genres:** *${media.genres.join(', ')}*\n\n${cleanDesc}`)
                    .setFooter({ text: `${media.format ? media.format.replace('_', ' ') : 'UNKNOWN'} • ${media.status ? media.status.replace('_', ' ') : 'UNKNOWN'}`, iconURL: 'https://anilist.co/img/logo_al.png' });
                await message.channel.send({ embeds: [mediaEmbed] }).catch(() => {});
            } catch (err) {}
        }
    }

    // --- 3. URL FIXERS (CONSOLIDATED LOGIC) ---
    const urlRegexLocal = new RegExp(`https?:\\/\\/(www\\.)?(${escapedDomains})\\/[^\\s]+`, 'gi');
    const urlMatches = [...message.content.matchAll(urlRegexLocal)];
    let urlFixed = false;
    
    if (urlMatches.length > 0) {
        let fixedData = [];
        let originalText = message.content;

        for (const matchObj of urlMatches) {
            try {
                const fullMatch = matchObj[0];
                const urlIndex = matchObj.index; 
                const isEscaped = urlIndex > 0 && message.content[urlIndex - 1] === '<' && message.content[urlIndex + fullMatch.length] === '>';
                
                if (!isEscaped) {
                    const cleanMatch = fullMatch.replace(/[.,;!)\]'"<>]+$/, '');
                    const url = new URL(cleanMatch);
                    const hostname = url.hostname.replace(/^www\./, '');

                    if (domainMap[hostname]) {
                        const creatorHandle = extractCreatorHandle(cleanMatch, hostname);
                        url.hostname = domainMap[hostname];

                        if (!fixedData.some(d => d.originalUrl === cleanMatch)) {
                            fixedData.push({ proxyUrl: url.toString(), originalUrl: cleanMatch, handle: creatorHandle });
                            originalText = originalText.split(cleanMatch).join('');
                            urlFixed = true;
                        }
                    }
                }
            } catch (error) {}
        }

        if (urlFixed && fixedData.length > 0) {
            try {
                const hasAttachments = message.attachments.size > 0;
                const isReply = message.reference !== null;
                let needsPerms = false;
                let messageDeleted = false;
                const botPerms = message.guild.members.me?.permissionsIn(message.channel);

                if (!hasAttachments && !isReply) {
                    if (botPerms?.has(PermissionsBitField.Flags.ManageMessages)) {
                        try { await message.delete(); messageDeleted = true; } 
                        catch (err) { if (err.code === 50013) needsPerms = true; }
                    } else { needsPerms = true; }
                }

                if (!messageDeleted && botPerms?.has(PermissionsBitField.Flags.ManageMessages)) {
                    try { await message.suppressEmbeds(true); } catch (err) {}
                }

                originalText = originalText.replace(/\s+/g, ' ').trim();
                if (originalText.length > 1000) originalText = originalText.substring(0, 1000) + '... *(text too wong!)*';

                const randomFace = ['꒰ ˶• ༝ •˶꒱', '( ๑ ˃̵ᴗ˂̵)و', '(✿ ♡‿♡)', 'ʕ•́ᴥ•̀ʔっ', '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧', '(⁄ ⁄•⁄ω⁄•⁄ ⁄)', '૮ ˶ᵔ ᵕ ᵔ˶ ა'][Math.floor(Math.random() * 7)];
                const cuteEmbed = new EmbedBuilder()
                    .setColor('#FFB6C1') 
                    .setAuthor({ name: `${message.author.username} shawed a post! ${randomFace}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

                if (originalText.length > 0) cuteEmbed.setDescription(`> 💬 *${originalText}*`);
                fixedData.forEach(data => cuteEmbed.addFields({ name: `╭・🎀 ₊˚⊹ Creator: ${data.handle}`, value: `╰・ [✧ cwick to view owiginal ✧](${data.originalUrl})` }));

                let warningText = needsPerms ? `*(psst.. modewatows! i need \`Manage Messages\` pewms to cwean up the owiginal message 🥺)*` 
                                : (!messageDeleted && (hasAttachments || isReply)) ? `*(psst.. i didn't dewete ur message so ur attachments/weply wouldn't get wost! 🌸)*` : "";

                await message.channel.send({ content: warningText.length > 0 ? warningText : null, embeds: [cuteEmbed] });
                await message.channel.send({ content: fixedData.map(data => `[₊˚⊹✧](${data.proxyUrl})`).join('\n') });
            } catch (error) { console.error('(｡•́︿•̀｡) Ewwow:', error); }
        }
        
        if (urlFixed) return; 
    }

    // --- 4. 8-BALL PINGS ---
    if (!urlFixed && message.mentions.has(client.user) && !chatEnabledChannels.has(message.channel.id)) {
        const textWithoutPing = message.content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
        if (textWithoutPing.length > 0) {
            const replies = ["yes!! definitely!! (๑>ᴗ<๑) ✨", "it is cewtain!! 🐾", "without a doubt, bestie!! 💖", "mhm! signs point to yes! ( ˶ˆ꒳ˆ˵ )", "my widdle cwystal ball says yes! 🔮✨", "hmm.. ask again watew.. im eepy (∪｡∪)｡｡｡zzZ", "i-i can't tell wight now.. sowwy!! 🥺", "concentwate and ask again! ( •̀ᴗ•́ )و ̑̑", "n-no.. i don't think so.. (｡•́︿•̀｡)", "my souwces say no.. *hides* 🙈", "vewy doubtfuw.. 🛑", "nyo way!! (・`ω´・)"];
            return message.reply(replies[Math.floor(Math.random() * replies.length)]).catch(() => {});
        } else {
            const replies = ["hewwo?? did u need me? (・`ω´・)", "weady for duty!! 🛠️( •̀ᴗ•́ )و ̑̑", "uwu? u askin fow an 8ball weading? 🔮✨", "*nuzzles u* 🐾"];
            return message.reply(replies[Math.floor(Math.random() * replies.length)]).catch(() => {});
        }
    }

    // --- 5. AI CHAT HANDLING (GROQ) ---
    if (chatEnabledChannels.has(message.channel.id)) {
        if (!message.content || message.content.trim() === '') return;

        const userCooldown = aiCooldowns.get(message.author.id) || 0;
        if (Date.now() - userCooldown < 5000) {
            return message.react('⏳').catch(() => {});
        }
        aiCooldowns.set(message.author.id, Date.now());

        if (isProcessing.has(message.channel.id)) return message.react('⏳').catch(() => {});
        isProcessing.add(message.channel.id);

        try {
            await message.channel.sendTyping();
            let chatHistory = chatSessions.get(message.channel.id);
            
            if (!chatHistory) {
                chatHistory = [];
                if (historyColl) {
                    const dbHistory = await historyColl.findOne({ channelId: message.channel.id });
                    if (dbHistory && dbHistory.messages) {
                        chatHistory = dbHistory.messages.map(msg => {
                            if (msg.parts && msg.parts[0]) {
                                return { role: msg.role === 'model' ? 'assistant' : 'user', content: msg.parts[0].text };
                            }
                            return msg;
                        });
                    }
                }
            }

            const prompt = `[${message.author.username}]: ${message.cleanContent}`;
            const userMessage = { role: "user", content: prompt };
            
            const messagesPayload = [
                { role: "system", content: SYSTEM_PROMPT },
                ...chatHistory,
                userMessage
            ];

            const chatCompletion = await groq.chat.completions.create({
                messages: messagesPayload,
                model: "llama-3.1-8b-instant",
                max_tokens: 250
            });

            let responseText = chatCompletion.choices[0]?.message?.content || "sowwy, my bwain got confused 🥺";
            
            // --- REACTION EXTRACTION ---
            // This handles cases where AI uses [react: :)] or weird spacing

const reactionRegex = /\[react:\s*([^\]]+)\]/i;
const reactionMatch = responseText.match(reactionRegex);

if (reactionMatch) {
    const rawEmoji = reactionMatch[1].trim();
    
    // Attempt to react to the user's message
    // If it's a text-face like ":)", Discord will throw an error, so we .catch() it
    message.react(rawEmoji).catch(() => {
        // Silently fail if the emoji isn't valid/supported
    });

    // CRITICAL: Always remove the [react: ...] tag from the text 
    // so it doesn't show up in the final message even if the reaction failed
    responseText = responseText.replace(reactionRegex, '').trim();
}


            chatHistory.push(userMessage);
            chatHistory.push({ role: "assistant", content: responseText });

            if (chatHistory.length > 40) chatHistory = chatHistory.slice(-40);
            chatSessions.set(message.channel.id, chatHistory);
            
            if (historyColl) {
                await historyColl.updateOne(
                    { channelId: message.channel.id },
                    { $set: { messages: chatHistory } },
                    { upsert: true }
                );
            }

            return message.reply(responseText.substring(0, 2000));
        } catch (error) {
            console.error("Groq API Error:", error);
            chatSessions.delete(message.channel.id);
            return message.reply("s-sowwy... my bwain is huwting wight now (,,>﹏<,,)").catch(() => {});
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
        updatePresence();
        setInterval(updatePresence, 3600000); 
        await connectDB();
    } catch (err) {
        console.error("❌ Fatal Startup Error:", err);
    }
})();

process.on('unhandledRejection', e => console.error('Rejection:', e));
process.on('uncaughtException', e => console.error('Exception:', e));