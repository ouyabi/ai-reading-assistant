// Deepseek API配置
const DEEPSEEK_API_ENDPOINT = 'https://api.deepseek.com/v1';
const DEEPSEEK_API_KEY = 'sk-65a646d3cad34d61ba02807e428b8999';

// 调用Deepseek R1模型
async function callDeepseekR1(prompt, options = {}) {
    const defaultOptions = {
        model: 'deepseek-r1',
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0
    };

    const requestOptions = {
        ...defaultOptions,
        ...options,
        messages: [{
            role: 'user',
            content: prompt
        }]
    };

    try {
        const response = await fetch(`${DEEPSEEK_API_ENDPOINT}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify(requestOptions)
        });

        if (!response.ok) {
            throw new Error(`API调用失败: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Deepseek API调用错误:', error);
        throw error;
    }
}

// 更新聊天界面
function updateChatUI(message, isUser = false) {
    const chatMessages = document.querySelector('.chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'ai'}`;
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 处理用户输入
async function handleUserInput(input) {
    try {
        // 显示用户消息
        updateChatUI(input, true);
        
        // 显示加载状态
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message ai loading';
        loadingDiv.textContent = '思考中...';
        document.querySelector('.chat-messages').appendChild(loadingDiv);

        // 调用API
        const response = await callDeepseekR1(input);
        
        // 移除加载状态
        loadingDiv.remove();
        
        // 显示AI响应
        updateChatUI(response);
    } catch (error) {
        alert(`发生错误: ${error.message}`);
    }
}

// 初始化聊天功能
function initChat() {
    const chatForm = document.querySelector('.chat-input');
    const textarea = chatForm.querySelector('textarea');
    const sendButton = chatForm.querySelector('.send-btn');

    // 发送按钮点击事件
    sendButton.addEventListener('click', async () => {
        const input = textarea.value.trim();
        if (!input) return;

        textarea.value = '';
        await handleUserInput(input);
    });

    // 支持Ctrl+Enter发送消息
    textarea.addEventListener('keydown', async (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            const input = textarea.value.trim();
            if (!input) return;

            textarea.value = '';
            await handleUserInput(input);
        }
    });

    // 处理文件上传
    const uploadButton = chatForm.querySelector('.upload-btn');
    uploadButton.addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt,.pdf,.doc,.docx';
        
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                textarea.value = `请分析以下文本内容：\n\n${text}`;
            } catch (error) {
                alert('文件读取失败，请重试');
            }
        });

        fileInput.click();
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initChat();
}); 