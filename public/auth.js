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

// 表单验证
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;

    const password = form.querySelector('input[type="password"]');
    const confirmPassword = form.querySelector('#confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
        alert('两次输入的密码不一致');
        return false;
    }

    return true;
}

// 用户数据管理
const UserManager = {
    // 获取所有用户
    getUsers() {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : [];
    },

    // 保存用户
    saveUser(userData) {
        const users = this.getUsers();
        // 检查邮箱是否已存在
        if (users.some(user => user.email === userData.email)) {
            throw new Error('该邮箱已被注册');
        }
        // 添加注册时间和默认头像
        userData.registerDate = new Date().toISOString();
        userData.avatar = document.getElementById('avatarPreview')?.src || 
                         `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`;
        userData.readingTime = 0;
        userData.notes = [];
        
        users.push(userData);
        localStorage.setItem('users', JSON.stringify(users));
        return userData;
    },

    // 验证用户
    validateUser(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
            throw new Error('邮箱或密码错误');
        }
        return user;
    },

    // 获取当前登录用户
    getCurrentUser() {
        const userJson = localStorage.getItem('currentUser');
        return userJson ? JSON.parse(userJson) : null;
    },

    // 设置当前登录用户
    setCurrentUser(user) {
        if (user) {
            // 存储用户信息时删除敏感信息
            const { password, ...safeUser } = user;
            localStorage.setItem('currentUser', JSON.stringify(safeUser));
        } else {
            localStorage.removeItem('currentUser');
        }
    },

    // 更新用户信息
    updateUser(email, updates) {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.email === email);
        if (userIndex >= 0) {
            users[userIndex] = { ...users[userIndex], ...updates };
            localStorage.setItem('users', JSON.stringify(users));
            
            // 如果更新的是当前用户，同时更新currentUser
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.email === email) {
                this.setCurrentUser(users[userIndex]);
            }
        }
    }
};

// 模拟API调用
async function mockApiCall(endpoint, data) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
        switch (endpoint) {
            case 'login':
                const user = UserManager.validateUser(data.email, data.password);
                return {
                    success: true,
                    message: '登录成功',
                    user: user
                };
            case 'register':
                const newUser = UserManager.saveUser(data);
                return {
                    success: true,
                    message: '注册成功',
                    user: newUser
                };
            default:
                throw new Error('未知的操作');
        }
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

// 处理登录
async function handleLogin(formData) {
    try {
        const response = await mockApiCall('login', formData);
        if (response.success) {
            UserManager.setCurrentUser(response.user);
            alert(response.message);
            window.location.href = './index.html';
        } else {
            alert(response.message);
        }
    } catch (error) {
        alert('登录失败，请重试');
    }
}

// 处理注册
async function handleRegister(formData) {
    try {
        const response = await mockApiCall('register', formData);
        if (response.success) {
            alert(response.message);
            window.location.href = './login.html';
        } else {
            alert(response.message);
        }
    } catch (error) {
        alert('注册失败，请重试');
    }
}

// 事件监听器设置
document.addEventListener('DOMContentLoaded', () => {
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

    // 随机头像按钮
    const randomAvatarBtn = document.getElementById('randomAvatar');
    if (randomAvatarBtn) {
        randomAvatarBtn.addEventListener('click', generateRandomAvatar);
    }

    // 头像上传
    const uploadAvatarBtn = document.getElementById('uploadAvatar');
    if (uploadAvatarBtn) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        uploadAvatarBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleAvatarUpload);
    }

    // 表单提交
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (validateForm('loginForm')) {
                const formData = new FormData(loginForm);
                const data = Object.fromEntries(formData.entries());
                await handleLogin(data);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (validateForm('registerForm')) {
                const formData = new FormData(registerForm);
                const data = Object.fromEntries(formData.entries());
                await handleRegister(data);
            }
        });
    }

    // 处理所有返回首页的链接
    const homeLinks = document.querySelectorAll('a[href="/"]');
    homeLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/index.html';
        });
    });
}); 