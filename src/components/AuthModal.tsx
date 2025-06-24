import React, { useState } from 'react';
import {
  User,
  Lock,
  Mail,
  Key,
  Shield,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { authService, User as UserType } from '../services/authService';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserType) => void;
  requiredPermission?: string;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess, requiredPermission }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<'login' | 'admin' | 'quickAccess'>('login');
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await authService.authenticateUser(email, accessCode || undefined);
      
      // Check if user has required permission
      if (requiredPermission && !authService.hasPermission(requiredPermission)) {
        throw new Error(`Access denied. Required permission: ${requiredPermission}`);
      }

      toast.success(`Welcome ${user.name || user.email}!`, {
        icon: user.role === 'admin' ? '👑' : '👋',
        duration: 3000,
      });

      onAuthSuccess(user);
      onClose();
      resetForm();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      toast.error(errorMessage, { icon: '❌' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessCode.trim()) {
      setError('Access code is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await authService.quickAdminAccess(accessCode);
      
      toast.success('Admin access granted!', {
        icon: '👑',
        duration: 3000,
      });

      onAuthSuccess(user);
      onClose();
      resetForm();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid access code';
      setError(errorMessage);
      toast.error(errorMessage, { icon: '❌' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTempAdminAccess = () => {
    try {
      const user = authService.grantTempAdminAccess();
      
      toast.success('Temporary admin access granted!', {
        icon: '🔧',
        duration: 3000,
      });

      onAuthSuccess(user);
      onClose();
      resetForm();
    } catch (err) {
      toast.error('Failed to grant temporary access', { icon: '❌' });
    }
  };

  const resetForm = () => {
    setEmail('');
    setAccessCode('');
    setError(null);
    setAuthMode('login');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-slate-800 dark:text-slate-200">
                Authentication Required
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {requiredPermission ? `Access to admin features requires authentication` : 'Please sign in to continue'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selection */}
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex space-x-2">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                authMode === 'login'
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              User Login
            </button>
            <button
              onClick={() => setAuthMode('quickAccess')}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                authMode === 'quickAccess'
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <Key className="w-4 h-4 inline mr-2" />
              Quick Access
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}

          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Access Code (Optional)
                  <span className="text-xs text-slate-500 ml-1">- For admin access</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="Enter access code"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>
          )}

          {authMode === 'quickAccess' && (
            <form onSubmit={handleQuickAccess} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Admin Access Code
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="Enter admin access code"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Contact administrator for access code
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !accessCode.trim()}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-xl font-medium hover:from-orange-700 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Access Admin Panel</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Development Helper */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Development Only:</p>
              <button
                onClick={handleTempAdminAccess}
                className="w-full bg-yellow-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
              >
                Grant Temporary Admin Access
              </button>
            </div>
          )}

          {/* Valid Credentials Info */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Valid Credentials:
            </h4>
            <div className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
              <div>📧 Admin Emails: admin@tempbox.local, admin@example.com</div>
              <div>🔑 Access Codes: TEMPBOX_ADMIN_2024, DEV_ACCESS_123</div>
              <div>👤 Any email without access code = Regular user</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
