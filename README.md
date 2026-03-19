# 🎀 FixedEmbed & AniList Bot 🌸

Welcome to the cutest, most helpful utility bot for your Discord server! ( ˶ˆ꒳ˆ˵ ) 

Have you ever tried to share a TikTok or Twitter/X link with your friends, only to realize the video or image won't embed properly? This bot is here to save the day! It automatically detects broken social media links, replaces them with fully functioning embedded versions, and cleans up the chat behind it. Plus, it comes packed with adorable social commands and an integrated Anime/Manga search!

---

## 📑 Table of Contents
1. [✨ Key Features](#-key-features)
2. [🚀 Installation & Setup](#-installation--setup)
3. [⚙️ Configuration & Customization](#️-configuration--customization)
4. [⌨️ Commands List](#️-commands-list)
5. [🔒 Required Permissions & Intents](#-required-permissions--intents)
6. [🛠️ Troubleshooting & FAQ](#️-troubleshooting--faq)
7. [💖 Contributing](#-contributing)

---

## ✨ Key Features

### 🛠️ Auto-Link Fixer
Discord natively struggles to embed videos from certain platforms. This bot actively listens for links from:
* `twitter.com` & `x.com` ➡️ Converts to `fxtwitter.com`
* `tiktok.com`, `vm.tiktok.com`, `vt.tiktok.com` ➡️ Converts to `kktiktok.com`

**Smart Deletion:** When the bot fixes a link, it deletes your original message and reposts it as a beautiful embed with your profile picture and name. 
*Note: If your original message contained a file attachment or was a direct reply to someone, the bot is smart enough to leave your original message alone so nothing gets lost!*

### 📖 AniList GraphQL Integration
Looking for a new show to binge? You can search the massive AniList database right from the chat:
* Wrap an anime title in curly brackets: `{Jujutsu Kaisen}`
* Wrap a manga title in angle brackets: `<Chainsaw Man>`
The bot will return the official cover art, a description, genres, and the current release status!

### 🫂 Kawaii Social Interactions
Spread some love in your server! Use commands like `bp.hug` and `bp.pat` to interact with your friends (or the bot itself!).

### 🌐 24/7 Uptime Ready
Includes a built-in Express.js web server. This makes it incredibly easy to keep the bot online 24/7 using free hosting services like Render, UptimeRobot, or Replit.

---

## 🚀 Installation & Setup

### 1. Prerequisites
Before you begin, ensure you have the following installed:
* [Node.js](https://nodejs.org/) (Version 16.9.0 or higher is required for Discord.js v14)
* A Code Editor (like VS Code)
* A Registered Discord Bot (Create one at the [Discord Developer Portal](https://discord.com/developers/applications))

### 2. Clone the Repository
```bash
git clone [https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git)
cd YOUR_REPO_NAME