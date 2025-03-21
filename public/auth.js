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

// 头像上传处理
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatarPreview = document.getElementById('avatarPreview');
            if (avatarPreview) {
                avatarPreview.src = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    }
}

// 头像相关功能
function initializeAvatarFunctions() {
    const uploadAvatarBtn = document.getElementById('uploadAvatar');
    const randomAvatarBtn = document.getElementById('randomAvatar');
    const avatarPreview = document.getElementById('avatarPreview');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    // 上传头像
    uploadAvatarBtn?.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarPreview.src = e.target.result;
                // 这里可以添加将头像数据保存到服务器的代码
            };
            reader.readAsDataURL(file);
        }
    });

    // 随机头像
    randomAvatarBtn?.addEventListener('click', () => {
        const seed = Math.random().toString(36).substring(7);
        avatarPreview.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    });
}

// 表单验证
function validateForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input');
    let isValid = true;

    inputs.forEach(input => {
        const group = input.parentElement;
        group.classList.remove('error');

        if (input.required && !input.value) {
            group.classList.add('error');
            isValid = false;
        }

        if (input.type === 'email' && input.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value)) {
                group.classList.add('error');
                isValid = false;
            }
        }

        if (input.type === 'password' && input.value) {
            if (input.value.length < 6) {
                group.classList.add('error');
                isValid = false;
            }
        }

        if (input.id === 'confirmPassword') {
            const password = document.getElementById('password');
            if (password && input.value !== password.value) {
                group.classList.add('error');
                isValid = false;
            }
        }
    });

    return isValid;
}

// 用户认证状态管理
let currentUser = null;

// 用户数据模拟存储
const users = new Map();

// 初始化认证系统
function initAuth() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        updateUIForAuthenticatedUser();
    }

    // 添加登录按钮事件监听
    document.querySelector('.login-btn').addEventListener('click', showLoginModal);
    document.querySelector('.signup-btn').addEventListener('click', showSignupModal);
}

// 显示登录模态框
function showLoginModal() {
    const modalHtml = `
        <div class="auth-modal">
            <div class="auth-form">
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
}

// 显示注册模态框
function showSignupModal() {
    const modalHtml = `
        <div class="auth-modal">
            <div class="auth-form">
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
}

// 处理登录表单提交
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const user = users.get(email);
        if (!user || user.password !== password) {
            throw new Error('邮箱或密码错误');
        }

        currentUser = {
            email: user.email,
            username: user.username
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUIForAuthenticatedUser();
        document.querySelector('.auth-modal').remove();
    } catch (error) {
        alert(error.message);
    }
}

// 处理注册表单提交
async function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        if (users.has(email)) {
            throw new Error('该邮箱已被注册');
        }

        users.set(email, {
            username,
            email,
            password
        });

        currentUser = {
            email,
            username
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUIForAuthenticatedUser();
        document.querySelector('.auth-modal').remove();
    } catch (error) {
        alert(error.message);
    }
}

// 更新UI显示已登录用户信息
function updateUIForAuthenticatedUser() {
    const userMenu = document.querySelector('.user-menu');
    userMenu.innerHTML = `
        <span class="user-welcome">欢迎，${currentUser.username}</span>
        <button class="logout-btn" onclick="handleLogout()">
            <i class="fas fa-sign-out-alt"></i> 退出
        </button>
    `;

    // 更新侧边栏用户信息
    const userInfo = document.querySelector('.user-info');
    if (userInfo) {
        userInfo.querySelector('.username').textContent = currentUser.username;
    }
}

// 处理退出登录
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    location.reload();
}

// 页面加载完成后初始化认证系统
document.addEventListener('DOMContentLoaded', initAuth);

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeAvatarFunctions();

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    loginForm?.addEventListener('submit', handleLogin);
    registerForm?.addEventListener('submit', handleRegister);

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
    const currentUser = UserManager.getCurrentUser();
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
}); 