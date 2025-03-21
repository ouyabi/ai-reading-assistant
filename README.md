# AI 伴读助手

一个基于 AI 的阅读助手应用，帮助用户更好地理解和分析文章内容。

## 功能特点

- AI 智能对话
- 文本分析
- 阅读进度追踪
- 笔记管理

## 技术栈

- Node.js
- Express
- Deepseek API
- HTML/CSS/JavaScript

## 环境变量

项目需要以下环境变量：

- `DEEPSEEK_API_KEY`: Deepseek API 密钥
- `PORT`: 服务器端口号（可选）

## 本地开发

1. 安装依赖：
```bash
npm install
```

2. 创建 `.env` 文件并设置环境变量

3. 启动开发服务器：
```bash
npm run dev
```

## 部署

项目使用 Vercel 部署，自动部署配置已包含在 `vercel.json` 中。 