<p align="center">
  <a href="README.md">English</a> | <a href="README_CN.md">中文</a>
</p>

# Goals React 前端

一个现代化的 React 前端应用，用于目标与词汇管理系统，内置 **AI 智能对话助手**，支持实时流式响应。基于 Vite、TypeScript 和 Tailwind CSS 构建。

## 🚀 功能特性

- **🤖 AI 智能对话助手**（新功能）
  - 悬浮式聊天窗口，任意页面均可访问
  - 实时流式 AI 响应（打字机效果，基于 SSE）
  - 通过自然语言管理目标、任务和词汇
  - 支持语音输入（Web Speech API）
  - 对话历史记录，AI 自动生成对话名称
  - 工具调用透明化（可查看 AI 正在使用的工具）
  - AI 回复支持 Markdown 渲染

- **用户认证**
  - 使用 JWT 令牌的登录/注册
  - 自动令牌刷新机制
  - 安全登出

- **词汇管理**
  - 创建、编辑和删除英语单词
  - 添加释义和个人笔记
  - 使用标签组织单词
  - 支持媒体文件附件

- **目标与任务管理**
  - 创建和跟踪个人目标
  - 将目标分解为可执行的任务
  - 状态跟踪（未开始、进行中、已完成、暂停）
  - 优先级和紧急程度设置
  - 基于标签的组织管理

- **现代化 UI/UX**
  - 简洁、极简的深色主题
  - 响应式设计
  - 流畅的动画效果
  - 直观的导航

## 🤖 AI 智能对话助手

AI 智能对话助手位于仪表盘右上角的醒目位置，提供功能完整的对话界面与数据进行交互。

### 工作原理

```
用户输入 (文字/语音) → ChatInput 组件 → SSE Fetch 请求 → FastAPI 后端
                                                              ↓
ChatMessage (流式渲染) ← ChatWindow (状态管理) ← SSE 事件流 ← LangGraph Agent
```

### 聊天组件

| 组件 | 文件 | 说明 |
|------|------|------|
| **ChatButton** | `src/components/Chat/ChatButton.tsx` | 顶栏按钮（带脉冲指示器），通过 Portal 渲染 ChatWindow |
| **ChatWindow** | `src/components/Chat/ChatWindow.tsx` | 主聊天界面，包含侧边栏、消息区域和输入框 |
| **ChatSidebar** | `src/components/Chat/ChatSidebar.tsx` | 对话列表，支持新建/删除/选择对话 |
| **ChatMessage** | `src/components/Chat/ChatMessage.tsx` | 单条消息渲染器，支持 Markdown |
| **ChatInput** | `src/components/Chat/ChatInput.tsx` | 自适应高度输入框，支持语音输入 |

### 聊天服务

`chatService`（`src/services/chat.ts`）处理所有聊天 API 交互：
- 对话的 CRUD 操作
- SSE 流式消息处理与事件解析
- 支持 `token`、`tool_call`、`tool_result`、`done`、`error` 事件回调

### 语音输入

语音输入使用浏览器原生 **Web Speech API**（`webkitSpeechRecognition`）。前端负责语音转文字，然后将文字作为普通消息发送给后端，无需额外的后端处理。

## 🛠️ 技术栈

- **框架**: React 18
- **构建工具**: Vite
- **开发语言**: TypeScript
- **样式**: Tailwind CSS
- **HTTP 客户端**: Axios + Fetch (SSE)
- **路由**: React Router v6
- **图标**: Lucide React
- **Markdown 渲染**: react-markdown + remark-gfm

## 📦 安装

1. **克隆仓库**
   ```bash
   git clone https://github.com/himengmengmeng/goals_react.git
   cd goals_react
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **在浏览器中打开**
   ```
   http://localhost:5173
   ```

## 🔧 配置

前端默认连接到 `http://localhost:8001` 的后端 API。可以在 `src/services/api.ts` 中修改：

```typescript
const API_BASE_URL = 'http://localhost:8001';
```

## 📁 项目结构

```
src/
├── components/          # 可复用的 UI 组件
│   ├── Chat/            # AI 聊天助手组件
│   │   ├── ChatButton.tsx    # 顶栏切换按钮（Portal 渲染）
│   │   ├── ChatWindow.tsx    # 主聊天窗口（含状态管理）
│   │   ├── ChatSidebar.tsx   # 对话列表侧边栏
│   │   ├── ChatMessage.tsx   # 消息气泡（Markdown 渲染）
│   │   └── ChatInput.tsx     # 输入框（支持语音）
│   ├── Modal.tsx
│   ├── ConfirmDialog.tsx
│   ├── EmptyState.tsx
│   └── LoadingSpinner.tsx
├── contexts/            # React 上下文
│   └── AuthContext.tsx  # 认证状态管理
├── layouts/             # 布局组件
│   └── DashboardLayout.tsx  # 主布局（含 ChatButton）
├── pages/               # 页面组件
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── WordsPage.tsx
│   ├── WordTagsPage.tsx
│   ├── GoalsPage.tsx
│   ├── TasksPage.tsx
│   └── GoalTagsPage.tsx
├── services/            # API 服务层
│   ├── api.ts           # Axios 实例和拦截器
│   ├── auth.ts          # 认证 API
│   ├── chat.ts          # AI 聊天 API（SSE 流式传输）
│   ├── words.ts         # 单词 API
│   ├── goals.ts         # 目标 API
│   ├── tasks.ts         # 任务 API
│   └── tags.ts          # 标签 API
├── types/               # TypeScript 类型定义
│   ├── index.ts         # 核心类型
│   ├── chat.ts          # 聊天 & SSE 事件类型
│   └── speech.d.ts      # Web Speech API 声明
├── App.tsx              # 主应用组件（含路由）
├── main.tsx             # 入口文件
└── index.css            # 全局样式 & Tailwind
```

## 🔐 认证流程

1. 用户使用用户名/密码登录
2. 后端返回 `access_token` 和 `refresh_token`
3. 令牌存储在 localStorage 中
4. Access token 自动附加到所有 API 请求
5. 当 access token 过期时，使用 refresh token 获取新令牌
6. 登出时清除令牌并重定向到登录页

## 📜 可用脚本

| 命令 | 描述 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | 运行 ESLint |

## 🔗 后端 API

本前端设计用于配合 [Goals 后端 API](https://github.com/himengmengmeng/tasks) 使用。

启动前端前请确保后端服务已运行：
```bash
# 在后端目录中

# 1. Django 管理后台
python manage.py runserver

# 2. FastAPI 服务器（主 API + AI 对话）
uvicorn api.main:app --host 0.0.0.0 --port 8001 --reload
```

## 📄 许可证

MIT 许可证

## 👨‍💻 作者

**Meng**

---

⭐ 如果这个项目对你有帮助，请给它一个星标！
