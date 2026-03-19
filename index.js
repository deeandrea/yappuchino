require('dotenv').config();
const { Client, GatewayIntentBits, Events, ActivityType, PermissionsBitField, EmbedBuilder } = require('discord.js');

const express = require("express");
const app = express();

// Respond to GET requests at root
app.get("/", (req, res) => {
  res.send("Bot is alive!");
});

// Listen on the port Render provides
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions // Added so the bot can react to messages!
    ]
});

// Your User ID for Developer-only commands
const DEVELOPER_ID = '315770147665215488';
// The new custom prefix
const PREFIX = 'bp.';

/**
 * COMPREHENSIVE DOMAIN MAP
 */
const domainMap = {
    'twitter.com': 'fxtwitter.com',
    'x.com': 'fxtwitter.com',
    'tiktok.com': 'tnktok.com',
    'vm.tiktok.com': 'tnktok.com',
    'vt.tiktok.com': 'tnktok.com',
    'instagram.com': 'ddinstagram.com',
    'reddit.com': 'rxddit.com',
    'old.reddit.com': 'rxddit.com',
    'bsky.app': 'bsky.social',
    'threads.net': 'fixthreads.net',
    'facebook.com': 'fxfacebook.com',
    'pinterest.com': 'fxpinterest.com',
    'twitch.tv': 'fxtwitch.tv',
    'spotify.com': 'fxspotify.com',
    'pixiv.net': 'phixiv.net',
    'deviantart.com': 'fxdeviantart.com',
    'bilibili.com': 'fxbilibili.com',
    'tumblr.com': 'fxtumblr.com'
};

const escapedDomains = Object.keys(domainMap).map(d => d.replace(/\./g, '\\.')).join('|');
const urlRegex = new RegExp(`https?:\\/\\/(www\\.)?(${escapedDomains})\\/[^\\s]+`, 'gi');

function getCleanPlatformName(hostname) {
    const main = hostname.split('.').slice(-2, -1)[0] || 'Post';
    return main.charAt(0).toUpperCase() + main.slice(1);
}

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
        if (hostname.includes('instagram.com')) {
            return pathParts[0] ? `@${pathParts[0]}` : 'Instagram User';
        }
        if (hostname.includes('reddit.com')) {
            if (pathParts[0] === 'r' || pathParts[0] === 'u') {
                return `${pathParts[0]}/${pathParts[1]}`;
            }
        }
        return `${getCleanPlatformName(hostname)} Post`;
    } catch (e) {
        return 'Post';
    }
}

/**
 * Rich Presence Logic - UWU EDITION
 */
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
    client.user.setPresence({
        activities: [{ name: status.text, type: status.type }],
        status: 'online',
    });
}

client.once(Events.ClientReady, c => {
    console.log(`✧･ﾟ: *✧･ﾟ:* hewwo!! FixedEmbed Bot is onwine as ${c.user.tag} (๑>ᴗ<๑) *:･ﾟ✧*:･ﾟ✧`);
    updatePresence();
    setInterval(updatePresence, 30 * 60 * 1000);
});

