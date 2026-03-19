require('dotenv').config();
const { Client, GatewayIntentBits, Events, ActivityType, PermissionsBitField, EmbedBuilder } = require('discord.js');
const express = require("express");

const app = express();

app.get("/", (req, res) => res.send("Bot is alive!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));

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

async function fetchAniList(search, type, isAdult) {
    const query = `
    query ($search: String, $type: MediaType, $isAdult: Boolean) {
      Media (search: $search, type: $type, isAdult: $isAdult) {
        id
        title { romaji english native }
        description
        siteUrl
        coverImage { large color }
        status
        format
        genres
      }
    }`;

    const variables = { search, type, isAdult };

    const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({ query, variables })
    });

    const data = await response.json();
    if (data.errors) throw new Error('Media not found');
    return data.data.Media;
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

let presenceInterval;

function updatePresence() {
    const status = cuteStatuses[Math.floor(Math.random() * cuteStatuses.length)];
    client.user.setPresence({
        activities: [{ name: status.text, type: status.type }],
        status: 'online',
    });
}

client.once(Events.ClientReady, c => {
    console.log(`✧･ﾟ: *✧･ﾟ:* hewwo!! FixedEmbed Bot is onwine as ${c.user.tag} (๑>ᴗ<๑) *:･ﾟ✧*:･ﾟ✧`);
    updatePresence();
    presenceInterval = setInterval(updatePresence, 30 * 60 * 1000);
});

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
                .setDescription('i mostly just sit hewe and fix ur messy social media links automatically! but u can also do these:')
                .addFields(
                    { name: `🛠️ ${PREFIX}help / ${PREFIX}cmds`, value: 'shows this cute widdle menu! 🌸' },
                    { name: `🧹 ${PREFIX}cwean <number>`, value: 'bulk deletes messages (requires `Manage Messages` pewm) ✨' },
                    { name: `🫂 ${PREFIX}hug <@user>`, value: 'give someone a big warm hug! ( ˶ˆ꒳ˆ˵ )' },
                    { name: `🐾 ${PREFIX}pat <@user>`, value: 'give someone soft headpats! ૮ ˶ᵔ ᵕ ᵔ˶ ა' },
                    { name: `📖 {anime} / <manga>`, value: 'type an anime in {} or manga in <> and i wiww find it fow u! ✨' }
                )
                .setFooter({ text: 'pwovided with wuv by uwur dev 💕' });

            return message.reply({ embeds: [helpEmbed] }).catch(() => {});
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
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return message.reply('n-no! u don\'t have pewmission to cwean messages! (｡•́︿•̀｡) 🛑').catch(() => {});
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

        if (message.author.id === DEVELOPER_ID) {
            if (command === 'ping') return message.reply('hewwo!! p-pong! (๑>ᴗ<๑) 🏓').catch(() => {});
            if (command === 'status') {
                const newStatus = args.join(' ');
                if (!newStatus) return message.reply('pwease pwovide a status message! (｡•́︿•̀｡) 🎀').catch(() => {});
                clearInterval(presenceInterval); 
                client.user.setActivity(newStatus, { type: ActivityType.Custom });
                return message.reply(`uwu.. status changed to: **${newStatus}** (´｡• ᵕ •｡\`) ✨`).catch(() => {});
            }
            if (command === 'restart') {
                await message.reply('n-nite nite.. westarting now! (∪｡∪)｡｡｡zzZ 👋🌸').catch(() => {});
                process.exit(0);
            }
        }
        return;
    }

    const animeMatches = [...message.content.matchAll(/{([^}]+)}/g)];
    const mangaMatches = [...message.content.matchAll(/<([^>]+)>/g)].filter(m => !m[1].startsWith('http') && !m[1].startsWith(':') && !m[1].startsWith('a:'));

    const searchRequests = [];
    animeMatches.forEach(m => searchRequests.push({ name: m[1], type: 'ANIME' }));
    mangaMatches.forEach(m => searchRequests.push({ name: m[1], type: 'MANGA' }));

    if (searchRequests.length > 0) {
        await message.channel.sendTyping();
        const isAdult = message.channel.nsfw;

        for (const req of searchRequests.slice(0, 3)) {
            try {
                const media = await fetchAniList(req.name, req.type, isAdult);
                const title = media.title.english || media.title.romaji || media.title.native;
                
                let cleanDesc = media.description ? media.description.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>?/gm, '') : 'No description awaiwable... 🥺';
                if (cleanDesc.length > 300) cleanDesc = cleanDesc.substring(0, 300) + `... [read morwe](${media.siteUrl})`;

                const color = media.coverImage.color ? media.coverImage.color : '#FFB6C1';
                const formatStr = media.format ? media.format.replace('_', ' ') : 'UNKNOWN';
                const statusStr = media.status ? media.status.replace('_', ' ') : 'UNKNOWN';

                const mediaEmbed = new EmbedBuilder()
                    .setTitle(`🎀 ${title}`)
                    .setURL(media.siteUrl)
                    .setColor(color)
                    .setImage(media.coverImage.large) 
                    .setDescription(`**Genres:** *${media.genres.join(', ')}*\n\n${cleanDesc}`)
                    .setFooter({ text: `${formatStr} • ${statusStr}`, iconURL: 'https://anilist.co/img/logo_al.png' });

                await message.channel.send({ embeds: [mediaEmbed] });
            } catch (err) {
            }
        }
    }

    const matches = message.content.match(urlRegex);

    if (!matches && message.mentions.has(client.user)) {
        const textWithoutPing = message.content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
        if (textWithoutPing.length > 0) {
            const textReplies = [
                "h-hewwo!! i see u talking to me, but i only know how to fix winks!! 🥺✨",
                "uwu? i'm just a silly widdle bot.. i don't understand words very well (,,>﹏<,,)",
                "sowwy!! i'm not a chattin bot! i'm a widdle embed fixer! 🛠️🐾",
                "beep boop! i mean- nyanyanya! i-i can't wead that! (｡•́︿•̀｡)"
            ];
            return message.reply(textReplies[Math.floor(Math.random() * textReplies.length)]).catch(() => {});
        } else {
            const adorableReplies = [
                "hewwo?? did u need me? (・`ω´・)",
                "weady for duty!! 🛠️( •̀ᴗ•́ )و ̑̑",
                "uwu?",
                "*nuzzles u* 🐾"
            ];
            return message.reply(adorableReplies[Math.floor(Math.random() * adorableReplies.length)]).catch(() => {});
        }
    }

    if (!matches) return;

    let fixedData = [];
    let modified = false;
    let originalText = message.content;

    for (const match of matches) {
        try {
            const urlIndex = message.content.indexOf(match);
            const isEscaped = urlIndex > 0 && message.content[urlIndex - 1] === '<' && message.content[urlIndex + match.length] === '>';
            if (isEscaped) continue;

            const cleanMatch = match.replace(/[.,;!)\]'"<>]+$/, '');
            const url = new URL(cleanMatch);
            const hostname = url.hostname.replace(/^www\./, '');

            if (domainMap[hostname]) {
                const creatorHandle = extractCreatorHandle(cleanMatch, hostname);
                url.hostname = domainMap[hostname];

                if (!fixedData.some(d => d.originalUrl === cleanMatch)) {
                    fixedData.push({
                        proxyUrl: url.toString(),
                        originalUrl: cleanMatch,
                        handle: creatorHandle
                    });
                    modified = true;
                    originalText = originalText.split(cleanMatch).join('');
                }
            }
        } catch (error) {}
    }

    if (modified && fixedData.length > 0) {
        try {
            const hasAttachments = message.attachments.size > 0;
            const isReply = message.reference !== null;
            let needsPerms = false;
            let messageDeleted = false;

            if (!hasAttachments && !isReply) {
                try {
                    await message.delete();
                    messageDeleted = true;
                } catch (err) {
                    needsPerms = true;
                }
            }

            originalText = originalText.replace(/\s+/g, ' ').trim();
            if (originalText.length > 1000) {
                originalText = originalText.substring(0, 1000) + '... *(text too wong!)*';
            }

            const kaomojis = ['꒰ ˶• ༝ •˶꒱', '( ๑ ˃̵ᴗ˂̵)و', '(✿ ♡‿♡)', 'ʕ•́ᴥ•̀ʔっ', '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧', '(⁄ ⁄•⁄ω⁄•⁄ ⁄)', '૮ ˶ᵔ ᵕ ᵔ˶ ა'];
            const randomFace = kaomojis[Math.floor(Math.random() * kaomojis.length)];

            const cuteEmbed = new EmbedBuilder()
                .setColor('#FFB6C1') 
                .setAuthor({ 
                    name: `${message.author.username} shawed a post! ${randomFace}`, 
                    iconURL: message.author.displayAvatarURL({ dynamic: true }) 
                });

            if (originalText.length > 0) {
                cuteEmbed.setDescription(`> 💬 *${originalText}*`);
            }

            fixedData.forEach(data => {
                cuteEmbed.addFields({ 
                    name: `╭・🎀 ₊˚⊹ Creator: ${data.handle}`, 
                    value: `╰・ [✧ cwick to view owiginal ✧](${data.originalUrl})` 
                });
            });

            let warningText = "";
            if (needsPerms) {
                warningText = `*(psst.. modewatows! i need \`Manage Messages\` pewms to cwean up the owiginal message 🥺)*`;
            } else if (!messageDeleted && (hasAttachments || isReply)) {
                warningText = `*(psst.. i didn't dewete ur message so ur attachments/weply wouldn't get wost! 🌸)*`;
            }

            await message.channel.send({ 
                content: warningText.length > 0 ? warningText : null,
                embeds: [cuteEmbed] 
            });

            const proxyLinks = fixedData.map(data => `[₊˚⊹✧](${data.proxyUrl})`).join('\n');
            await message.channel.send({ content: proxyLinks });

        } catch (error) {
            console.error('(｡•́︿•̀｡) [Ewwow] s-something went wwong sendin the message:', error);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);