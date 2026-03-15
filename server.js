const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const validUrl = require('valid-url');
const { nanoid } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Đảm bảo thư mục data tồn tại
const dataDir = path.join(__dirname, 'data');
const urlsFile = path.join(dataDir, 'urls.json');

// Khởi tạo file JSON nếu chưa tồn tại
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

// Đọc dữ liệu từ file JSON
async function readUrls() {
    const data = await fs.readFile(urlsFile, 'utf8');
    return JSON.parse(data);
}

// Ghi dữ liệu vào file JSON
async function writeUrls(urls) {
    await fs.writeFile(urlsFile, JSON.stringify(urls, null, 2));
}

// API: Tạo link rút gọn
app.post('/api/shorten', async (req, res) => {
    try {
        const { longUrl } = req.body;
        
        // Kiểm tra URL hợp lệ
        if (!validUrl.isUri(longUrl)) {
            return res.status(400).json({ 
                success: false, 
                error: 'URL không hợp lệ. Vui lòng nhập URL đầy đủ (bao gồm http:// hoặc https://)' 
            });
        }
        
        // Đọc dữ liệu hiện tại
        const urls = await readUrls();
        
        // Kiểm tra xem URL đã tồn tại chưa
        let shortCode = null;
        for (const [code, url] of Object.entries(urls)) {
            if (url === longUrl) {
                shortCode = code;
                break;
            }
        }
        
        // Nếu chưa tồn tại, tạo mã mới
        if (!shortCode) {
            // Tạo mã ngẫu nhiên 6 ký tự
            shortCode = nanoid(6);
            
            // Đảm bảo mã không bị trùng
            while (urls[shortCode]) {
                shortCode = nanoid(6);
            }
            
            // Lưu mapping
            urls[shortCode] = longUrl;
            await writeUrls(urls);
        }
        
        // Trả về link rút gọn
        const shortUrl = `${BASE_URL}/${shortCode}`;
        res.json({ 
            success: true, 
            shortUrl,
            longUrl,
            shortCode
        });
        
    } catch (error) {
        console.error('Lỗi:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Đã xảy ra lỗi server' 
        });
    }
});

// API: Lấy thống kê (tùy chọn)
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
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Đã xảy ra lỗi server' 
        });
    }
});

// Redirect từ link ngắn sang link dài
app.get('/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const urls = await readUrls();
        
        if (urls[code]) {
            // Redirect với status 301 (Moved Permanently)
            res.redirect(301, urls[code]);
        } else {
            // Nếu không tìm thấy, redirect về trang chủ với thông báo lỗi
            res.redirect('/?error=not-found');
        }
    } catch (error) {
        res.redirect('/?error=server-error');
    }
});

// Khởi tạo dữ liệu và chạy server
initializeDataFile().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server đang chạy tại: ${BASE_URL}`);
        console.log(`📝 API endpoint: ${BASE_URL}/api/shorten`);
    });
});
