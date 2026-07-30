const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    try {
        // 1. REACTION STARTS FIRST
        await sock.sendMessage(chatId, { react: { text: '🤖', key: message.key } });

        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        
        // 🖼️ Your Direct Image Links
        const menuImages = [
            "https://i.postimg.cc/jdJ8c9Gq/file-00000000245c81f493f23c89df56530e.png",
            "https://i.postimg.cc/jdJ8c9Gq/file-00000000245c81f493f23c89df56530e.png",
            "https://i.postimg.cc/jdJ8c9Gq/file-00000000245c81f493f23c89df56530e.png",
            "https://i.postimg.cc/jdJ8c9Gq/file-00000000245c81f493f23c89df56530e.png",
            "https://i.postimg.cc/jdJ8c9Gq/file-00000000245c81f493f23c89df56530e.png"
        ];
        const randomImg = menuImages[Math.floor(Math.random() * menuImages.length)];
        
        const imageLink = "https://i.postimg.cc/jdJ8c9Gq/file-00000000245c81f493f23c89df56530e.png";

// 2. Send the Image (via Link)
const botBio = `\n` +
               `🤖*Bot*:${settings.botName || 'JNR NKANU CONCEPT™'}*\n` +
               `🤖*Version*:*${settings.version || '3.0.6'}*\n` +
               `⚓*Owner*:${settings.botOwner || 'JNR NKANU'}\n` +
               `📶*𝐒𝐭𝐚𝐭𝐮𝐬:* System Active\n` +
               `📍 _"Let's make your day a happy one!"_`;

await sock.sendMessage(chatId, {
    image: { url: imageLink },
    caption: botBio
}, { quoted: message });

await delay(1200);

        // 4. Main Menu Text
        const menuText = `╔══════════════════╗
║       *JNR-MD* 🤖
║     *WHATSAPP BOT*
╚══════════════════╝

👤 *User:* ${message.pushName || 'User'}
🤖 *Bot:* JNR-MD BOT
👑 *Owner:* JNR NKANU
⚡ *Prefix:* .

╭━━━〔 📚 *GENERAL*〕━━━⬣
┃➤ .menu / .help
┃➤ .ping
┃➤ .alive
┃➤ .tts <text>
┃➤ .owner
┃➤ .joke
┃➤ .quote
┃➤ .fact
┃➤ .weather <city>
┃➤ .news
┃➤ .attp <text>
┃➤ .lyrics <song>
┃➤ .8ball <question>
┃➤ .groupinfo
┃➤ .staff / .admins
┃➤ .vv
┃➤ .vv2
┃➤ .trt <text> <language>
┃➤ .ss <url>
┃➤ .jid
┃➤ .url
╰━━━━━━━━━━━━⬣

╭━━━〔 🛡️ *ADMIN* 〕━━━⬣
┃➤ .ban @user
┃➤ .warn @user
┃➤ .warnings @user
┃➤ .kick @user
┃➤ .delete / .del
┃➤ .promote @user
┃➤ .demote @user
┃➤ .mute <minutes>
┃➤ .unmute
┃➤ .tag <text>
┃➤ .tagall
┃➤ .tagnotadmin
┃➤ .hidetag <text>
┃➤ .clear
┃➤ .chatbot
┃➤ .antilink
┃➤ .antibadword
┃➤ .antitag <on/off>
┃➤ .resetlink
┃➤ .welcome <on/off>
┃➤ .goodbye <on/off>
┃➤ .setgname <name>
┃➤ .setgdesc <description>
┃➤ .setgpp
╰━━━━━━━━━━━━⬣
╭━━━〔 👑 *OWNER* 〕━━━⬣
┃➤ .mode <public/private>
┃➤ .settings
┃➤ .update
┃➤ .setpp
┃➤ .clearsession
┃➤ .cleartmp
┃➤ .antidelete
┃➤ .antiviewonce
┃➤ .autoreact <on/off>
┃➤ .autostatus <on/off>
┃➤ .autostatus react <on/off>
┃➤ .autotyping <on/off>
┃➤ .autoread <on/off>
┃➤ .anticall <on/off>
┃➤ .pmblocker <on/off/status>
┃➤ .pmblocker setmsg <text>
┃➤ .mention <on/off>
┃➤ .setmention
╰━━━━━━━━━━━━⬣

╭━〔 🖼️ *IMAGE & STICKER* 〕━⬣
┃➤ .sticker
┃➤ .blur
┃➤ .crop
┃➤ .removebg
┃➤ .remini
┃➤ .simage
┃➤ .tgsticker
┃➤ .meme
┃➤ .take <packname>
┃➤ .emojimix <emoji1>+<emoji2>
┃➤ .igs <link>
┃➤ .igsc <link>
╰━━━━━━━━━━━━⬣

╭━━━〔 🎮 *GAMES* 〕━━━⬣
┃➤ .tictactoe @user
┃➤ .hangman
┃➤ .guess <letter>
┃➤ .trivia
┃➤ .answer <answer>
┃➤ .truth
┃➤ .dare
╰━━━━━━━━━━━━⬣

╭━━━〔 🤖 *AI* 〕━━━⬣
┃➤ .gpt <question>
┃➤ .gemini <question>
┃➤ .imagine <prompt>
┃➤ .flux <prompt>
┃➤ .sora <prompt>
╰━━━━━━━━━━━━⬣

╭━━〔 📥 *DOWNLOADER* 〕━⬣
┃➤ .play <song>
┃➤ .song <song>
┃➤ .spotify <query>
┃➤ .instagram <link>
┃➤ .facebook <link>
┃➤ .tiktok <link>
┃➤ .video <song>
┃➤ .ytmp4 <link>
╰━━━━━━━━━━━━⬣

╭━〔 🎨 *FUN & MISC* 〕━⬣
┃➤ .heart
┃➤ .horny
┃➤ .circle
┃➤ .lgbt
┃➤ .police
┃➤ .its-so-stupid
┃➤ .namecard
┃➤ .oogway
┃➤ .tweet
┃➤ .ytcomment
┃➤ .comrade
┃➤ .gay
┃➤ .glass
┃➤ .jail
┃➤ .passed
┃➤ .triggered
╰━━━━━━━━━━━━⬣
╭━━〔 💻 *DEVELOPER* 〕━━⬣
┃➤ .Nkanu Onnoghen Nkanu 
┃➤ .+2349137495210
┃➤ .IG Jnr Nkanu Concepts
╰━━━━━━━━━━━━⬣
╭━━━〔 💻 *GITHUB* 〕━━━⬣
┃➤ .git
┃➤ .github
┃➤ .repo
┃➤ .script
┃➤ .sc
╰━━━━━━━━━━━━⬣

╔══════════════════╗
║ ⚡ *JNR NKANU CONCEPTS™* ⚡
╠══════════════════╣
║ 🚀 Fast • Secure • Reliable
║💡 Powered by *Jnr Nkanu*
╚══════════════════`;

        // 5. Send Image with Menu AND Attached Newsletter metadata
        await sock.sendMessage(chatId, { 
            image: { url: randomImg }, 
            caption: menuText,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363430052546986@newsletter', // Updated JID
                    newsletterName: '*JNR NKANU CONCEPTS™*',
                    serverMessageId: 111
                }
            }
        }, { quoted: message });

    } catch (err) {
        console.error('❌ Menu Error:', err);
        await sock.sendMessage(chatId, { text: "🤖 *JNR NKANU CONCEPTS™!*" });
    }
}

module.exports = helpCommand;