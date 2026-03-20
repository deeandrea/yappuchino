<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=FFB6C1,FF91A4&height=250&section=header&text=yappuchino&fontSize=80&fontColor=ffffff&fontAlignY=38&desc=fixing%20messy%20links,%20one%20embed%20at%20a%20time&descAlignY=60&descSize=22&animation=twinkling" alt="yappuchino Banner">

# 🎀

*The elegant, effortless solution to messy social media links in Discord.*

<img src="https://img.shields.io/badge/Node.js-16.x-FFB6C1?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
<img src="https://img.shields.io/badge/Discord.js-v14-FFC0CB?style=for-the-badge&logo=discord&logoColor=white" alt="Discord.js">
<img src="https://img.shields.io/badge/Status-Active-FF91A4?style=for-the-badge" alt="Status">
<img src="https://img.shields.io/badge/License-ISC-FF69B4?style=for-the-badge" alt="License">

</div>

<br>

> **Discord wasn't built to handle every TikTok or Twitter video.**
> That's why yappuchino actively monitors your chat, instantly deleting broken links and replacing them with beautifully embedded, fully-functional videos—all while keeping your name and avatar attached.

<div align="center"> ⋆ ˚｡⋆୨୧˚ ˚୨୧⋆｡˚ ⋆ </div>

## 📑 Table of Contents
* [✨ Why yappuchino?](#why-yappuchino)
* [⌨️ The Command Menu](#command-menu)
* [🚀 Installation & Setup](#setup)
* [🔒 Required Intents & Permissions](#permissions)
* [🛠️ Troubleshooting](#troubleshooting)

<div align="center"> ⋆ ˚｡⋆୨୧˚ ˚୨୧⋆｡˚ ⋆ </div>

<a name="why-yappuchino"></a>
## ✨ Why yappuchino?

💖 **Seamless Auto-Fixing** Paste a `twitter.com`, `x.com`, or `tiktok.com` link. yappuchino instantly swaps it to a working proxy (`fxtwitter` / `kktiktok`), deletes the ugly original message, and credits you perfectly. It even detects if you replied to someone or attached a file, smartly leaving those messages alone!

📖 **Integrated AniList Search** Looking for a new show? Type `{Jujutsu Kaisen}` for anime or `<Chainsaw Man>` for manga. Get high-res cover art, descriptions, and statuses instantly.

🔮 **Interactive & Alive** Ping `@yappuchino` with a question for a Magic 8-ball reading, or use built-in social commands to hug and pat your server members.

<div align="center"> ⋆ ˚｡⋆୨୧˚ ˚୨୧⋆｡˚ ⋆ </div>

<a name="command-menu"></a>
## ⌨️ The Command Menu

Prefix your commands with `bp.` to interact with yappuchino!

### 🌸 Social & Utility

| Command | Description | 
| :--- | :--- | 
| `bp.help` | Opens the interactive help menu. | 
| `bp.avatar <@user>` | Grabs a high-res version of someone's profile picture. | 
| `bp.serverinfo` | Displays a neat overview of the current server. | 
| `bp.hug <@user>` | Wrap a friend in a big warm hug! | 
| `bp.pat <@user>` | Give someone soft headpats. | 

### 🔎 Search & Magic

| Trigger | Description | 
| :--- | :--- | 
| `{Anime Title}` | Searches the AniList database for an anime (No prefix needed!). | 
| `<Manga Title>` | Searches the AniList database for a manga (No prefix needed!). | 
| `@yappuchino <Query>` | Ask a question for a Magic 8-Ball response! | 

### 🛠️ Moderation & Developer

| Command | Description | 
| :--- | :--- | 
| `bp.cwean <1-99>` | Bulk deletes messages *(Requires Manage Messages permission)*. | 
| `bp.stats` | **(Dev Only)** Shows bot uptime, ping, and memory usage. | 
| `bp.restart` | **(Dev Only)** Safely shuts the bot down to restart. | 

<div align="center"> ⋆ ˚｡⋆୨୧˚ ˚୨୧⋆｡˚ ⋆ </div>

<a name="setup"></a>
## 🚀 Installation & Setup

Want to invite yappuchino into your own development environment? Follow these steps:

### 1. Prerequisites

* **Node.js** (v16.9.0 or higher)
* A Registered Bot Token from the [Discord Developer Portal](https://discord.com/developers/applications)

### 2. Quick Start

Clone the repository and install the required dependencies:

```bash
git clone https://github.com/deeandrea/yappuchino.git
cd yappuchino
npm install
```

Create a `.env` file in the root directory and add your bot token:

```env
DISCORD_TOKEN=your_super_secret_bot_token_here
```

Set up your Developer privileges by grabbing your Discord User ID and replacing the `DEVELOPER_ID` string in `index.js` (around line 21).

### 3. Invite the Bot
Go to the **OAuth2 > URL Generator** tab in the Developer Portal. Select the `bot` scope, check the required permissions listed below, and paste the generated URL into your browser to invite yappuchino to your server!

### 4. Wake Her Up!

```bash
npm start
```

<div align="center"> ⋆ ˚｡⋆୨୧˚ ˚୨୧⋆｡˚ ⋆ </div>

<a name="permissions"></a>
## 🔒 Required Intents & Permissions

To ensure yappuchino works flawlessly, enable the following in your Discord Developer Portal:

* **Privileged Intents:** `Message Content Intent` (CRITICAL 🚨)
* **Bot Permissions:** * `Read Messages` & `Send Messages`
  * `Manage Messages` *(Crucial for auto-fixing links)*
  * `Embed Links` & `Attach Files`
  * `Read Message History`
  * `Add Reactions`

<div align="center"> ⋆ ˚｡⋆୨୧˚ ˚୨୧⋆｡˚ ⋆ </div>

<a name="troubleshooting"></a>
## 🛠️ Troubleshooting

<details>
<summary><b>The bot isn't deleting the original message when it fixes a link!</b></summary>
yappuchino needs the <code>Manage Messages</code> permission in the specific channel to delete other users' messages. Check her role settings!
</details>

<details>
<summary><b>The bot is online, but ignoring commands.</b></summary>
Go to the Discord Developer Portal, navigate to the "Bot" tab, and ensure the <b>Message Content Intent</b> toggle is turned <b>ON</b>.
</details>

<details>
<summary><b>I see an `UND_ERR_CONNECT_TIMEOUT` error in the console.</b></summary>
Don't panic! This just means the Discord API or AniList API took too long to respond due to a brief internet hiccup. yappuchino has built-in safety nets that will catch this so she won't crash.
</details>

<br>

<div align="center">
  <h3>🤝 Contributing</h3>
  <p>Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change. Let's make Discord a cuter place together!</p>

  <a href="https://ko-fi.com/wenwen" target="_blank"><img src="https://img.shields.io/badge/Buy_Me_a_Yappuchino-%E2%98%95-FFB6C1?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Buy Me A Coffee"></a>

  <br><br>
  <sub>Made with 💖 by <a href="https://github.com/deeandrea">wenwen</a></sub>
</div>