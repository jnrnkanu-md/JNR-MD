const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * JNR-MD - WhatsApp Status Command
 */
async function tostatusCommand(sock, chatId, message, args) {
    let tempFilePath = null;
    try {
        const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const captionText = args ? args.join(' ').trim() : '';
        const statusJid = 'status@broadcast';

        // 1. Quoted Image Upload
        if (quotedMsg?.imageMessage) {
            await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

            const stream = await downloadContentFromMessage(quotedMsg.imageMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            await sock.sendMessage(statusJid, {
                image: buffer,
                caption: captionText || quotedMsg.imageMessage.caption || ''
            }, {
                statusJidList: [statusJid]
            });

            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
            return await sock.sendMessage(chatId, { 
                text: "✅ *Image successfully posted to your status!*" 
            }, { quoted: message });
        }

        // 2. Quoted Video Upload
        if (quotedMsg?.videoMessage) {
            await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

            const stream = await downloadContentFromMessage(quotedMsg.videoMessage, 'video');
            tempFilePath = path.join(os.tmpdir(), `status_vid_${Date.now()}.mp4`);
            const writeStream = fs.createWriteStream(tempFilePath);

            for await (const chunk of stream) {
                writeStream.write(chunk);
            }
            writeStream.end();

            await new Promise((resolve) => writeStream.on('finish', resolve));

            await sock.sendMessage(statusJid, {
                video: { url: tempFilePath },
                caption: captionText || quotedMsg.videoMessage.caption || '',
                mimetype: 'video/mp4'
            }, {
                statusJidList: [statusJid]
            });

            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
            return await sock.sendMessage(chatId, { 
                text: "✅ *Video successfully posted to your status!*" 
            }, { quoted: message });
        }

        // 3. Text-only Status Upload
        if (captionText) {
            await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

            await sock.sendMessage(statusJid, {
                text: captionText,
                backgroundColor: '#121212',
                font: 1
            }, {
                statusJidList: [statusJid]
            });

            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
            return await sock.sendMessage(chatId, { 
                text: "✅ *Text status successfully posted!*" 
            }, { quoted: message });
        }

        // 4. Instructions
        await sock.sendMessage(chatId, { 
            text: "❌ *Usage Instructions:*\n\n" +
                  "• *Text Status:* `.tostatus Your status text`\n" +
                  "• *Image Status:* Reply to an image with `.tostatus optional caption`\n" +
                  "• *Video Status:* Reply to a video with `.tostatus optional caption`" 
        }, { quoted: message });

    } catch (error) {
        console.error('Error in tostatus command:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, { 
            text: `❌ *Upload failed:* ${error.message || 'Unknown error'}` 
        }, { quoted: message });
    } finally {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
            } catch (cleanupErr) {}
        }
    }
}

module.exports = tostatusCommand;