client.on(Events.MessageCreate, async (message) => {
    // Ignore bots and DMs
    if (message.author.bot || !message.guild) return;

    // --- SMALL CUTE PASSIVE FEATURES ---
    // If someone says "good bot" or "bad bot", it reacts!
    const msgLower = message.content.toLowerCase();
    if (msgLower.includes('good bot')) {
        message.react('💖').catch(() => {});
    } else if (msgLower.includes('bad bot')) {
        message.react('🥺').catch(() => {});
    }

    // --- COMMANDS LOGIC ---
    if (msgLower.startsWith(PREFIX)) {
        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // -> Help Command (Cute Embed)
        if (command === 'help' || command === 'cmds') {
            const helpEmbed = new EmbedBuilder()
                .setColor('#FFB6C1') // Pastel Pink!
                .setTitle('🎀 hewwo! here are my cmds! 🎀')
                .setDescription('i mostly just sit hewe and fix ur messy social media links automatically! but u can also do these:')
                .addFields(
                    { name: `🛠️ ${PREFIX}help / ${PREFIX}cmds`, value: 'shows this cute widdle menu! 🌸' },
                    { name: `🧹 ${PREFIX}cwean <number>`, value: 'bulk deletes messages (requires `Manage Messages` pewm) ✨' },
                    { name: `🫂 ${PREFIX}hug <@user>`, value: 'give someone a big warm hug! ( ˶ˆ꒳ˆ˵ )' },
                    { name: `🐾 ${PREFIX}pat <@user>`, value: 'give someone soft headpats! ૮ ˶ᵔ ᵕ ᵔ˶ ა' }
                )
                .setFooter({ text: 'pwovided with wuv by uwur dev 💕' });

            return message.reply({ embeds: [helpEmbed] }).catch(console.error);
        }

        // -> Cute Interaction Commands
        if (command === 'hug' || command === 'pat') {
            const target = message.mentions.users.first();

            if (!target) {
                return message.reply(`u gotta ping someone to ${command} them! (｡•́︿•̀｡)`).catch(console.error);
            }
            if (target.id === client.user.id) {
                return message.reply(`aww.. u wanna ${command} me?? *blushes* (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)♡`).catch(console.error);
            }
            if (target.id === message.author.id) {
                return message.reply(`giving urself a ${command}?? i'll ${command} u instead! *${command}s u* 🥺💖`).catch(console.error);
            }

            const action = command === 'hug' ? 'big squishy hug' : 'soft headpats';
            const emoji = command === 'hug' ? '🫂💖' : '🐾✨';
            return message.channel.send(`**${target.username}**, u got a ${action} fwom **${message.author.username}**! ${emoji}`).catch(console.error);
        }

        // -> Bulk Delete Command
        if (command === 'purge' || command === 'cwean') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return message.reply('n-no! u don\'t have pewmission to cwean messages! (｡•́︿•̀｡) 🛑').catch(console.error);
            }

            const amount = parseInt(args[0]);
            if (isNaN(amount) || amount < 1 || amount > 99) {
                return message.reply('pwease gib me a numbew between 1 and 99! (๑>ᴗ<๑) 🔢').catch(console.error);
            }

            try {
                const fetchMsgs = await message.channel.messages.fetch({ limit: amount + 1 });
                await message.channel.bulkDelete(fetchMsgs, true);

                const reply = await message.channel.send(`yay!! i cweaned **${amount}** messages fow u! 🧹✨ ( ˶ˆ꒳ˆ˵ )`);
                setTimeout(() => reply.delete().catch(() => {}), 5000);
            } catch (err) {
                console.error('(｡•́︿•̀｡) oopies, faiwed to cwean:', err);
                return message.reply('i couldn\'t cwean the messages... maybe they awe too owd? 🥺').catch(console.error);
            }
            return;
        }

        // -> Developer Only Commands
        if (message.author.id === DEVELOPER_ID) {
            if (command === 'ping') {
                return message.reply('hewwo!! p-pong! (๑>ᴗ<๑) 🏓').catch(console.error);
            }
            if (command === 'status') {
                const newStatus = args.join(' ');
                if (!newStatus) return message.reply('pwease pwovide a status message! (｡•́︿•̀｡) 🎀').catch(console.error);
                client.user.setActivity(newStatus, { type: ActivityType.Custom });
                return message.reply(`uwu.. status changed to: **${newStatus}** (´｡• ᵕ •｡\`) ✨`).catch(console.error);
            }
            if (command === 'restart') {
                await message.reply('n-nite nite.. westarting now! (∪｡∪)｡｡｡zzZ 👋🌸').catch(console.error);
                process.exit(0);
            }
        }

        // If they used a command prefix but it wasn't a valid command, we just return.
        // We don't want to parse links if they were trying to run a command!
        return;
    }

    // --- EMBED FIXER LOGIC ---
    const matches = message.content.match(urlRegex);

    if (!matches && message.mentions.has(client.user)) {
        const textWithoutPing = message.content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();

        if (textWithoutPing.length > 0) {
            const textReplies = [
                "h-hewwo!! i see u talking to me, but i only know how to fix winks!! 🥺✨",
                "uwu? i'm just a silly widdle bot.. i don't understand words very well (,,>﹏<,,)",
                "*tilts head* r u talking to me?? i'm just here to make ur embeds pwetty! 🌸",
                "n-nyan? my brain is too smol to understand that.. i just fix links! (๑>ᴗ<๑) 🛠️",
                "awawa!! u speak words, i speak URLs! we are so different (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)♡",
                "ehhh? (・_・;) i'm sowwy, i only speak in https:// !! 🌐✨",
                "w-wut does that mean? i just wanna cwean up ur messy links! ( ˶ˆ꒳ˆ˵ )",
                "sowwy!! i'm not a chattin bot! i'm a widdle embed fixer! 🛠️🐾",
                "u-umm.. *sweats* i don't know what to say! pwease just give me links! 🥺",
                "hehe~ u talk so much! i just copy and paste winks all day! ૮ ˶ᵔ ᵕ ᵔ˶ ა",
                "m-my vocabulary is wimited to: twitter, tiktok, instagram, and weddit! 🌸",
                "beep boop! i mean- nyanyanya! i-i can't wead that! (｡•́︿•̀｡)"
            ];
            return message.reply(textReplies[Math.floor(Math.random() * textReplies.length)]).catch(console.error);
        } else {
            const adorableReplies = [
                "hewwo?? did u need me? (・`ω´・)",
                "i'm busy fixing winks!! 🛠️✨",
                "uwu?",
                "*nuzzles u* 🐾",
                "yes pwease? ( ˶ˆ꒳ˆ˵ )",
                "h-hihi!! (⁄ ⁄•⁄ω⁄•⁄ ⁄)♡",
                "did someone say my name?? ૮ ˶ᵔ ᵕ ᵔ˶ ა",
                "boop! i'm here! 🌸✨",
                "nyan!! (๑>ᴗ<๑)",
                "u called? *wags tail* 🐕✨",
                "w-what is it? do u have a bwoken link for me?! 🥺",
                "weady for duty!! 🛠️( •̀ᴗ•́ )و ̑̑"
            ];
            return message.reply(adorableReplies[Math.floor(Math.random() * adorableReplies.length)]).catch(console.error);
        }
    }

    if (!matches) return;

    let fixedData = [];
    let modified = false;

    // Clone the content to safely remove only processed URLs
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

                if (!fixedData.some(d => d.url === url.toString())) {
                    fixedData.push({
                        url: url.toString(),
                        handle: creatorHandle
                    });
                    modified = true;

                    // FIX: Replaced .replace with .split.join to ensure ALL identical URLs are removed 
                    // from the quoted text, not just the very first one!
                    originalText = originalText.split(cleanMatch).join('');
                }
            }
        } catch (error) {
            console.error(`(｡•́︿•̀｡) oopies... uww parse faiw: ${match}`);
        }
    }

    if (modified && fixedData.length > 0) {
        try {
            await message.suppressEmbeds(true).catch(() => {});

            let needsPerms = false;

            const hasAttachments = message.attachments.size > 0;
            const isReply = message.reference !== null;

            if (!hasAttachments && !isReply) {
                await message.delete().catch(err => {
                    needsPerms = true;
                    console.error('(｡•́︿•̀｡) [Pewms Ewwow] faiwed to dewete message. i need "Manage Messages" pewmission!', err.message);
                });
            }

            originalText = originalText.replace(/\s+/g, ' ').trim();

            if (originalText.length > 1000) {
                originalText = originalText.substring(0, 1000) + '... *(text too wong!)*';
            }

            const kaomojis = ['꒰ ˶• ༝ •˶꒱', '( ๑ ˃̵ᴗ˂̵)و', '(✿ ♡‿♡)', 'ʕ•́ᴥ•̀ʔっ', '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧', '(⁄ ⁄•⁄ω⁄•⁄ ⁄)', '૮ ˶ᵔ ᵕ ᵔ˶ ა'];
            const randomFace = kaomojis[Math.floor(Math.random() * kaomojis.length)];

            let responseText = `${randomFace} ✩°｡⋆ shawed by **${message.author.username}**!\n`;

            if (originalText.length > 0) {
                responseText += `> *${originalText}*\n\n`;
            }

            const formattedLinks = fixedData.map(data => {
                return `👤 **${data.handle}** ₊˚⊹♡ [View Post](${data.url})`;
            });

            responseText += formattedLinks.join('\n\n');

            if (needsPerms) {
                responseText += `\n\n*(psst.. modewatows! i need \`Manage Messages\` pewms to cwean up the owiginal message 🥺)*`;
            } else if (hasAttachments || isReply) {
                responseText += `\n\n*(psst.. i didn't dewete ur message so ur attachments/weply wouldn't get wost! 🌸)*`;
            }

            await message.channel.send({
                content: responseText
            });

        } catch (error) {
            console.error('(｡•́︿•̀｡) [Ewwow] s-something went wwong sendin the message:', error);
        }
    }
});



client.login(process.env.DISCORD_TOKEN);