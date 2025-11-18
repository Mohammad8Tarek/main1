import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Layout from './pages/Layout';
import DashboardPage from './pages/DashboardPage';
import BuildingsAndRoomsPage from './pages/BuildingsAndRoomsPage';
import EmployeesPage from './pages/EmployeesPage';
import AssignmentsPage from './pages/AssignmentsPage';
import MaintenancePage from './pages/MaintenancePage';
import UsersPage from './pages/UsersPage';
import ActivityLogPage from './pages/ActivityLogPage';
import SettingsPage from './pages/SettingsPage';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { systemSettingsApi } from './services/apiService';
import { ExportSettingsProvider } from './context/ExportSettingsContext';

// --- System Settings Context ---
interface SystemSettings {
    ai_suggestions: boolean;
    [key: string]: any;
}
const defaultSystemSettings: SystemSettings = { ai_suggestions: false };
const SystemSettingsContext = React.createContext<SystemSettings>(defaultSystemSettings);
export const useSystemSettings = (): SystemSettings => React.useContext(SystemSettingsContext);

const SystemSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SystemSettings>(defaultSystemSettings);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return; // Don't fetch if not logged in
        const fetchSettings = async () => {
            try {
                const data = await systemSettingsApi.getSettings();
                setSettings({
                    ai_suggestions: data.ai_suggestions === 'true',
                });
            } catch (error) {
                console.error("Failed to load system settings", error);
            }
        };
        
        fetchSettings();
    }, [user]);

    return (
        <SystemSettingsContext.Provider value={settings}>
            {children}
        </SystemSettingsContext.Provider>
    );
};
// --- End System Settings Context ---


const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ToastProvider>
          <SystemSettingsProvider>
            <ExportSettingsProvider>
              <AppContent />
            </ExportSettingsProvider>
          </SystemSettingsProvider>
        </ToastProvider>
      </LanguageProvider>
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAdmin = user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/" element={user ? <Layout theme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/login" />}>
          <Route index element={<DashboardPage />} />
          <Route path="housing" element={<BuildingsAndRoomsPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="reservations" element={<AssignmentsPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
          {isAdmin && <Route path="users" element={<UsersPage />} />}
          {isAdmin && <Route path="activity-log" element={<ActivityLogPage />} />}
          {isAdmin && <Route path="settings" element={<SettingsPage />} />}
        </Route>
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
      </Routes>
    </HashRouter>
  );
};

export default App;