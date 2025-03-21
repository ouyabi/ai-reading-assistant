const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');

// 加载环境变量
dotenv.config();

const app = express();

// 安全中间件
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// 速率限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100 // 限制每个IP 100个请求
});
app.use('/api', limiter);

// CORS 配置
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 根路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 登录页面路由
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 注册页面路由
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// 存储用户会话
const userSessions = new Map();

// AI聊天接口
app.post('/api/chat', async (req, res) => {
    try {
        console.log('收到聊天请求:', req.body);
        const { message, userId } = req.body;
        
        // 获取用户会话历史
        if (!userSessions.has(userId)) {
            console.log('创建新用户会话:', userId);
            userSessions.set(userId, []);
        }
        const sessionHistory = userSessions.get(userId);

        // 添加系统角色设定
        if (sessionHistory.length === 0) {
            console.log('添加系统角色设定');
            sessionHistory.push({
                role: "system",
                content: "你是一个专业的阅读助手，擅长帮助用户理解文章内容、分析文章结构、提取重点，并能够回答阅读相关的问题。你的回答应该专业、有见地，同时也要通俗易懂。"
            });
        }

        // 添加用户消息
        console.log('添加用户消息:', message);
        sessionHistory.push({
            role: "user",
            content: message
        });

        console.log('调用 Deepseek API...');
        
        // 直接使用 axios 调用 API
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: "deepseek-chat",
            messages: sessionHistory,
            temperature: 0.7,
            max_tokens: 2000,
            stream: false
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const aiResponse = response.data.choices[0].message.content;
        console.log('收到 AI 响应:', aiResponse);

        // 添加AI响应到会话历史
        sessionHistory.push({
            role: "assistant",
            content: aiResponse
        });

        // 限制会话历史长度
        if (sessionHistory.length > 10) {
            sessionHistory.splice(1, 2); // 保留系统角色设定，删除最早的一组对话
        }

        // 返回响应
        res.json({
            success: true,
            message: aiResponse
        });

    } catch (error) {
        console.error('API调用错误:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });

        let errorMessage = '服务器错误，请稍后重试';
        
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    errorMessage = 'API密钥无效';
                    break;
                case 402:
                    errorMessage = 'API配额不足';
                    break;
                case 429:
                    errorMessage = '请求过于频繁，请稍后重试';
                    break;
                default:
                    errorMessage = `服务器错误: ${error.response.status}`;
            }
        }

        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
});

// 文本分析接口
app.post('/api/analyze', async (req, res) => {
    try {
        const { text } = req.body;

        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: "你是一个专业的文本分析助手，请对提供的文本进行分析，包括主要内容、关键点、写作特点等方面。"
                },
                {
                    role: "user",
                    content: `请分析以下文本：\n${text}`
                }
            ],
            temperature: 0.7,
            max_tokens: 2000,
            stream: false
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({
            success: true,
            analysis: response.data.choices[0].message.content
        });

    } catch (error) {
        console.error('文本分析错误:', error);
        res.status(500).json({
            success: false,
            message: '分析失败，请稍后重试'
        });
    }
});

// 用户数据存储（实际应用中应该使用数据库）
let users = [];

// JWT密钥
const JWT_SECRET = 'your-secret-key';

// 中间件：验证JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: '未提供认证token' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'token无效' });
        }
        req.user = user;
        next();
    });
};

// API路由
// 注册
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 验证输入
        if (!username || !email || !password) {
            return res.status(400).json({ error: '所有字段都是必填的' });
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: '邮箱格式无效' });
        }

        // 验证密码强度
        if (password.length < 6) {
            return res.status(400).json({ error: '密码长度至少为6位' });
        }

        // 检查用户是否已存在
        if (users.some(user => user.email === email)) {
            return res.status(400).json({ error: '该邮箱已被注册' });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建新用户
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password: hashedPassword,
            avatar: null,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);

        // 生成JWT token
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: '注册成功',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                avatar: newUser.avatar
            }
        });
    } catch (error) {
        res.status(500).json({ error: '服务器错误' });
    }
});

// 登录
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 验证输入
        if (!email || !password) {
            return res.status(400).json({ error: '邮箱和密码都是必填的' });
        }

        // 查找用户
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: '用户不存在' });
        }

        // 验证密码
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: '密码错误' });
        }

        // 生成JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: '登录成功',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar
            }
        });
    } catch (error) {
        res.status(500).json({ error: '服务器错误' });
    }
});

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'public/uploads/avatars';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件'));
        }
    }
});

// 上传头像
app.post('/api/upload-avatar', authenticateToken, upload.single('avatar'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        const user = users.find(u => u.id === req.user.id);
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 删除旧头像
        if (user.avatar) {
            const oldAvatarPath = path.join(__dirname, user.avatar);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        // 更新用户头像
        user.avatar = `/uploads/avatars/${req.file.filename}`;

        res.json({
            message: '头像上传成功',
            avatar: user.avatar
        });
    } catch (error) {
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取用户信息
app.get('/api/user', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt
    });
});

// 更新用户信息
app.put('/api/user', authenticateToken, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = users.find(u => u.id === req.user.id);

        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 更新用户名
        if (username) {
            user.username = username;
        }

        // 更新邮箱
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: '邮箱格式无效' });
            }
            if (users.some(u => u.email === email && u.id !== user.id)) {
                return res.status(400).json({ error: '该邮箱已被使用' });
            }
            user.email = email;
        }

        // 更新密码
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ error: '密码长度至少为6位' });
            }
            user.password = await bcrypt.hash(password, 10);
        }

        res.json({
            message: '用户信息更新成功',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar
            }
        });
    } catch (error) {
        res.status(500).json({ error: '服务器错误' });
    }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
}); 