'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useEffect, useState } from 'react';
import { 
  Home, 
  Grid, 
  Package, 
  MessageSquare, 
  Settings, 
  BarChart, 
  PlusCircle, 
  Users, 
  CreditCard,
  User,
  Bug,
  CheckSquare,
  PlayCircle
} from 'lucide-react';

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  
  useEffect(() => {
    if (user?.role) {
      setUserRole(user.role);
    }
  }, [user]);
  
  const isTester = userRole === 'tester';
  const isDeveloper = userRole === 'developer';
  const isAdmin = userRole === 'admin';
  
  // Common link that appears for all user types
  const commonLinks = [
    { href: '/dashboard/profile', label: 'Profile', icon: <User className="h-5 w-5" /> },
  ];
  
  const testerLinks = [
    { href: '/dashboard/tester', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { href: '/dashboard/tester/apps', label: 'My Apps', icon: <Grid className="h-5 w-5" /> },
    { href: '/dashboard/tester/bugs', label: 'Bug Reports', icon: <Bug className="h-5 w-5" /> },
    { href: '/dashboard/tester/test-cases', label: 'Test Cases', icon: <CheckSquare className="h-5 w-5" /> },
    { href: '/dashboard/tester/executions', label: 'Test Executions', icon: <PlayCircle className="h-5 w-5" /> },
    { href: '/dashboard/tester/feedback', label: 'My Feedback', icon: <MessageSquare className="h-5 w-5" /> },
    { href: '/dashboard/tester/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ];
  
  const developerLinks = [
    { href: '/dashboard/developer', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { href: '/dashboard/developer/apps', label: 'My Apps', icon: <Package className="h-5 w-5" /> },
    { href: '/dashboard/developer/apps/create', label: 'Create App', icon: <PlusCircle className="h-5 w-5" /> },
    { href: '/dashboard/developer/analytics', label: 'Analytics', icon: <BarChart className="h-5 w-5" /> },
    { href: '/dashboard/developer/feedback', label: 'Feedback', icon: <MessageSquare className="h-5 w-5" /> },
    { href: '/dashboard/developer/feedback/analytics', label: 'Feedback Analytics', icon: <BarChart className="h-5 w-5" /> },
    { href: '/dashboard/developer/sales', label: 'Earnings', icon: <CreditCard className="h-5 w-5" /> },
    { href: '/dashboard/developer/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ];
  
  const adminLinks = [
    { href: '/dashboard/admin', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { href: '/dashboard/admin/users', label: 'Users', icon: <Users className="h-5 w-5" /> },
    { href: '/dashboard/admin/apps', label: 'Apps', icon: <Package className="h-5 w-5" /> },
    { href: '/dashboard/admin/sales', label: 'Sales', icon: <CreditCard className="h-5 w-5" /> },
    { href: '/dashboard/admin/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ];
  
  // Determine which links to show based on user role
  let roleSpecificLinks = isTester ? testerLinks : isDeveloper ? developerLinks : isAdmin ? adminLinks : [];
  
  // Combine common links with role-specific links
  const links = [...roleSpecificLinks, ...commonLinks];

  // If no role is determined yet, show loading state
  if (!userRole) {
    return (
      <div className="w-64 border-r bg-gray-50 dark:bg-gray-900 p-4 hidden md:block">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-64 border-r bg-gray-50 dark:bg-gray-900 p-4 hidden md:block">
      <div className="space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive 
                  ? 'bg-gray-200 dark:bg-gray-800 text-black dark:text-white' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white'
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
      
      {/* Mobile menu for small screens */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t flex justify-around p-2 z-10">
        {links.slice(0, 4).map((link) => {
          const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center p-2 ${
                isActive ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {link.icon}
              <span className="text-xs mt-1">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
