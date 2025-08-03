import React from 'react';
import { Button } from '@blackliving/ui';
import { User, Package, Calendar, LogOut } from 'lucide-react';

// Simple utility function for combining classnames
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface AccountNavProps {
  currentPage: 'profile' | 'orders' | 'appointments';
  className?: string;
}

const navItems = [
  {
    href: '/account/profile',
    label: '個人資料',
    icon: User,
    page: 'profile' as const,
  },
  {
    href: '/account/orders',
    label: '訂單記錄',
    icon: Package,
    page: 'orders' as const,
  },
  {
    href: '/account/appointments',
    label: '預約記錄',
    icon: Calendar,
    page: 'appointments' as const,
  },
];

export default function AccountNav({ currentPage, className }: AccountNavProps) {
  const handleLogout = async () => {
    try {
      const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:8787';
      
      // Try multiple logout endpoints as Better Auth might use different ones
      const endpoints = [
        `${API_BASE}/api/auth/sign-out`,
        `${API_BASE}/api/auth/logout`,
        `${API_BASE}/api/auth/session-logout`
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            credentials: 'include',
          });
          if (response.ok) {
            break; // Success, exit loop
          }
        } catch (err) {
          console.warn(`Logout attempt failed for ${endpoint}:`, err);
        }
      }
      
      // Clear any local storage/session storage
      if (typeof(Storage) !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      window.location.href = '/login';
    } catch (error) {
      console.error('All logout attempts failed:', error);
      // Still redirect even if logout fails
      window.location.href = '/login';
    }
  };

  return (
    <div className={cn("md:col-span-1", className)}>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.page;
          
          return (
            <Button
              key={item.page}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-auto p-4",
                isActive 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              asChild
            >
              <a href={item.href}>
                <Icon className="h-4 w-4" />
                {item.label}
              </a>
            </Button>
          );
        })}
        
        <div className="my-4">
          <div className="border-t border-border" />
        </div>
        
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-auto p-4 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          登出
        </Button>
      </nav>
    </div>
  );
}