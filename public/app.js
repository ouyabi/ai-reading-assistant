// DOM Elements
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.querySelector('.sidebar');
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.main-nav a');
const loginBtn = document.querySelector('.login-btn');
const signupBtn = document.querySelector('.signup-btn');
const userMenu = document.querySelector('.user-menu');
const userProfile = document.querySelector('.user-profile');

// 登录状态管理
let isAuthModalShown = false;

// 检查登录状态
function checkAuthStatus() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    return currentUser !== null;
}

// 显示登录模态框
function showLoginModal() {
    // 防止重复显示
    if (isAuthModalShown || checkAuthStatus()) {
        return;
    }
    
    isAuthModalShown = true;

    const modalHtml = `
        <div class="auth-modal">
            <div class="auth-form">
                <div class="avatar-upload">
                    <div class="avatar-preview">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=default" alt="用户头像" id="avatar-preview">
                    </div>
                    <div class="avatar-actions">
                        <label for="avatar-input" class="avatar-upload-btn">
                            <i class="fas fa-camera"></i> 更换头像
                        </label>
                        <input type="file" id="avatar-input" accept="image/*" style="display: none;">
                    </div>
                </div>
                <h2>登录</h2>
                <form id="login-form">
                    <div class="form-group">
                        <label for="login-username">用户名</label>
                        <input type="text" id="login-username" required>
                    </div>
                    <div class="form-group">
                        <label for="login-email">邮箱</label>
                        <input type="email" id="login-email" required>
                    </div>
                    <div class="form-group">
                        <label for="login-password">密码</label>
                        <input type="password" id="login-password" required>
                    </div>
                    <button type="submit">登录</button>
                    <p class="auth-switch">还没有账号？<a href="#" id="switch-to-signup">立即注册</a></p>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = document.querySelector('.auth-modal');
    const switchToSignup = document.getElementById('switch-to-signup');
    
    // 切换到注册界面
    switchToSignup.addEventListener('click', (e) => {
        e.preventDefault();
        modal.remove();
        isAuthModalShown = false;
        showSignupModal();
    });

    // 处理登录表单提交
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    initAvatarUpload();
}

// 显示注册模态框
function showSignupModal() {
    // 防止重复显示
    if (isAuthModalShown || checkAuthStatus()) {
        return;
    }
    
    isAuthModalShown = true;

    const modalHtml = `
        <div class="auth-modal">
            <div class="auth-form">
                <div class="avatar-upload">
                    <div class="avatar-preview">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=default" alt="用户头像" id="signup-avatar-preview">
                    </div>
                    <div class="avatar-actions">
                        <label for="signup-avatar-input" class="avatar-upload-btn">
                            <i class="fas fa-camera"></i> 更换头像
                        </label>
                        <input type="file" id="signup-avatar-input" accept="image/*" style="display: none;">
                    </div>
                </div>
                <h2>注册</h2>
                <form id="signup-form">
                    <div class="form-group">
                        <label for="signup-username">用户名</label>
                        <input type="text" id="signup-username" required>
                    </div>
                    <div class="form-group">
                        <label for="signup-email">邮箱</label>
                        <input type="email" id="signup-email" required>
                    </div>
                    <div class="form-group">
                        <label for="signup-password">密码</label>
                        <input type="password" id="signup-password" required>
                    </div>
                    <div class="form-group">
                        <label for="signup-confirm-password">确认密码</label>
                        <input type="password" id="signup-confirm-password" required>
                    </div>
                    <button type="submit">注册</button>
                    <p class="auth-switch">已有账号？<a href="#" id="switch-to-login">立即登录</a></p>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = document.querySelector('.auth-modal');
    const switchToLogin = document.getElementById('switch-to-login');
    
    // 切换到登录界面
    switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        modal.remove();
        isAuthModalShown = false;
        showLoginModal();
    });

    // 处理注册表单提交
    document.getElementById('signup-form').addEventListener('submit', handleSignup);
    initAvatarUpload();
}

// 处理头像上传
function handleAvatarUpload(input, previewId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        const preview = document.getElementById(previewId);
        
        reader.onload = function(e) {
            preview.src = e.target.result;
            // 保存头像到localStorage
            localStorage.setItem('userAvatar', e.target.result);
            
            // 更新当前用户的头像
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (currentUser) {
                currentUser.avatar = e.target.result;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateUserInterface(currentUser);
            }
        }
        
        reader.readAsDataURL(input.files[0]);
    }
}

// 初始化头像上传功能
function initAvatarUpload() {
    const loginAvatarInput = document.getElementById('avatar-input');
    const signupAvatarInput = document.getElementById('signup-avatar-input');
    
    if (loginAvatarInput) {
        loginAvatarInput.addEventListener('change', function() {
            handleAvatarUpload(this, 'avatar-preview');
        });
    }
    
    if (signupAvatarInput) {
        signupAvatarInput.addEventListener('change', function() {
            handleAvatarUpload(this, 'signup-avatar-preview');
        });
    }
}

// 处理登录
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const avatar = document.getElementById('avatar-preview').src;

    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password && u.username === username);
        
        if (!user) {
            throw new Error('用户名、邮箱或密码错误');
        }

        // 保存登录状态
        const userData = {
            email: user.email,
            username: user.username,
            avatar: avatar || user.avatar,
            readingTime: user.readingTime || 0
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        document.querySelector('.auth-modal')?.remove();
        isAuthModalShown = false;
        updateUserInterface(userData);
    } catch (error) {
        alert(error.message);
    }
}

// 处理注册
async function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const avatar = document.getElementById('signup-avatar-preview').src;

    try {
        // 验证密码
        if (password !== confirmPassword) {
            throw new Error('两次输入的密码不一致');
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // 检查用户名是否已存在
        if (users.some(u => u.username === username)) {
            throw new Error('该用户名已被使用');
        }
        
        // 检查邮箱是否已存在
        if (users.some(u => u.email === email)) {
            throw new Error('该邮箱已被注册');
        }

        // 创建新用户
        const newUser = {
            username,
            email,
            password,
            avatar,
            registerDate: new Date().toISOString(),
            readingTime: 0
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        // 自动登录
        const userData = {
            email: newUser.email,
            username: newUser.username,
            avatar: newUser.avatar,
            readingTime: 0
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        document.querySelector('.auth-modal')?.remove();
        isAuthModalShown = false;
        updateUserInterface(userData);
    } catch (error) {
        alert(error.message);
    }
}

// 更新用户界面
function updateUserInterface(userData) {
    if (!userData) {
        // 未登录状态
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            userMenu.innerHTML = `
                <button class="login-btn"><i class="fas fa-user"></i> 登录</button>
                <button class="signup-btn"><i class="fas fa-user-plus"></i> 注册</button>
            `;
            
            // 重新绑定登录注册按钮事件
            const loginBtn = userMenu.querySelector('.login-btn');
            const signupBtn = userMenu.querySelector('.signup-btn');
            
            loginBtn?.addEventListener('click', showLoginModal);
            signupBtn?.addEventListener('click', showSignupModal);
        }
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
    isAuthModalShown = false;
    updateUserInterface(null);
    showLoginModal();
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
    // 检查登录状态
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        // 只有在未登录状态下才显示登录模态框
        showLoginModal();
    } else {
        // 如果已登录，更新用户界面
        updateUserInterface(currentUser);
    }
    
    initializeUserState();
    initNavigation();
    initMobileMenu();
    initCtaButton();
    initNotes();
    initAvatarUpload(); // 初始化头像上传功能
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