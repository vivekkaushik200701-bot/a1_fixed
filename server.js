// Run with: node server.js (Node.js 18 or newer; no packages needed)
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { URL } = require('node:url');
const root = __dirname;
const dataFile = path.join(root, 'contact-submissions.json');
const port = Number(process.env.PORT) || 3000;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon' };
let writeQueue = Promise.resolve();
function send(res, status, payload) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(payload));
}
async function saveSubmission(entry) {
    const task = writeQueue.catch(() => {}).then(async () => {
        let entries;
        try { entries = JSON.parse(await fs.readFile(dataFile, 'utf8')); }
        catch (error) { if (error.code !== 'ENOENT') throw error; entries = []; }
        if (!Array.isArray(entries)) throw new Error('Invalid submissions file');
        entries.push(entry);
        await fs.writeFile(dataFile, JSON.stringify(entries, null, 2) + '\n');
    });
    writeQueue = task;
    return task;
}
const server = http.createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname === '/api/contact') {
        if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
        let body = '';
        try {
            for await (const chunk of req) {
                body += chunk.toString();
                if (Buffer.byteLength(body) > 16384) return send(res, 413, { error: 'Message too large' });
            }
            const data = JSON.parse(body);
            const { name, email, subject, message } = data;
            const subjects = ['General Inquiry', 'Support', 'Feedback', 'Adventure Suggestion'];
            if (![name, email, subject, message].every(v => typeof v === 'string') ||
                !name.trim() || name.length > 150 ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
                !subjects.includes(subject) || !message.trim() || message.length > 5000) {
                return send(res, 400, { error: 'Please enter valid contact details.' });
            }
            await saveSubmission({ name: name.trim(), email: email.trim(), subject, message: message.trim(), submittedAt: new Date().toISOString() });
            return send(res, 201, { success: true });
        } catch (error) {
            return send(res, error instanceof SyntaxError ? 400 : 500, { error: error instanceof SyntaxError ? 'Invalid JSON.' : 'Unable to save message.' });
        }
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });
    let relative;
    try { relative = decodeURIComponent(pathname === '/' ? '/index.html' : pathname); }
    catch { return send(res, 400, { error: 'Bad URL' }); }
    const full = path.resolve(root, '.' + relative);
    if ((!full.startsWith(root + path.sep) && full !== root) ||
        path.basename(full).startsWith('.') ||
        ['server.js', 'contact-submissions.json', 'package.json', 'package-lock.json', 'README-NODE.md', 'test.js'].includes(path.basename(full))) {
        return send(res, 404, { error: 'Not found' });
    }
    try {
        const data = await fs.readFile(full);
        res.writeHead(200, { 'Content-Type': types[path.extname(full)] || 'application/octet-stream' });
        res.end(req.method === 'HEAD' ? undefined : data);
    } catch (error) { send(res, error.code === 'ENOENT' || error.code === 'EISDIR' ? 404 : 500, { error: 'File unavailable' }); }
});
if (require.main === module) server.listen(port, () => console.log(`Open http://localhost:${port}`));
module.exports = server;
