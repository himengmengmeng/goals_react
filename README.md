<p align="center">
  <a href="README.md">English</a> | <a href="README_CN.md">中文</a>
</p>

# Goals React Frontend

A modern React frontend for the Goals & Vocabulary Management System, featuring an **AI Chat Assistant** with real-time streaming responses. Built with Vite, TypeScript, and Tailwind CSS.

## 🚀 Features

- **🤖 AI Chat Assistant** (NEW)
  - Floating chat window accessible from any page
  - Real-time streaming AI responses (typewriter effect via SSE)
  - Natural language management of goals, tasks, and vocabulary
  - Voice input support via Web Speech API
  - Conversation history with auto-generated names
  - Tool call transparency (see what AI tools are being used)
  - Markdown rendering for AI responses

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

## 🤖 AI Chat Assistant

The AI Chat Assistant is a prominent feature accessible from the top-right corner of the dashboard. It provides a full-featured conversational interface to interact with your data.

### How It Works

```
User Input (Text/Voice) → ChatInput Component → SSE Fetch Request → FastAPI Backend
                                                                          ↓
ChatMessage (Streaming) ← ChatWindow (State Mgmt) ← SSE Event Stream ← LangGraph Agent
```

### Chat Components

| Component | File | Description |
|-----------|------|-------------|
| **ChatButton** | `src/components/Chat/ChatButton.tsx` | Header button with pulse indicator, renders ChatWindow via Portal |
| **ChatWindow** | `src/components/Chat/ChatWindow.tsx` | Main chat interface with sidebar, messages area, and input |
| **ChatSidebar** | `src/components/Chat/ChatSidebar.tsx` | Conversation list with create/delete/select actions |
| **ChatMessage** | `src/components/Chat/ChatMessage.tsx` | Individual message renderer with markdown support |
| **ChatInput** | `src/components/Chat/ChatInput.tsx` | Auto-resizing textarea with voice input button |

### Chat Service

The `chatService` (`src/services/chat.ts`) handles all chat API interactions:
- Conversation CRUD operations
- SSE streaming message handling with proper event parsing
- Callbacks for `token`, `tool_call`, `tool_result`, `done`, `error` events

### Voice Input

Voice input uses the browser-native **Web Speech API** (`webkitSpeechRecognition`). The frontend handles speech-to-text conversion, then sends the text to the backend as a regular message. No additional backend processing is needed.

## 🛠️ Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios + Fetch (SSE)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Markdown**: react-markdown + remark-gfm

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
   http://localhost:5173
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
│   ├── Chat/            # AI Chat Assistant components
│   │   ├── ChatButton.tsx    # Header toggle button (Portal-based)
│   │   ├── ChatWindow.tsx    # Main chat window with state management
│   │   ├── ChatSidebar.tsx   # Conversation list sidebar
│   │   ├── ChatMessage.tsx   # Message bubble with markdown rendering
│   │   └── ChatInput.tsx     # Input with voice support
│   ├── Modal.tsx
│   ├── ConfirmDialog.tsx
│   ├── EmptyState.tsx
│   └── LoadingSpinner.tsx
├── contexts/            # React contexts
│   └── AuthContext.tsx  # Authentication state management
├── layouts/             # Layout components
│   └── DashboardLayout.tsx  # Main layout with ChatButton in header
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
│   ├── chat.ts          # AI Chat API (SSE streaming)
│   ├── words.ts         # Words API
│   ├── goals.ts         # Goals API
│   ├── tasks.ts         # Tasks API
│   └── tags.ts          # Tags API
├── types/               # TypeScript type definitions
│   ├── index.ts         # Core types
│   ├── chat.ts          # Chat & SSE event types
│   └── speech.d.ts      # Web Speech API declarations
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

Make sure the backend services are running before starting the frontend:
```bash
# In the backend directory

# 1. Django Admin Server
python manage.py runserver

# 2. FastAPI Server (Main API + AI Chat)
uvicorn api.main:app --host 0.0.0.0 --port 8001 --reload
```

## 📄 License

MIT License

## 👨‍💻 Author

**Meng**

---

⭐ If this project helps you, please give it a star!
