const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const validUrl = require('valid-url');
const { nanoid } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 3000;

// Domain khi deploy
const BASE_URL = process.env.BASE_URL || "https://fakelink-w6ih.onrender.com";

app.set('trust proxy', true);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Đường dẫn data
const dataDir = path.join(__dirname, 'data');
const urlsFile = path.join(dataDir, 'urls.json');

// Tạo thư mục và file nếu chưa có
async function initializeDataFile() {
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir);
    }

    try {
        await fs.access(urlsFile);
    } catch {
        await fs.writeFile(urlsFile, JSON.stringify({}));
    }
}

// Đọc dữ liệu
async function readUrls() {
    const data = await fs.readFile(urlsFile, 'utf8');
    return JSON.parse(data);
}

// Ghi dữ liệu
async function writeUrls(urls) {
    await fs.writeFile(urlsFile, JSON.stringify(urls, null, 2));
}

// API tạo link rút gọn
app.post('/api/shorten', async (req, res) => {
    try {
        const { longUrl } = req.body;

        if (!validUrl.isUri(longUrl)) {
            return res.status(400).json({
                success: false,
                error: 'URL không hợp lệ. Vui lòng nhập đầy đủ http:// hoặc https://'
            });
        }

        const urls = await readUrls();

        let shortCode = null;

        for (const [code, url] of Object.entries(urls)) {
            if (url === longUrl) {
                shortCode = code;
                break;
            }
        }

        if (!shortCode) {

            shortCode = nanoid(6);

            while (urls[shortCode]) {
                shortCode = nanoid(6);
            }

            urls[shortCode] = longUrl;
            await writeUrls(urls);
        }

        const shortUrl = `${BASE_URL}/${shortCode}`;

        res.json({
            success: true,
            shortUrl,
            longUrl,
            shortCode
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// API stats
app.get('/api/stats/:code', async (req, res) => {
    try {

        const { code } = req.params;
        const urls = await readUrls();

        if (urls[code]) {
            res.json({
                success: true,
                shortCode: code,
                longUrl: urls[code]
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Không tìm thấy link'
            });
        }

    } catch {
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// Redirect link
app.get('/:code', async (req, res) => {

    try {

        const { code } = req.params;
        const urls = await readUrls();

        if (urls[code]) {
            res.redirect(301, urls[code]);
        } else {
            res.redirect('/?error=not-found');
        }

    } catch {
        res.redirect('/?error=server-error');
    }

});

// Chạy server
initializeDataFile().then(() => {

    app.listen(PORT, () => {

        console.log(`🚀 Server running: ${BASE_URL}`);
        console.log(`API: ${BASE_URL}/api/shorten`);

    });

});
