<p align="center">
  <a href="README.md">English</a> | <a href="README_CN.md">中文</a>
</p>

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

⭐ If this project helps you, please give it a star!
