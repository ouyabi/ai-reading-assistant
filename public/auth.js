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

// 登录表单处理
function handleLogin(e) {
    e.preventDefault();
    if (!validateForm('loginForm')) return;

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // 这里添加登录逻辑
    console.log('登录数据:', data);
}

// 注册表单处理
function handleRegister(e) {
    e.preventDefault();
    if (!validateForm('registerForm')) return;

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // 这里添加注册逻辑
    console.log('注册数据:', data);
}

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