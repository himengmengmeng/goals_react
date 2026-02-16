import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Target, 
  BookOpen, 
  Tag, 
  CheckSquare, 
  LogOut, 
  Menu, 
  X,
  ChevronDown,
  User
} from 'lucide-react';
import clsx from 'clsx';
import ChatButton from '../components/Chat/ChatButton';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Vocabulary',
    items: [
      { label: 'English Words', path: '/dashboard/words', icon: <BookOpen size={20} /> },
      { label: 'Word Tags', path: '/dashboard/word-tags', icon: <Tag size={20} /> },
    ],
  },
  {
    title: 'Goals & Tasks',
    items: [
      { label: 'Goals', path: '/dashboard/goals', icon: <Target size={20} /> },
      { label: 'Tasks', path: '/dashboard/tasks', icon: <CheckSquare size={20} /> },
      { label: 'Goal Tags', path: '/dashboard/goal-tags', icon: <Tag size={20} /> },
    ],
  },
];

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-dark-900 border-r border-dark-800',
          'transform transition-transform duration-300 lg:transform-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-dark-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display text-white">Goals</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-dark-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4">
            {navSections.map((section) => (
              <div key={section.title} className="mb-8">
                <h3 className="px-3 mb-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          clsx(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                            'text-sm font-medium',
                            isActive
                              ? 'bg-primary-500/10 text-primary-400 border-l-2 border-primary-500 -ml-[2px] pl-[14px]'
                              : 'text-dark-300 hover:text-white hover:bg-dark-800'
                          )
                        }
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-dark-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-dark-900/50 backdrop-blur-sm border-b border-dark-800 flex items-center justify-between px-6 sticky top-0 z-30">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-dark-400 hover:text-white"
          >
            <Menu size={24} />
          </button>

          {/* Spacer */}
          <div className="hidden lg:block flex-1" />

          {/* Right side actions */}
          <div className="flex items-center gap-3">
          {/* AI Chat Button */}
          <ChatButton />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-800 transition-colors"
            >
              <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center">
                <User size={18} className="text-primary-400" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-white">{user?.username}</p>
                <p className="text-xs text-dark-400">{user?.email}</p>
              </div>
              <ChevronDown size={16} className="text-dark-400" />
            </button>

            {/* Dropdown menu */}
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-dark-900 border border-dark-700 rounded-lg shadow-xl z-50 animate-fade-in">
                  <div className="p-3 border-b border-dark-700">
                    <p className="text-sm font-medium text-white">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-dark-400 truncate">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
