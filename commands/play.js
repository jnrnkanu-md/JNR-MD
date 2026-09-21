const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function playCommand(sock, chatId, message) {
    let tempFilePath = null;
    try {
        // Parse search query from message
        const text = message.message?.conversation 
            || message.message?.extendedTextMessage?.text 
            || message.text 
            || '';

        const searchQuery = text.split(' ').slice(1).join(' ').trim();
        
        if (!searchQuery) {
            return await sock.sendMessage(chatId, { 
                text: "❌ Please provide a song name or search query!\n\n*Example:* `.play Faded`"
            }, { quoted: message });
        }

        // Send initial reaction or status message
        await sock.sendMessage(chatId, {
            text: `🔎 *Searching and downloading:* _"${searchQuery}"_\n_Please wait..._`
        }, { quoted: message });

        // Call David Cyril Play API
        const apiUrl = `https://apis.davidcyril.name.ng/play?query=${encodeURIComponent(searchQuery)}`;
        const { data } = await axios.get(apiUrl, { timeout: 15000 });

        if (!data || !data.status || !data.result || !data.result.download_url) {
            return await sock.sendMessage(chatId, { 
                text: "❌ Unable to fetch audio from the server. Please try again later."
            }, { quoted: message });
        }

        const song = data.result;
        const downloadUrl = song.download_url;
        const title = song.title || searchQuery;

        // Create temporary file path on disk (avoids RAM buffering)
        const safeFilename = title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
        tempFilePath = path.join(os.tmpdir(), `play_${Date.now()}_${safeFilename}.mp3`);

        // Stream audio direct to disk
        const writer = fs.createWriteStream(tempFilePath);
        const response = await axios({
            url: downloadUrl,
            method: 'GET',
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        response.data.pipe(writer);

        // Wait for download to finish writing to disk
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // Send audio using disk path stream
        await sock.sendMessage(chatId, {
            audio: { url: tempFilePath },
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`,
            ptt: false, // Set to true if you want it as a voice note
            contextInfo: {
                externalAdReply: {
                    title: title,
                    body: `Duration: ${song.duration || 'N/A'} | Views: ${song.views || 'N/A'}`,
                    thumbnailUrl: song.thumbnail,
                    sourceUrl: song.video_url,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: message });

    } catch (error) {
        console.error('Error in play command:', error?.message || error);
        await sock.sendMessage(chatId, { 
            text: "❌ Download failed due to a network error or server timeout."
        }, { quoted: message });
    } finally {
        // Clean up temporary disk file to prevent storage bloat
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
            } catch (cleanupErr) {
                console.error('Failed to remove temp file:', cleanupErr);
            }
        }
    }
}

module.exports = playCommand;

/*
 * Powered by JNR-MD
 * Credits to Jnr-Nkanu-Concrpts
 */
