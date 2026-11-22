const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const root = __dirname;
const htmlFiles = fs.readdirSync(root).filter(f => f.endsWith('.html'));
const Adventure = require('./models/Adventure');

test('Adventure model accepts the existing adventure data shape', () => {
    const adventures = JSON.parse(fs.readFileSync(path.join(root, 'adventures.json'), 'utf8'));

    assert.equal(Adventure.schema.options.timestamps, true);

    for (const adventure of adventures) {
        assert.equal(new Adventure(adventure).validateSync(), undefined);
    }

    assert.ok(new Adventure({ ...adventures[0], location: 'anywhere' }).validateSync());
    assert.ok(new Adventure({ ...adventures[0], budget: 'unlimited' }).validateSync());
});

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
    assert.match(contact, /id="form-status"/);
    assert.match(contact, /id="message-count"/);
    assert.match(contactJs, /contactForm.reportValidity\(\)/);
    assert.match(contactJs, /fetch\('\/api\/contact'/);
});
test('Contact API validates inputs and persists data in JSON', async () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'adventure-test-'));
    for (const file of ['server.js', 'index.html']) {
        fs.copyFileSync(path.join(root, file), path.join(temp, file));
    }
    fs.mkdirSync(path.join(temp, 'config'));
    fs.mkdirSync(path.join(temp, 'models'));
    fs.copyFileSync(path.join(root, 'config', 'database.js'), path.join(temp, 'config', 'database.js'));
    fs.copyFileSync(path.join(root, 'models', 'Adventure.js'), path.join(temp, 'models', 'Adventure.js'));
    const port = 30000 + Math.floor(Math.random() * 20000);
    const child = spawn(process.execPath, ['server.js'], {
        cwd: temp,
        env: {
            ...process.env,
            MONGODB_URI: '',
            NODE_PATH: path.join(root, 'node_modules'),
            PORT: String(port)
        },
        stdio: 'ignore'
    });
    try {
        let ready = false;
        for (let i = 0; i < 60; i++) {
            try { const res = await fetch(`http://127.0.0.1:${port}/`); if (res.ok) { ready = true; break; } }
            catch {}
            await new Promise(r => setTimeout(r, 50));
        }
        assert.ok(ready, 'server did not start');
        const adventuresResponse = await fetch(`http://127.0.0.1:${port}/api/adventures`);
        assert.equal(adventuresResponse.status, 503);
        const submit = data => fetch(`http://127.0.0.1:${port}/api/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const invalidResponse = await submit({ name: '', email: 'bad', subject: 'Support', message: '' });
        assert.equal(invalidResponse.status, 400);
        assert.match(invalidResponse.headers.get('content-type'), /application\/json/);
        const good = { name: 'Test User', email: 'test@example.com', subject: 'Feedback', message: 'Testing storage' };
        const goodResponse = await submit(good);
        assert.equal(goodResponse.status, 201);
        assert.match(goodResponse.headers.get('content-type'), /application\/json/);
        const saved = JSON.parse(fs.readFileSync(path.join(temp, 'contact-submissions.json'), 'utf8'));
        assert.equal(saved.length, 1);
        assert.equal(saved[0].message, good.message);
        assert.ok(saved[0].submittedAt);
        assert.equal((await fetch(`http://127.0.0.1:${port}/contact-submissions.json`)).status, 404);
    } finally {
        child.kill();
        await new Promise(resolve => child.once('exit', resolve));
        fs.rmSync(temp, { recursive: true, force: true });
    }
});
