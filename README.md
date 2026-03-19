# 🎀 FixedEmbed & AniList Bot 🌸

A super cute, multipurpose Discord bot built with `discord.js`! It automatically fixes broken Twitter/X and TikTok embeds, fetches Anime and Manga details directly from AniList, and brings a whole lot of kawaii energy to your server. ( ˶ˆ꒳ˆ˵ )

## ✨ Features

* **🛠️ Auto-Link Fixer:** Automatically detects `twitter.com`, `x.com`, and `tiktok.com` links and replaces them with their fixed embed equivalents (`fxtwitter` and `kktiktok`). It even extracts the creator's handle!
* **📖 Anime & Manga Lookups:** Type any anime name in `{curly brackets}` or manga in `<angle brackets>` to instantly pull up its cover art, description, and status using the AniList GraphQL API.
* **🧹 Smart Cleanup:** Automatically deletes the original ugly link message to keep your chat clean (unless the message has an attachment or is a reply, then it safely leaves it alone!).
* **💖 Cute Interactions:** Give your friends virtual hugs and headpats.
* **🌐 Keep-Alive Server:** Built-in Express web server to keep the bot alive on hosting platforms like Render or Replit.
* **🎮 Rotating Statuses:** The bot cycles through a list of adorable Rich Presence statuses every 30 minutes.

---

## 💻 Installation & Setup

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v16.9.0 or newer)
* A Discord Bot Token (Get one from the [Discord Developer Portal](https://discord.com/developers/applications))

### 2. Clone and Install
```bash
# Clone the repository
git clone [https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git)
cd YOUR_REPO_NAME

# Install dependencies
npm install discord.js dotenv express
