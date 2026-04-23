<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=FFB6C1,FF91A4&height=250&section=header&text=yappuchino&fontSize=80&fontColor=ffffff&fontAlignY=38&desc=fixing%20messy%20links,%20one%20embed%20at%20a%20time&descAlignY=60&descSize=22&animation=twinkling" alt="yappuchino Banner">

*The elegant, effortless solution to messy social media links, now has a cutie AI integration within!*

<div align="center">

<a href="https://nodejs.org/en/download/">
  <img src="https://img.shields.io/badge/Node.js-18.x+-FFB6C1?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
</a>
<a href="https://discord.js.org/">
  <img src="https://img.shields.io/badge/Discord.js-v14-FFC0CB?style=for-the-badge&logo=discord&logoColor=white" alt="Discord.js">
</a>
<a href="https://ai.google.dev/">
  <img src="https://img.shields.io/badge/Powered%20by-Gemini%20AI-blue?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Gemini AI">
</a>
<a href="https://www.mongodb.com/">
  <img src="https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
</a>

</div>

</div>

<br>

> **Discord embeds are hit-or-miss. yappuchino never misses.**
> She monitors your chat, swaps broken TikTok/Twitter links with working proxies, and now features a persistent AI chat powered by Google Gemini that remembers your conversations across restarts.

<div align="center"> ⋆ ˚｡⋆୨୧˚ ˚୨୧⋆｡˚ ⋆ </div>

## 📑 Table of Contents
* [✨ Key Features](#features)
* [⌨️ The Command Menu](#command-menu)
* [🚀 Installation & Setup](#setup)
* [🔒 Required Intents](#permissions)
* [🛠️ Troubleshooting](#troubleshooting)

<div align="center"> ⋆ ˚｡⋆୨୧˚ ˚୨୧⋆｡˚ ⋆ </div>

<a name="features"></a>
## ✨ Key Features

💖 **Seamless Auto-Fixing**
Paste a `twitter.com`, `x.com`, or `tiktok.com` link. yappuchino instantly swaps it to a working proxy (`fxtwitter` / `kktiktok`), deletes the original, and keeps the chat clean while crediting the sender.

🧠 **Persistent AI Memory**
Powered by **Gemini 1.5 Flash** and **MongoDB**. yappuchino remembers the last 40 messages in a channel even if the bot restarts. She actually knows who she's talking to!

📖 **Integrated AniList Search**
Looking for a new show? Type `{Jujutsu Kaisen}` for anime or `<Chainsaw Man>` for manga to get high-res art and descriptions instantly.

🛡️ **Smart Concurrency**
Built-in locks and cooldowns ensure the AI doesn't crash during busy group chats, keeping responses snappy and stable.

<div align="center"> ⋆ ˚｡⋆୨୧˚ ˚୨୧⋆｡˚ ⋆ </div>

<a name="command-menu"></a>
## ⌨️ The Command Menu

### 🌸 AI & Social

| Command | Description |
| :--- | :--- |
| `bp.enablechat` | Authorizes yappuchino to participate in the current channel. |
| `bp.disablechat` | Silences the AI and clears the local channel memory. |
| `bp.hug <@user>` | Wrap a friend in a big warm hug! |
| `bp.pat <@user>` | Give someone soft headpats. |
| `bp.avatar` | Grabs a high-res version of someone's pfp. |

### 🔎 Search & Magic

| Trigger | Description | 
| :--- | :--- | 
| `{Anime Title}` | Instant AniList anime search. | 
| `<Manga Title>` | Instant AniList manga search. | 
| `@yappuchino <msg>` | Quick Magic 8-Ball response (if AI chat is disabled). | 

### 🛠️ Moderation & Developer

| Command | Description | 
| :--- | :--- | 
| `bp.cwean <num>` | Bulk deletes messages (Requires `Manage Messages`). | 
| `bp.stats` | **(Dev Only)** Shows ping, uptime, and memory usage. | 
| `bp.restart` | **(Dev Only)** Safely shuts down the bot process. | 

<div align="center"> ⋆ ˚｡⋆୨୧˚ ˚୨୧⋆｡˚ ⋆ </div>

<a name="setup"></a>
## 🚀 Installation & Setup

### 1. Prerequisites
* **Node.js** (v18+)
* **MongoDB Atlas** account (or local instance)
* **Google AI Studio** API Key (Gemini)

### 2. Quick Start
```bash
git clone [https://github.com/deeandrea/yappuchino.git](https://github.com/deeandrea/yappuchino.git)
cd yappuchino
npm install express dotenv discord.js @google/generative-ai mongodb
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
DISCORD_TOKEN=your_bot_token
GEMINI_API_KEY=your_gemini_key
MONGO_URI=your_mongodb_connection_string
PORT=3000
```

### 4. Run the Bot
```bash
node index.js
```

<div align="center"> ⋆ ˚｡⋆୨୧˚ ˚୨୧⋆｡˚ ⋆ </div>

<a name="permissions"></a>
## 🔒 Required Intents & Permissions

* **Privileged Intents:** `Message Content Intent` (REQUIRED)
* **Bot Permissions:**
  * `Manage Messages` (To clean up links)
  * `Embed Links` 
  * `Read Message History`
  * `Add Reactions`

<div align="center"> ⋆ ˚｡⋆୨୧˚ ˚୨୧⋆｡˚ ⋆ </div>

<a name="troubleshooting"></a>
## 🛠️ Troubleshooting

<details>
<summary><b>The AI isn't responding in my channel!</b></summary>
Use <code>bp.enablechat</code> first! yappuchino respects your privacy and won't yap unless she's invited to that specific channel.
</details>

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
  <p>Let's make Discord a cuter place together! Pull requests for new features or bug fixes are always welcome.</p>

  <a href="https://ko-fi.com/wenwen" target="_blank"><img src="https://img.shields.io/badge/Buy_Me_a_Cappuchino-%E2%98%95-FFB6C1?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Buy Me A Coffee"></a>

  <br><br>
  <sub>Made with 💖 by <a href="https://github.com/deeandrea">wenwen</a></sub>
</div>