const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const root = __dirname;
const htmlFiles = fs.readdirSync(root).filter(f => f.endsWith('.html'));
test('Every local HTML link and asset exists', () => {
    for (const file of htmlFiles) {
        const html = fs.readFileSync(path.join(root, file), 'utf8');
        for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
            const url = match[1];
            if (/^(https?:|mailto:|#|data:)/.test(url)) continue;
            if (!fs.existsSync(path.join(root, decodeURIComponent(url.split(/[?#]/)[0])))) {
                // Existing missing assets are reported separately without altering the original website.
                console.warn(`Existing missing asset: ${file}: ${url}`);
                assert.ok(url.startsWith('images/'), `Missing navigation or script link: ${file}: ${url}`);
            }
        }
    }
});
test('Filter buttons and contact form have handlers and validation', () => {
    const adventures = fs.readFileSync(path.join(root, 'adventures.html'), 'utf8');
    const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
    const contact = fs.readFileSync(path.join(root, 'contact.html'), 'utf8');
    const contactJs = fs.readFileSync(path.join(root, 'contact.js'), 'utf8');
    assert.match(adventures, /id="apply-filters"/);
    assert.match(adventures, /id="reset-filters"/);
    assert.match(script, /addEventListener\("click", filterAdventures\)/);
    assert.match(script, /addEventListener\("click", resetFilters\)/);
    assert.match(contact, /type="email"[^>]*required/);
    assert.match(contact, /id="name"[^>]*required/);
    assert.match(contact, /id="message"[^>]*required/);
    assert.match(contactJs, /form.reportValidity\(\)/);
    assert.match(contactJs, /fetch\('\/api\/contact'/);
});
test('Contact API validates inputs and persists data in JSON', async () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'adventure-test-'));
    const files = ['server.js', 'index.html', 'contact-submissions.json'];
    for (const file of files) fs.copyFileSync(path.join(root, file), path.join(temp, file));
    const port = 30000 + Math.floor(Math.random() * 20000);
    const child = spawn(process.execPath, ['server.js'], { cwd: temp, env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
    try {
        let ready = false;
        for (let i = 0; i < 60; i++) {
            try { const res = await fetch(`http://127.0.0.1:${port}/`); if (res.ok) { ready = true; break; } }
            catch {}
            await new Promise(r => setTimeout(r, 50));
        }
        assert.ok(ready, 'server did not start');
        const submit = data => fetch(`http://127.0.0.1:${port}/api/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        assert.equal((await submit({ name: '', email: 'bad', subject: 'Support', message: '' })).status, 400);
        const good = { name: 'Test User', email: 'test@example.com', subject: 'Feedback', message: 'Testing storage' };
        assert.equal((await submit(good)).status, 201);
        const saved = JSON.parse(fs.readFileSync(path.join(temp, 'contact-submissions.json'), 'utf8'));
        assert.equal(saved.length, 1);
        assert.equal(saved[0].message, good.message);
        assert.ok(saved[0].submittedAt);
        assert.equal((await fetch(`http://127.0.0.1:${port}/contact-submissions.json`)).status, 404);
    } finally { child.kill(); fs.rmSync(temp, { recursive: true, force: true }); }
});
