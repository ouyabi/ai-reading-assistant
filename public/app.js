// DOM Elements
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.querySelector('.sidebar');
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.main-nav a');
const loginBtn = document.querySelector('.login-btn');
const signupBtn = document.querySelector('.signup-btn');
const userMenu = document.querySelector('.user-menu');
const userProfile = document.querySelector('.user-profile');

// 更新用户界面
function updateUserInterface(user) {
    if (user) {
        // 更新用户菜单
        userMenu.innerHTML = `
            <div class="user-dropdown">
                <button class="user-btn">
                    <img src="${user.avatar}" alt="${user.username}" class="user-avatar">
                    <span>${user.username}</span>
                </button>
                <div class="dropdown-content">
                    <a href="#profile"><i class="fas fa-user"></i> 个人资料</a>
                    <a href="#settings"><i class="fas fa-cog"></i> 设置</a>
                    <button id="logoutBtn"><i class="fas fa-sign-out-alt"></i> 退出登录</button>
                </div>
            </div>
        `;

        // 更新侧边栏用户信息
        if (userProfile) {
            const userInfo = userProfile.querySelector('.user-info');
            const readingProgress = userProfile.querySelector('.reading-progress');
            
            userInfo.innerHTML = `
                <img src="${user.avatar}" alt="${user.username}" class="avatar">
                <h3 class="username">${user.username}</h3>
                <p class="user-status">在线</p>
            `;

            if (readingProgress) {
                const progressBar = readingProgress.querySelector('.progress');
                const timeDisplay = readingProgress.querySelector('p');
                if (progressBar && timeDisplay) {
                    progressBar.style.width = `${Math.min((user.readingTime / 100) * 100, 100)}%`;
                    timeDisplay.textContent = `已阅读 ${user.readingTime} 分钟`;
                }
            }
        }

        // 添加退出登录事件监听
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    } else {
        // 未登录状态
        userMenu.innerHTML = `
            <button class="login-btn"><i class="fas fa-user"></i> 登录</button>
            <button class="signup-btn"><i class="fas fa-user-plus"></i> 注册</button>
        `;

        // 重新绑定登录注册按钮事件
        const newLoginBtn = userMenu.querySelector('.login-btn');
        const newSignupBtn = userMenu.querySelector('.signup-btn');
        
        newLoginBtn?.addEventListener('click', () => {
            window.location.href = './login.html';
        });

        newSignupBtn?.addEventListener('click', () => {
            window.location.href = './register.html';
        });
    }
}

// 处理退出登录
function handleLogout() {
    localStorage.removeItem('currentUser');
    updateUserInterface(null);
    window.location.reload();
}

// 初始化用户状态
function initializeUserState() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    updateUserInterface(currentUser);

    // 如果已登录，开始追踪阅读时间
    if (currentUser) {
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
    initializeUserState();
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
    
    // 如果内容包含列表，保持HTML格式
    if (content.includes('<ul>')) {
        messageContent.innerHTML = content;
    } else {
        // 将普通文本中的换行转换为<br>标签
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
            window.location.href = './login.html';
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

// Reading progress
const progressBar = document.querySelector('.progress');
let readingTime = 0;

// 模拟阅读时间更新
if (progressBar) {
    setInterval(() => {
        readingTime++;
        const progress = Math.min((readingTime / 100) * 100, 100);
        progressBar.style.width = `${progress}%`;
        
        const timeDisplay = document.querySelector('.reading-progress p');
        if (timeDisplay) {
            timeDisplay.textContent = `已阅读 ${readingTime} 分钟`;
        }
    }, 60000); // 每分钟更新一次
}

// 添加笔记功能
const newNoteBtn = document.querySelector('.new-note-btn');
const notesGrid = document.querySelector('.notes-grid');

newNoteBtn?.addEventListener('click', () => {
    const noteTemplate = `
        <article class="note-card">
            <div class="note-header">
                <h3>新笔记</h3>
                <span class="date">${new Date().toLocaleDateString()}</span>
            </div>
            <p class="note-preview">开始写下你的想法...</p>
            <div class="note-footer">
                <div class="tags">
                    <span class="tag">未分类</span>
                </div>
                <button class="more-btn"><i class="fas fa-ellipsis-h"></i></button>
            </div>
        </article>
    `;
    
    notesGrid.insertAdjacentHTML('afterbegin', noteTemplate);
});

// 动画效果
document.querySelectorAll('.card, .note-card, .feature-item').forEach(element => {
    element.addEventListener('mouseover', () => {
        element.style.transform = 'translateY(-5px)';
    });
    
    element.addEventListener('mouseout', () => {
        element.style.transform = 'translateY(0)';
    });
});

// 主题切换功能（待实现）
const themes = {
    light: {
        '--background-color': '#ffffff',
        '--text-color': '#333333',
        '--sidebar-color': '#f5f5f5',
        '--card-bg': '#ffffff',
        '--border-color': '#e0e0e0'
    },
    dark: {
        '--background-color': '#342f2f',
        '--text-color': '#ffffff',
        '--sidebar-color': '#1f1f1f',
        '--card-bg': 'rgba(255,255,255,0.1)',
        '--border-color': 'rgba(255,255,255,0.2)'
    }
};

// 后续可以添加主题切换功能

// 页面导航功能
function initNavigation() {
    const navLinks = document.querySelectorAll('.main-nav a');
    const sections = document.querySelectorAll('.section');

    // 处理导航点击
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').slice(1);
            
            // 更新活动导航项
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // 显示目标部分
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
            // 跳转到AI助手部分
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
            // 检查用户是否登录
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser) {
                alert('请先登录后再创建笔记');
                document.querySelector('.login-btn').click();
                return;
            }
            // TODO: 实现新建笔记功能
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            // TODO: 实现笔记搜索功能
            console.log('搜索:', e.target.value);
        });
    }

    filterSelects.forEach(select => {
        select.addEventListener('change', (e) => {
            // TODO: 实现笔记过滤功能
            console.log('过滤:', e.target.value);
        });
    });
}

// 更新用户界面
function updateUserInterface() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        // 更新用户信息显示
        const usernameElements = document.querySelectorAll('.username');
        usernameElements.forEach(element => {
            element.textContent = currentUser.username;
        });

        // 更新头像
        const avatarElement = document.querySelector('.avatar');
        if (avatarElement) {
            avatarElement.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`;
        }

        // 更新用户状态
        const userStatus = document.querySelector('.user-status');
        if (userStatus) {
            userStatus.textContent = '已登录';
            userStatus.classList.add('online');
        }
    }
}

// 监听存储变化
window.addEventListener('storage', (e) => {
    if (e.key === 'currentUser') {
        updateUserInterface();
    }
});

// 页面加载完成后初始化所有功能
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initMobileMenu();
    initCtaButton();
    initNotes();
    updateUserInterface();
}); 