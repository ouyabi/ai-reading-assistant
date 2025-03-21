const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

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

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
}); 