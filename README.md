# Goals React Frontend

A modern React frontend for the Goals & Vocabulary Management System. Built with Vite, TypeScript, and Tailwind CSS.

## 🚀 Features

- **User Authentication**
  - Login / Register with JWT tokens
  - Automatic token refresh mechanism
  - Secure logout

- **Vocabulary Management**
  - Create, edit, and delete English words
  - Add explanations and personal notes
  - Organize words with tags
  - Media file attachments support

- **Goals & Tasks Management**
  - Create and track personal goals
  - Break down goals into actionable tasks
  - Status tracking (Not Started, In Progress, Completed, On Hold)
  - Priority and urgency levels
  - Tag-based organization

- **Modern UI/UX**
  - Clean, minimalist dark theme
  - Responsive design
  - Smooth animations
  - Intuitive navigation

## 🛠️ Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Icons**: Lucide React

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/himengmengmeng/goals_react.git
   cd goals_react
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🔧 Configuration

The frontend expects the backend API to be running at `http://localhost:8001`. You can modify this in `src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8001';
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Modal.tsx
│   ├── ConfirmDialog.tsx
│   ├── EmptyState.tsx
│   └── LoadingSpinner.tsx
├── contexts/            # React contexts
│   └── AuthContext.tsx  # Authentication state management
├── layouts/             # Layout components
│   └── DashboardLayout.tsx
├── pages/               # Page components
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── WordsPage.tsx
│   ├── WordTagsPage.tsx
│   ├── GoalsPage.tsx
│   ├── TasksPage.tsx
│   └── GoalTagsPage.tsx
├── services/            # API service layer
│   ├── api.ts           # Axios instance & interceptors
│   ├── auth.ts          # Authentication API
│   ├── words.ts         # Words API
│   ├── goals.ts         # Goals API
│   ├── tasks.ts         # Tasks API
│   └── tags.ts          # Tags API
├── types/               # TypeScript type definitions
│   └── index.ts
├── App.tsx              # Main app component with routing
├── main.tsx             # Entry point
└── index.css            # Global styles & Tailwind
```

## 🔐 Authentication Flow

1. User logs in with username/password
2. Backend returns `access_token` and `refresh_token`
3. Tokens are stored in localStorage
4. Access token is automatically attached to all API requests
5. When access token expires, refresh token is used to obtain new tokens
6. On logout, tokens are cleared and user is redirected to login

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## 🔗 Backend API

This frontend is designed to work with the [Goals Backend API](https://github.com/himengmengmeng/tasks).

Make sure the backend is running before starting the frontend:
```bash
# In the backend directory
uvicorn api.main:app --host 0.0.0.0 --port 8001 --reload
```

## 📄 License

MIT License

## 👨‍💻 Author

**Meng**

---

# Goals React 前端 (中文)

一个现代化的 React 前端应用，用于目标与词汇管理系统。基于 Vite、TypeScript 和 Tailwind CSS 构建。

## 🚀 功能特性

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

## 🛠️ 技术栈

- **框架**: React 18
- **构建工具**: Vite
- **开发语言**: TypeScript
- **样式**: Tailwind CSS
- **HTTP 客户端**: Axios
- **路由**: React Router v6
- **图标**: Lucide React

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
   http://localhost:3000
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
│   ├── Modal.tsx
│   ├── ConfirmDialog.tsx
│   ├── EmptyState.tsx
│   └── LoadingSpinner.tsx
├── contexts/            # React 上下文
│   └── AuthContext.tsx  # 认证状态管理
├── layouts/             # 布局组件
│   └── DashboardLayout.tsx
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
│   ├── words.ts         # 单词 API
│   ├── goals.ts         # 目标 API
│   ├── tasks.ts         # 任务 API
│   └── tags.ts          # 标签 API
├── types/               # TypeScript 类型定义
│   └── index.ts
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

启动前端前请确保后端已运行：
```bash
# 在后端目录中
uvicorn api.main:app --host 0.0.0.0 --port 8001 --reload
```

## 📄 许可证

MIT 许可证

## 👨‍💻 作者

**Meng**

---

⭐ 如果这个项目对你有帮助，请给它一个星标！
