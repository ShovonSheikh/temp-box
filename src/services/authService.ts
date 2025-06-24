export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  permissions: string[];
  name?: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

class AuthService {
  private readonly ADMIN_EMAILS = [
    'admin@tempbox.local',
    'admin@example.com',
    'developer@tempbox.local',
    // Add more admin emails here
  ];

  private readonly ADMIN_ACCESS_CODES = [
    'TEMPBOX_ADMIN_2024',
    'DEV_ACCESS_123',
    // Add more access codes here
  ];

  /**
   * Check if current user has admin privileges
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin' || false;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    return user?.permissions.includes(permission) || this.isAdmin();
  }

  /**
   * Get current user from storage
   */
  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem('tempbox-user');
      if (!stored) return null;
      
      const user = JSON.parse(stored);
      
      // Validate user object
      if (!user.id || !user.role) {
        this.logout();
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      this.logout();
      return null;
    }
  }

  /**
   * Authenticate user with email and access code
   */
  async authenticateUser(email: string, accessCode?: string): Promise<User> {
    console.log('🔐 Authenticating user:', { email });
    
    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let role: User['role'] = 'guest';
    let permissions: string[] = ['view_inbox', 'create_inbox', 'delete_messages'];
    
    // Check if user is admin by email
    if (this.ADMIN_EMAILS.includes(email.toLowerCase())) {
      role = 'admin';
      permissions = [
        'view_inbox', 
        'create_inbox', 
        'delete_messages',
        'view_system_stats',
        'manage_cleanup',
        'view_audit_logs',
        'clear_all_data',
        'force_cleanup'
      ];
    }
    // Check if user provided valid access code
    else if (accessCode && this.ADMIN_ACCESS_CODES.includes(accessCode)) {
      role = 'admin';
      permissions = [
        'view_inbox', 
        'create_inbox', 
        'delete_messages',
        'view_system_stats',
        'manage_cleanup',
        'view_audit_logs',
        'clear_all_data',
        'force_cleanup'
      ];
    }
    // Regular user
    else {
      role = 'user';
    }
    
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase(),
      role,
      permissions,
      name: email.split('@')[0],
    };
    
    // Store user in localStorage
    localStorage.setItem('tempbox-user', JSON.stringify(user));
    
    console.log('✅ User authenticated:', { 
      email: user.email, 
      role: user.role, 
      permissions: user.permissions 
    });
    
    return user;
  }

  /**
   * Quick admin access with access code only
   */
  async quickAdminAccess(accessCode: string): Promise<User> {
    console.log('🔑 Quick admin access attempt');
    
    if (!this.ADMIN_ACCESS_CODES.includes(accessCode)) {
      throw new Error('Invalid access code');
    }
    
    const user: User = {
      id: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: 'admin@tempbox.local',
      role: 'admin',
      permissions: [
        'view_inbox', 
        'create_inbox', 
        'delete_messages',
        'view_system_stats',
        'manage_cleanup',
        'view_audit_logs',
        'clear_all_data',
        'force_cleanup'
      ],
      name: 'Administrator',
    };
    
    localStorage.setItem('tempbox-user', JSON.stringify(user));
    
    console.log('✅ Admin access granted');
    return user;
  }

  /**
   * Logout current user
   */
  logout(): void {
    localStorage.removeItem('tempbox-user');
    console.log('👋 User logged out');
  }

  /**
   * Check if authentication is required for admin features
   */
  requiresAuth(): boolean {
    return !this.isAdmin();
  }

  /**
   * Get auth state
   */
  getAuthState(): AuthState {
    const user = this.getCurrentUser();
    return {
      user,
      isAuthenticated: !!user,
      isLoading: false,
    };
  }

  /**
   * Grant temporary admin access (for development/testing)
   */
  grantTempAdminAccess(): User {
    const user: User = {
      id: `temp_admin_${Date.now()}`,
      email: 'temp@admin.local',
      role: 'admin',
      permissions: [
        'view_inbox', 
        'create_inbox', 
        'delete_messages',
        'view_system_stats',
        'manage_cleanup',
        'view_audit_logs',
        'clear_all_data',
        'force_cleanup'
      ],
      name: 'Temporary Admin',
    };
    
    localStorage.setItem('tempbox-user', JSON.stringify(user));
    console.log('🔧 Temporary admin access granted');
    return user;
  }

  /**
   * Check if current session is valid
   */
  isSessionValid(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    // Add session validation logic here
    // For now, we'll consider all sessions valid
    return true;
  }
}

export const authService = new AuthService();
