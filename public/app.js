// DOM Elements
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.querySelector('.sidebar');
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.main-nav a');
const userMenu = document.querySelector('.user-menu');
const userProfile = document.querySelector('.user-profile');

// 更新用户界面
function updateUserInterface(userData) {
    if (!userData) {
        // 未登录状态，跳转到登录页面
        window.location.href = '/login.html';
        return;
    }

    // 更新头像
    const avatars = document.querySelectorAll('.avatar');
    avatars.forEach(avatar => {
        if (userData.avatar) {
            avatar.src = userData.avatar;
        }
    });
    
    // 更新用户名
    const usernames = document.querySelectorAll('.username');
    usernames.forEach(username => {
        username.textContent = userData.username || '未登录';
    });
    
    // 更新用户状态
    const userStatus = document.querySelector('.user-status');
    if (userStatus) {
        userStatus.textContent = '在线';
        userStatus.classList.add('online');
    }
    
    // 更新阅读进度
    const progress = document.querySelector('.progress');
    if (progress && userData.readingTime) {
        const percentage = Math.min((userData.readingTime / 120) * 100, 100);
        progress.style.width = `${percentage}%`;
    }
    
    // 更新阅读时间显示
    const readingTime = document.querySelector('.reading-progress p');
    if (readingTime && userData.readingTime) {
        readingTime.textContent = `已阅读 ${userData.readingTime} 分钟`;
    }
    
    // 更新用户菜单
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        userMenu.innerHTML = `
            <span class="user-welcome">欢迎，${userData.username}</span>
            <button class="logout-btn"><i class="fas fa-sign-out-alt"></i> 退出</button>
        `;
        
        // 添加退出按钮事件监听
        const logoutBtn = userMenu.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    }
}

// 处理退出登录
function handleLogout() {
    localStorage.removeItem('currentUser');
    window.location.href = '/login.html';
}

// 初始化用户状态
function initializeUserState() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        updateUserInterface(currentUser);
        startReadingTimeTracking(currentUser);
    }
}

// 追踪阅读时间
function startReadingTimeTracking(user) {
    setInterval(() => {
        user.readingTime++;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // 每5分钟保存一次到用户数据
        if (user.readingTime % 5 === 0) {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.email === user.email);
            if (userIndex >= 0) {
                users[userIndex].readingTime = user.readingTime;
                localStorage.setItem('users', JSON.stringify(users));
            }
        }

        // 更新进度条显示
        updateUserInterface(user);
    }, 60000); // 每分钟更新一次
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查登录状态
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        // 如果未登录，跳转到登录页面
        window.location.href = '/login.html';
        return;
    }
    
    // 如果已登录，更新用户界面并初始化功能
    updateUserInterface(currentUser);
    initializeUserState();
    initNavigation();
    initMobileMenu();
    initCtaButton();
    initNotes();
});

// Mobile Menu Toggle
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    menuToggle.classList.toggle('active');
});

// Close sidebar when clicking outside
document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
        sidebar.classList.remove('active');
        menuToggle.classList.remove('active');
    }
});

// Navigation
function setActiveSection(hash) {
    const targetId = hash.slice(1) || 'home';
    sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === targetId) {
            section.classList.add('active');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === hash) {
            link.classList.add('active');
        }
    });
}

// Handle navigation
window.addEventListener('hashchange', () => {
    setActiveSection(window.location.hash);
});

// Set initial active section
setActiveSection(window.location.hash);

// Search functionality
const searchInput = document.querySelector('.search-box input');
const noteCards = document.querySelectorAll('.note-card');

searchInput?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    noteCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const content = card.querySelector('.note-preview').textContent.toLowerCase();
        const isVisible = title.includes(searchTerm) || content.includes(searchTerm);
        card.style.display = isVisible ? 'block' : 'none';
    });
});

// AI助手功能
const chatMessages = document.querySelector('.chat-messages');
const chatInput = document.querySelector('.chat-input textarea');
const sendButton = document.querySelector('.send-btn');
const uploadButton = document.querySelector('.upload-btn');

// 添加消息到聊天界面
function addMessage(content, isAI = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isAI ? 'ai' : 'user'}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    if (content.includes('<ul>')) {
        messageContent.innerHTML = content;
    } else {
        messageContent.innerHTML = content.replace(/\n/g, '<br>');
    }
    
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 显示加载状态
function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai loading';
    loadingDiv.innerHTML = `
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return loadingDiv;
}

// 发送消息到服务器
async function sendMessage(message, isFile = false) {
    try {
        const loadingDiv = showLoading();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (!currentUser) {
            alert('请先登录');
            window.location.href = '/login.html';
            return;
        }

        const endpoint = isFile ? '/api/analyze' : '/api/chat';
        const response = await fetch(`http://localhost:8080${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                userId: currentUser.email,
                text: isFile ? message : undefined
            })
        });

        const data = await response.json();
        loadingDiv.remove();

        if (data.success) {
            addMessage(data.message || data.analysis, true);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('发送消息失败:', error);
        alert('发送消息失败，请重试');
    }
}

// 发送按钮点击事件
sendButton?.addEventListener('click', () => {
    const message = chatInput.value.trim();
    if (message) {
        addMessage(message);
        sendMessage(message);
        chatInput.value = '';
    }
});

// 文本框回车发送
chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendButton.click();
    }
});

// 文件上传处理
uploadButton?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.doc,.docx,.pdf';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const text = await file.text();
                addMessage(`正在分析文件：${file.name}`);
                sendMessage(text, true);
            } catch (error) {
                console.error('读取文件失败:', error);
                alert('读取文件失败，请重试');
            }
        }
    };
    
    input.click();
});

// 页面导航功能
function initNavigation() {
    const navLinks = document.querySelectorAll('.main-nav a');
    const sections = document.querySelectorAll('.section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').slice(1);
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });
        });
    });
}

// 移动端菜单功能
function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainNav = document.querySelector('.main-nav');

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        mainNav.classList.toggle('active');
    });
}

// 处理开始阅读按钮
function initCtaButton() {
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', () => {
            document.querySelector('a[href="#ai-assistant"]').click();
        });
    }
}

// 处理笔记功能
function initNotes() {
    const newNoteBtn = document.querySelector('.new-note-btn');
    const searchInput = document.querySelector('.search-box input');
    const filterSelects = document.querySelectorAll('.filter-select');

    if (newNoteBtn) {
        newNoteBtn.addEventListener('click', () => {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser) {
                alert('请先登录后再创建笔记');
                window.location.href = '/login.html';
                return;
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            console.log('搜索:', e.target.value);
        });
    }

    filterSelects.forEach(select => {
        select.addEventListener('change', (e) => {
            console.log('过滤:', e.target.value);
        });
    });
} 