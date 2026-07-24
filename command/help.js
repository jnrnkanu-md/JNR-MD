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
               `⚓*Owner*:${settings.botOwner || 'JNR NKANU🤖'}\n` +
               `📶*𝐒𝐭𝐚𝐭𝐮𝐬:* System Active\n` +
               `📍 _"Let's make your day a happy one!"_`;

await sock.sendMessage(chatId, {
    image: { url: imageLink },
    caption: botBio
}, { quoted: message });

await delay(1200);

        // 4. Main Menu Text
        const menuText = `🤖 *【JNR NKANU™* 🤖

🎭*𝙐𝙨𝙚𝙧:* ${message.pushName || 'User'}
🤖*𝘽𝙤𝙩:* *JNR NKANU CONCEPTS™*
👑*𝙊𝙬𝙣𝙚𝙧:* *JNR NKANU*
┎━━━〔🌐 *𝙂𝙀NERAL*〕━━━┈
┃🤖.help or .menu
┃☕.ping
┃🕣.alive
┃📢.tts <text>
┃🤖.owner
┃🃏.joke
┃☕.quote
┃🎗️.fact
┃☁.weather <city>
┃📜.news
┃🤖.attp <text>
┃🎵.lyrics <song_title>
┃🏐.8ball <question>
┃🔰.groupinfo
┃⚙.staff or .admins 
┃🤖.vv 
+🎬.vv2
┃🎐.trt <text> <lang>
┃📸.ss <link>
┃🤖.jid
┃📎.url
┗━━━━━━━━━━━━━━┈

┎━━━〔 ✅ *𝘼𝘿𝙈𝙄𝙉𝙎* 〕━━━┈
┃⚠.ban @user
┃⚙.promote @user
┃⚙.demote @user
┃⚙.mute <minutes>
┃⚙.unmute
┃🚫.delete or .del
┃🚫.kick @user
┃⚠.warnings @user
┃⚠.warn @user
┃❌.antilink
┃❌.antibadword
┃⚙.clear 
┃⚙.tag <message>
┃⚙.tagall
┃⚙.tagnotadmin
┃👁.hidetag <message>
┃🤖.chatbot
┃⚙.resetlink
┃❌.antitag <on/off>
┃🤝🏼.welcome <on/off>
┃👋🏼.goodbye <on/off>
┃⚙.setgdesc <description>
┃⚙.setgname <new name>
┃⚙.setgpp (reply to image)
┗━━━━━━━━━━━━━━┈

┎━━━〔 🔒 *𝙊𝙒𝙉𝙀𝙍* 〕━━━┈
┃🤖.mode <public/private>
┃📍.clearsession
┃🤖.antidelete
+🚫.antiviewonce
┃🗄️.cleartmp
┃🤖.update
┃⚙.settings
┃⚙.setpp <reply to image>
┃🎃.autoreact <on/off>
┃✨.autostatus <on/off>
┃🎈.autostatus react <on/off>
┃💻.autotyping <on/off>
┃✅.autoread <on/off>
┃❌.anticall <on/off>
┃✖.pmblocker <on/off/status>
┃❌.pmblocker setmsg <text>
┃⚙.setmention <reply to msg>
┃⚙.mention <on/off>
┗━━━━━━━━━━━━━━┈

┎━━━━━━━━━━━━━━━
*Image/Sticker Commands*
┗━━━━━━━━━━━━━━┈
┎━━━━━━━━━━━━━━━
┃🤖.blur <image>
┃💎.simage <reply to sticker>
┃🤖.sticker <reply to image>
┃💎.removebg
┃🤖.remini
┃💎.crop <reply to image>
┃🤖.tgsticker <Link>
┃💎.meme
┃🤖.take <packname> 
┃💎.emojimix <emj1>+<emj2>
┃💎.igs <insta link>
┃💎.igsc <insta link>
┗━━━━━━━━━━━━━━┈ 

┎━━━━━━━━━━━━━━━
┃🎮 *Game Commands*┃
┗━━━━━━━━━━━━━━┈
┎━━━━━━━━━━━━━━━
┃🕹️.tictactoe @user
┃🎮.hangman
┃🕹️.guess <letter>
┃🎮.trivia
┃🕹️.answer <answer>
┃🎮.truth
┃🕹️.dare
┗━━━━━━━━━━━━━━┈

┎━━━━━━━━━━━━━━━
┃🤖 *AI Commands*       ┃
┗━━━━━━━━━━━━━━┈
┎━━━━━━━━━━━━━━━
┃🤖.gpt <question>
┃🤖.gemini <question>
┃🤖.imagine <prompt>
┃🤖.flux <prompt>
┃🤖.sora <prompt>
┗━━━━━━━━━━━━━━┈

┎━━━━━━━━━━━━━━━
┃📥 *Downloader*            ┃
┗━━━━━━━━━━━━━━┈
┎━━━━━━━━━━━━━━━
┃🎵.play <song_name>   
┃🎶.song <song_name> 
┃🎧.spotify <query>
┃💽.instagram <link>
┃📎.facebook <link>
┃🎬.tiktok <link>
┃🎬.video <song name>
┃💾.ytmp4 <Link>
┗━━━━━━━━━━━━━━┈

┎━━━━━━━━━━━━━━━
┃🎧 *MISC*                       ┃
┗━━━━━━━━━━━━━━┈
┎━━━━━━━━━━━━━━━
┃❤.heart
┃🤤.horny
┃🤖.circle
┃🎰.lgbt
┃💂🏽.police
┃🤖.its-so-stupid
┃🎰.namecard 
┃🤖.oogway
┃🖌️.tweet
┃📜.ytcomment 
┃⚔.comrade 
┃🏃🏽.gay 
┃🍸.glass 
┃⛓.jail 
┃🤖.passed 
┃🔫.triggered
┗━━━━━━━━━━━━━━┈

┎━━━━━━━━━━━━━━━
┃💻 *Github Commands:*┃
┗━━━━━━━━━━━━━━┈
┎━━━━━━━━━━━━━━━━━
┃➤ .git
┃➤ .github
┃➤ .sc
┃➤ .script
┃➤ .repo
┗━━━━━━━━━━━━━━┈

💻JNR NKANU CONCEPTS™💻
*🤖\n\n*Join our channel for updates*!`;

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