// 密码强度检查
function checkPasswordStrength(password) {
    let strength = 0;
    const indicators = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        numbers: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    strength = Object.values(indicators).filter(Boolean).length;

    const strengthBar = document.querySelector('.password-strength');
    if (!strengthBar) return;

    strengthBar.className = 'password-strength';
    if (strength <= 2) {
        strengthBar.classList.add('weak');
    } else if (strength <= 4) {
        strengthBar.classList.add('medium');
    } else {
        strengthBar.classList.add('strong');
    }
}

// 随机头像生成
function generateRandomAvatar() {
    const seed = Math.random().toString(36).substring(7);
    const avatarPreview = document.getElementById('avatarPreview');
    if (avatarPreview) {
        avatarPreview.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    }
}

// 认证工具类
const AuthUtils = {
    // 获取当前用户
    getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },

    // 设置当前用户
    setCurrentUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    },

    // 获取token
    getToken() {
        return localStorage.getItem('token');
    },

    // 设置token
    setToken(token) {
        localStorage.setItem('token', token);
    },

    // 清除认证信息
    clearAuth() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
    },

    // 检查是否已登录
    isAuthenticated() {
        return !!this.getToken();
    }
};

// 处理头像上传
async function handleAvatarUpload(fileInput, previewId) {
    const file = fileInput.files[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch('/api/upload-avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AuthUtils.getToken()}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('上传失败');
        }

        const data = await response.json();
        const preview = document.getElementById(previewId);
        if (preview) {
            preview.src = data.avatar;
        }

        // 更新当前用户信息
        const currentUser = AuthUtils.getCurrentUser();
        if (currentUser) {
            currentUser.avatar = data.avatar;
            AuthUtils.setCurrentUser(currentUser);
        }
    } catch (error) {
        alert('头像上传失败：' + error.message);
    }
}

// 处理登录
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '登录失败');
        }

        // 保存认证信息
        AuthUtils.setToken(data.token);
        AuthUtils.setCurrentUser(data.user);

        // 更新UI
        updateUIForAuthenticatedUser();
        
        // 关闭模态框
        const modal = document.querySelector('.auth-modal');
        if (modal) {
            modal.remove();
        }
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
    const avatar = document.getElementById('signup-avatar-preview')?.src;

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '注册失败');
        }

        // 保存认证信息
        AuthUtils.setToken(data.token);
        AuthUtils.setCurrentUser(data.user);

        // 更新UI
        updateUIForAuthenticatedUser();
        
        // 关闭模态框
        const modal = document.querySelector('.auth-modal');
        if (modal) {
            modal.remove();
        }
    } catch (error) {
        alert(error.message);
    }
}

// 处理退出登录
function handleLogout() {
    AuthUtils.clearAuth();
    location.reload();
}

// 更新UI显示已登录用户信息
function updateUIForAuthenticatedUser() {
    const currentUser = AuthUtils.getCurrentUser();
    if (!currentUser) return;

    // 更新用户菜单
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        userMenu.innerHTML = `
            <span class="user-welcome">欢迎，${currentUser.username}</span>
            <button class="logout-btn" onclick="handleLogout()">
                <i class="fas fa-sign-out-alt"></i> 退出
            </button>
        `;
    }

    // 更新侧边栏用户信息
    const userInfo = document.querySelector('.user-info');
    if (userInfo) {
        const username = userInfo.querySelector('.username');
        const avatar = userInfo.querySelector('.avatar');
        if (username) username.textContent = currentUser.username;
        if (avatar && currentUser.avatar) avatar.src = currentUser.avatar;
    }
}

// 初始化认证系统
function initAuth() {
    // 检查是否已登录
    if (AuthUtils.isAuthenticated()) {
        updateUIForAuthenticatedUser();
    }

    // 添加登录按钮事件监听
    const loginBtn = document.querySelector('.login-btn');
    const signupBtn = document.querySelector('.signup-btn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', showLoginModal);
    }
    
    if (signupBtn) {
        signupBtn.addEventListener('click', showSignupModal);
    }

    // 初始化头像上传功能
    initAvatarUpload();
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

// 显示登录模态框
function showLoginModal() {
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
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('switch-to-signup').addEventListener('click', (e) => {
        e.preventDefault();
        modal.remove();
        showSignupModal();
    });
}

// 显示注册模态框
function showSignupModal() {
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
                    <button type="submit">注册</button>
                    <p class="auth-switch">已有账号？<a href="#" id="switch-to-login">立即登录</a></p>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = document.querySelector('.auth-modal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    document.getElementById('signup-form').addEventListener('submit', handleSignup);
    document.getElementById('switch-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        modal.remove();
        showLoginModal();
    });
}

// 页面加载完成后初始化认证系统
document.addEventListener('DOMContentLoaded', initAuth);

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeAvatarFunctions();

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('signup-form');

    loginForm?.addEventListener('submit', handleLogin);
    registerForm?.addEventListener('submit', handleSignup);

    // 添加输入时的实时验证
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                const group = input.parentElement;
                group.classList.remove('error');
            });
        });
    });

    // 检查用户登录状态
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const isAuthPage = window.location.pathname.includes('login.html') || 
                      window.location.pathname.includes('register.html');

    // 如果已登录且在认证页面，重定向到首页
    if (currentUser && isAuthPage) {
        window.location.href = './index.html';
        return;
    }

    // 如果未登录且不在认证页面，重定向到登录页
    if (!currentUser && !isAuthPage && !window.location.pathname.includes('index.html')) {
        window.location.href = './login.html';
        return;
    }

    // 密码强度检测
    const passwordInput = document.querySelector('input[name="password"]');
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => checkPasswordStrength(e.target.value));
    }

    // 处理所有返回首页的链接
    const homeLinks = document.querySelectorAll('a[href="/"]');
    homeLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/index.html';
        });
    });

    // 社交登录按钮处理
    document.querySelectorAll('.social-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const platform = e.currentTarget.querySelector('i').classList[1].split('-')[1];
            console.log(`点击了${platform}登录`);
            // 这里添加社交登录逻辑
        });
    });

    // 检查是否在登录/注册页面
    const isAuthPage = window.location.pathname.includes('login.html') || 
                      window.location.pathname.includes('register.html');
    
    // 如果已登录且在登录/注册页面，跳转到主页
    if (AuthUtils.isLoggedIn() && isAuthPage) {
        window.location.href = '/index.html';
        return;
    }
    
    // 初始化头像上传
    initAvatarUpload();
}); 