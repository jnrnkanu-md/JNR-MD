const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const settings = require('../settings');
const isOwnerOrSudo = require('../lib/isOwner');

function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
            if (err) return reject(new Error((stderr || stdout || err.message || '').toString()));
            resolve((stdout || '').toString());
        });
    });
}

async function hasGitRepo() {
    const gitDir = path.join(process.cwd(), '.git');
    if (!fs.existsSync(gitDir)) return false;
    try {
        await run('git --version');
        return true;
    } catch {
        return false;
    }
}

async function ensureGitRemote(repoUrl) {
    // Ensure origin exists and points to repoUrl. If it doesn't exist, add it; if different, set it.
    try {
        const current = await run('git remote get-url origin').catch(() => '').then(s => s.trim());
        if (!current) {
            await run(`git remote add origin ${repoUrl}`);
        } else if (current !== repoUrl) {
            await run(`git remote set-url origin ${repoUrl}`);
        }
        return true;
    } catch (e) {
        // Not fatal — caller can still attempt to fetch
        return false;
    }
}

async function resolveRemoteBranch() {
    // Get current branch name (detached HEAD will return "HEAD")
    try {
        let branch = (await run('git rev-parse --abbrev-ref HEAD')).trim();
        if (!branch || branch === 'HEAD') {
            // Fallback: try to use origin/HEAD or main/master
            try {
                const originHead = (await run('git symbolic-ref refs/remotes/origin/HEAD').catch(() => '')).trim();
                if (originHead) {
                    const m = originHead.match(/refs\/remotes\/origin\/(.*)$/);
                    if (m) branch = m[1];
                }
            } catch {}
        }
        if (!branch || branch === 'HEAD') branch = 'main';
        return branch;
    } catch {
        return 'main';
    }
}

async function updateViaGit() {
    const repoUrl = (settings.updateRepoUrl || process.env.UPDATE_REPO_URL || 'https://github.com/jnrnkanu-md/JNR-MD.git').trim();
    try { await ensureGitRemote(repoUrl); } catch {}

    const branch = await resolveRemoteBranch();

    const oldRev = (await run('git rev-parse HEAD').catch(() => 'unknown')).trim();
    try {
        await run('git fetch --all --prune');
    } catch (e) {
        // Try fetching origin explicitly
        try { await run(`git fetch origin`); } catch {}
    }

    // try several remote refs (origin/<branch>, origin/main, origin/master)
    let newRev = '';
    const candidates = [`origin/${branch}`, 'origin/main', 'origin/master'];
    for (const ref of candidates) {
        try {
            newRev = (await run(`git rev-parse ${ref}`)).trim();
            if (newRev) {
                // Use this ref
                break;
            }
        } catch {
            // ignore
        }
    }
    if (!newRev) {
        // As a last resort, try to fetch from the configured repo URL and use FETCH_HEAD
        try {
            await run(`git fetch ${repoUrl} +refs/heads/*:refs/remotes/origin/*`);
            newRev = (await run(`git rev-parse origin/${branch}`).catch(() => '')).trim();
        } catch {}
    }

    const alreadyUpToDate = oldRev && newRev && oldRev === newRev;
    const commits = alreadyUpToDate ? '' : await run(`git log --pretty=format:"%h %s (%an)" ${oldRev}..${newRev}`).catch(() => '');
    const files = alreadyUpToDate ? '' : await run(`git diff --name-status ${oldRev} ${newRev}`).catch(() => '');

    // If we resolved a newRev, reset to it; otherwise throw
    if (!newRev) throw new Error('Unable to resolve a remote revision to update to');

    await run(`git reset --hard ${newRev}`);
    await run('git clean -fd');
    return { oldRev, newRev, alreadyUpToDate, commits, files };
}

function downloadFile(url, dest, visited = new Set()) {
    return new Promise((resolve, reject) => {
        try {
            if (visited.has(url) || visited.size > 10) {
                return reject(new Error('Too many redirects'));
            }
            visited.add(url);

            const useHttps = url.startsWith('https://');
            const client = useHttps ? require('https') : require('http');
            const req = client.get(url, {
                headers: {
                    'User-Agent': 'JNR NKANU Bot-Updater/1.0',
                    'Accept': '*/*'
                }
            }, res => {
                if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
                    const location = res.headers.location;
                    if (!location) return reject(new Error(`HTTP ${res.statusCode} without Location`));
                    const nextUrl = new URL(location, url).toString();
                    res.resume();
                    return downloadFile(nextUrl, dest, visited).then(resolve).catch(reject);
                }

                if (res.statusCode !== 200) {
                    return reject(new Error(`HTTP ${res.statusCode}`));
                }

                const file = fs.createWriteStream(dest);
                res.pipe(file);
                file.on('finish', () => file.close(resolve));
                file.on('error', err => {
                    try { file.close(() => {}); } catch {}
                    fs.unlink(dest, () => reject(err));
                });
            });
            req.on('error', err => {
                fs.unlink(dest, () => reject(err));
            });
        } catch (e) {
            reject(e);
        }
    });
}

