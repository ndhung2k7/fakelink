// DOM Elements
const shortenForm = document.getElementById('shortenForm');
const longUrlInput = document.getElementById('longUrl');
const shortenBtn = document.getElementById('shortenBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const result = document.getElementById('result');
const originalUrl = document.getElementById('originalUrl');
const shortUrl = document.getElementById('shortUrl');
const copyBtn = document.getElementById('copyBtn');
const newLinkBtn = document.getElementById('newLinkBtn');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');

// API endpoint
const API_URL = window.location.origin;

// Kiểm tra URL hợp lệ (client-side validation)
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Hiển thị thông báo
function showNotification(message, isError = false) {
    notificationMessage.textContent = message;
    notification.classList.remove('hidden');
    
    if (isError) {
        notification.style.background = 'var(--danger-color)';
    } else {
        notification.style.background = 'var(--text-primary)';
    }
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// Xử lý form submit
shortenForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const longUrl = longUrlInput.value.trim();
    
    // Kiểm tra URL hợp lệ
    if (!isValidUrl(longUrl)) {
        showNotification('URL không hợp lệ! Vui lòng kiểm tra lại.', true);
        return;
    }
    
    // Ẩn kết quả cũ, hiển thị loading
    result.classList.add('hidden');
    error.classList.add('hidden');
    loading.classList.remove('hidden');
    shortenBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/api/shorten`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ longUrl })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Hiển thị kết quả
            originalUrl.textContent = data.longUrl;
            shortUrl.textContent = data.shortUrl;
            shortUrl.href = data.shortUrl;
            
            result.classList.remove('hidden');
            longUrlInput.value = '';
            
            showNotification('Đã tạo link rút gọn thành công!');
        } else {
            showNotification(data.error || 'Có lỗi xảy ra!', true);
        }
    } catch (err) {
        console.error('Error:', err);
        showNotification('Không thể kết nối đến server!', true);
    } finally {
        loading.classList.add('hidden');
        shortenBtn.disabled = false;
    }
});

// Copy link
copyBtn.addEventListener('click', async () => {
    const url = shortUrl.textContent;
    
    try {
        await navigator.clipboard.writeText(url);
        showNotification('Đã copy link vào clipboard!');
        
        // Hiệu ứng cho nút copy
        copyBtn.style.color = 'var(--secondary-color)';
        setTimeout(() => {
            copyBtn.style.color = '';
        }, 500);
    } catch (err) {
        showNotification('Không thể copy link!', true);
    }
});

// Tạo link mới
newLinkBtn.addEventListener('click', () => {
    result.classList.add('hidden');
    longUrlInput.focus();
});

// Kiểm tra lỗi từ URL (khi redirect về)
const urlParams = new URLSearchParams(window.location.search);
const errorParam = urlParams.get('error');

if (errorParam === 'not-found') {
    showNotification('Link không tồn tại!', true);
} else if (errorParam === 'server-error') {
    showNotification('Lỗi server!', true);
}

// Thêm hiệu ứng cho input khi focus
longUrlInput.addEventListener('focus', () => {
    longUrlInput.parentElement.style.transform = 'scale(1.02)';
});

longUrlInput.addEventListener('blur', () => {
    longUrlInput.parentElement.style.transform = 'scale(1)';
});

// Auto resize textarea nếu muốn dùng textarea thay input
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// Thêm hiệu ứng smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Xử lý paste URL
longUrlInput.addEventListener('paste', (e) => {
    // Cho phép paste URL có format
    setTimeout(() => {
        const url = longUrlInput.value;
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            // Tự động thêm https:// nếu thiếu
            longUrlInput.value = 'https://' + url;
        }
    }, 100);
});

// Hiển thị thời gian thực
function updateTime() {
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString('vi-VN');
    }
}

// Khởi tạo
document.addEventListener('DOMContentLoaded', () => {
    // Focus vào input khi load trang
    longUrlInput.focus();
    
    // Cập nhật thời gian mỗi giây
    setInterval(updateTime, 1000);
});

// Xử lý responsive cho menu (nếu có)
const menuToggle = document.getElementById('menuToggle');
if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        document.querySelector('nav').classList.toggle('show');
    });
}
