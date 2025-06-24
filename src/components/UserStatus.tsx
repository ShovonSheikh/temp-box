import { useState } from 'react';
import {
  User,
  Crown,
  LogOut,
  ChevronDown,
  Shield,
  Mail,
  Settings,
} from 'lucide-react';
import { authService, User as UserType } from '../services/authService';
import toast from 'react-hot-toast';

interface UserStatusProps {
  user: UserType | null;
  onUserChange: (user: UserType | null) => void;
  onSettingsClick?: () => void;
}

export function UserStatus({ user, onUserChange, onSettingsClick }: UserStatusProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    authService.logout();
    onUserChange(null);
    setIsDropdownOpen(false);
    toast.success('Logged out successfully', {
      icon: '👋',
      duration: 2000,
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'user':
        return <User className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-200';
      case 'user':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-200';
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 p-2 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200"
      >
        <div className="flex items-center space-x-2">
          {getRoleIcon(user.role)}
          <div className="text-left">
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {user.name || user.email.split('@')[0]}
            </div>
            <div className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(user.role)}`}>
              {user.role}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl z-20 overflow-hidden">
            {/* User Info Header */}
            <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {user.name || user.email.split('@')[0]}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
                    <Mail className="w-3 h-3 mr-1" />
                    {user.email}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-lg text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                  {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Permissions:</div>
              <div className="flex flex-wrap gap-1">
                {user.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-md"
                  >
                    {permission.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              {/* Only show settings if user is admin */}
              {user.role === 'admin' && onSettingsClick && (
                <button
                  onClick={() => {
                    onSettingsClick();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  <Settings className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">System Settings</span>
                </button>
              )}
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-600 dark:text-red-400">Sign Out</span>
              </button>
            </div>

            {/* Session Info */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="text-xs text-slate-500 dark:text-slate-500 flex items-center justify-between">
                <span>Session: {user.id.split('_')[0]}</span>
                <span className="flex items-center">
                  <Shield className="w-3 h-3 mr-1" />
                  Active
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