async function extractZip(zipPath, outDir) {
    if (process.platform === 'win32') {
        const cmd = `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir.replace(/\\/g, "/")}' -Force"`;
        await run(cmd);
        return;
    }
    try {
        await run('command -v unzip');
        await run(`unzip -o '${zipPath}' -d '${outDir}'`);
        return;
    } catch {}
    try {
        await run('command -v 7z');
        await run(`7z x -y '${zipPath}' -o'${outDir}'`);
        return;
    } catch {}
    try {
        await run('busybox unzip -h');
        await run(`busybox unzip -o '${zipPath}' -d '${outDir}'`);
        return;
    } catch {}
    throw new Error("No system unzip tool found (unzip/7z/busybox).");
}

function copyRecursive(src, dest, ignore = [], relative = '', outList = []) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
        if (ignore.includes(entry)) continue;
        const s = path.join(src, entry);
        const d = path.join(dest, entry);
        const stat = fs.lstatSync(s);
        if (stat.isDirectory()) {
            copyRecursive(s, d, ignore, path.join(relative, entry), outList);
        } else {
            fs.copyFileSync(s, d);
            if (outList) outList.push(path.join(relative, entry).replace(/\\/g, '/'));
        }
    }
}

async function updateViaZip(sock, chatId, message, zipOverride) {
    // Default to your repository's main branch zip; allow override from settings or env
    const defaultZip = `https://github.com/jnrnkanu-md/JNR-MD/archive/refs/heads/main.zip`;
    const zipUrl = (zipOverride || settings.updateZipUrl || process.env.UPDATE_ZIP_URL || defaultZip).trim();

    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const zipPath = path.join(tmpDir, 'update.zip');
    await downloadFile(zipUrl, zipPath);
    const extractTo = path.join(tmpDir, 'update_extract');
    if (fs.existsSync(extractTo)) fs.rmSync(extractTo, { recursive: true, force: true });
    await extractZip(zipPath, extractTo);

    const [root] = fs.readdirSync(extractTo).map(n => path.join(extractTo, n));
    const srcRoot = fs.existsSync(root) && fs.lstatSync(root).isDirectory() ? root : extractTo;

    const ignore = ['node_modules', '.git', 'session', 'tmp', 'tmp/', 'temp', 'data', 'baileys_store.json'];
    const copied = [];

    let preservedOwner = null;
    let preservedBotOwner = null;
    try {
        const currentSettings = require('../settings');
        preservedOwner = currentSettings && currentSettings.ownerNumber ? String(currentSettings.ownerNumber) : null;
        preservedBotOwner = currentSettings && currentSettings.botOwner ? String(currentSettings.botOwner) : null;
    } catch {}

    copyRecursive(srcRoot, process.cwd(), ignore, '', copied);

    if (preservedOwner) {
        try {
            const settingsPath = path.join(process.cwd(), 'settings.js');
            if (fs.existsSync(settingsPath)) {
                let text = fs.readFileSync(settingsPath, 'utf8');
                text = text.replace(/ownerNumber:\s*'[^']*'/, `ownerNumber: '${preservedOwner}'`);
                if (preservedBotOwner) {
                    text = text.replace(/botOwner:\s*'[^']*'/, `botOwner: '${preservedBotOwner}'`);
                }
                fs.writeFileSync(settingsPath, text);
            }
        } catch {}
    }
    try { fs.rmSync(extractTo, { recursive: true, force: true }); } catch {}
    try { fs.rmSync(zipPath, { force: true }); } catch {}
    return { copiedFiles: copied };
}

async function restartProcess(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { text: '✅ Update complete! Rebooting process container…' }, { quoted: message });
    } catch {}

    setTimeout(() => {
        // Pterodactyl panels intercept exit code 1 as a crash event and trigger their auto-restart policy logic automatically.
        process.exit(1);
    }, 1000);
}

async function updateCommand(sock, chatId, message, zipOverride) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

    if (!message.key.fromMe && !isOwner) {
        await sock.sendMessage(chatId, { text: 'Only bot owner or sudo can use .update' }, { quoted: message });
        return;
    }
    try {
        await sock.sendMessage(chatId, { text: '🔄 Updating JNR NKANU CONCEPTS™, please wait…' }, { quoted: message });
        if (await hasGitRepo()) {
            const { oldRev, newRev, alreadyUpToDate, commits, files } = await updateViaGit();
            console.log('[update] Git update applied.', { oldRev, newRev, alreadyUpToDate });
            await run('npm install --no-audit --no-fund').catch(() => {});
        } else {
            await updateViaZip(sock, chatId, message, zipOverride);
            await run('npm install --no-audit --no-fund').catch(() => {});
        }
        try {
            await sock.sendMessage(chatId, { text: '✅ Update applied smoothly. Restarting system instantly...' }, { quoted: message });
        } catch {}
        await restartProcess(sock, chatId, message);
    } catch (err) {
        console.error('Update failed:', err);
        await sock.sendMessage(chatId, { text: `❌ Update failed:\n${String(err.message || err)}` }, { quoted: message });
    }
}

module.exports = updateCommand;
