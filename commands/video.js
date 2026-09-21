const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * JNR-MD - Video Downloader Command
 * Powered by Megan API
 */

const API_KEY = 'megan_ee570c538efeae230e2c8a8361b81707';

async function videoCommand(sock, chatId, message) {
    let tempFilePath = null;
    try {
        const text = message.message?.conversation 
            || message.message?.extendedTextMessage?.text 
            || message.text 
            || '';

        const searchQuery = text.split(' ').slice(1).join(' ').trim();
        
        if (!searchQuery) {
            await sock.sendMessage(chatId, { 
                text: '❌ *Usage:* `.video <video name or YouTube link>`\n\n*Example:* `.video Golden by hunters`' 
            }, { quoted: message });
            return;
        }

        let targetUrl = '';
        let videoTitle = searchQuery;
        let videoThumbnail = '';

        const isUrl = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i.test(searchQuery);

        if (isUrl) {
            targetUrl = searchQuery;
        } else {
            const searchResult = await yts(searchQuery);
            if (!searchResult || !searchResult.videos || searchResult.videos.length === 0) {
                await sock.sendMessage(chatId, { text: '❌ No videos found for your search query!' }, { quoted: message });
                return;
            }
            targetUrl = searchResult.videos[0].url;
            videoTitle = searchResult.videos[0].title;
            videoThumbnail = searchResult.videos[0].thumbnail;
        }

        // Send thumbnail status preview
        if (videoThumbnail) {
            await sock.sendMessage(chatId, {
                image: { url: videoThumbnail },
                caption: `🎬 Downloading Video: *${videoTitle}*\n_Please wait..._`
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: `🎬 *Searching and processing:* _"${searchQuery}"_\n_Please wait, downloading video..._`
            }, { quoted: message });
        }

        // Query Megan API
        const apiUrl = `https://apis.megan.qzz.io/download/hd?api_key=${API_KEY}&url=${encodeURIComponent(targetUrl)}`;

        const { data: resData } = await axios.get(apiUrl, {
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        });

        console.log('[MEGAN API RESPONSE]:', JSON.stringify(resData));

        // Extract nested data payload safely
        const payload = resData?.data || resData?.result || resData;

        // Prefer proxyUrl first to bypass ymcdn link-blocking, fallback to downloadUrl
        const downloadUrl = payload?.proxyUrl 
            || payload?.downloadUrl 
            || payload?.download_url 
            || payload?.url 
            || payload?.mp4;

        const title = payload?.title || videoTitle || searchQuery;

        if (!downloadUrl) {
            await sock.sendMessage(chatId, { 
                text: '❌ Download server returned no valid video stream. Please try again later.' 
            }, { quoted: message });
            return;
        }

        // Prepare temporary storage file
        const safeFilename = title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
        tempFilePath = path.join(os.tmpdir(), `video_${Date.now()}_${safeFilename}.mp4`);

        // Stream video directly to disk
        const writer = fs.createWriteStream(tempFilePath);
        const response = await axios({
            url: downloadUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 180000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // Send MP4 video stream to WhatsApp
        await sock.sendMessage(chatId, {
            video: { url: tempFilePath },
            mimetype: 'video/mp4',
            fileName: `${title.replace(/[^\w\s-]/g, '')}.mp4`,
            caption: `*${title}*\n\n> *_Downloaded by JNR-MD_*`
        }, { quoted: message });

    } catch (error) {
        console.error('[VIDEO] Command Error:', error?.message || error);
        
        let errorMessage = '❌ Failed to download video.';
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            errorMessage = '❌ Download timed out. The video file might be too large or the server is busy.';
        } else if (error.message) {
            errorMessage = `❌ Download failed: ${error.message}`;
        }
        
        await sock.sendMessage(chatId, { text: errorMessage }, { quoted: message });
    } finally {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
            } catch (cleanupErr) {}
        }
    }
}

module.exports = videoCommand;
