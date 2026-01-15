import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './layouts/DashboardLayout';
import WordsPage from './pages/WordsPage';
import WordTagsPage from './pages/WordTagsPage';
import GoalsPage from './pages/GoalsPage';
import TasksPage from './pages/TasksPage';
import GoalTagsPage from './pages/GoalTagsPage';

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route wrapper (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard/words" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="words" replace />} />
        <Route path="words" element={<WordsPage />} />
        <Route path="word-tags" element={<WordTagsPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="goal-tags" element={<GoalTagsPage />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/dashboard/words" replace />} />
    </Routes>
  );
}

export default App;
