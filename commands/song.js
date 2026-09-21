const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function songCommand(sock, chatId, message) {
    let tempFilePath = null;
    try {
        const text = message.message?.conversation 
            || message.message?.extendedTextMessage?.text 
            || message.text 
            || '';

        const searchQuery = text.split(' ').slice(1).join(' ').trim();
        
        if (!searchQuery) {
            return await sock.sendMessage(chatId, { 
                text: "❌ Please provide a song name!\n\n*Example:* `.play London view by bm`"
            }, { quoted: message });
        }

        // Send initial searching notification
        await sock.sendMessage(chatId, {
            text: `🔎 *Searching and processing:* _"${searchQuery}"_\n_Please wait..._`
        }, { quoted: message });

        // 1. Call API with a higher timeout (60s) to allow YouTube parsing
        const apiUrl = `https://apis.davidcyril.name.ng/play?query=${encodeURIComponent(searchQuery)}`;
        const { data } = await axios.get(apiUrl, { 
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!data || !data.status || !data.result || !data.result.download_url) {
            return await sock.sendMessage(chatId, { 
                text: "❌ Download server is currently unreachable or could not find the song."
            }, { quoted: message });
        }

        const song = data.result;
        const downloadUrl = song.download_url;
        const title = song.title || searchQuery;

        // 2. Send image thumbnail with song information
        if (song.thumbnail) {
            await sock.sendMessage(chatId, {
                image: { url: song.thumbnail },
                caption: `🎵 Downloading: *${title}*\n⏱ Duration: ${song.duration || 'N/A'}`
            }, { quoted: message });
        }

        // 3. Save directly to disk stream with 120s timeout
        const safeFilename = title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
        tempFilePath = path.join(os.tmpdir(), `song_${Date.now()}_${safeFilename}.mp3`);

        const writer = fs.createWriteStream(tempFilePath);
        const response = await axios({
            url: downloadUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 120000, // 2 minutes for slow stream transfers
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // 4. Send audio file
        await sock.sendMessage(chatId, {
            audio: { url: tempFilePath },
            mimetype: 'audio/mpeg',
            fileName: `${title.replace(/[^\w\s-]/g, '')}.mp3`,
            ptt: false,
            contextInfo: {
                externalAdReply: {
                    title: title,
                    body: `Duration: ${song.duration || 'N/A'}`,
                    thumbnailUrl: song.thumbnail,
                    sourceUrl: song.video_url || 'https://youtube.com',
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: message });

    } catch (error) {
        console.error('Song command execution error:', error?.message || error);

        let errorMessage = "❌ Unable to process song request at this moment.";
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            errorMessage = "❌ The server took too long to fetch the song. Please try again in a few seconds.";
        }

        await sock.sendMessage(chatId, { 
            text: errorMessage
        }, { quoted: message });
    } finally {
        // Clean up temp file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
            } catch (err) {}
        }
    }
}

module.exports = songCommand;