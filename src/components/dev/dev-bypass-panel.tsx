'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Settings,
  User,
  LogOut,
  Crown,
  Code,
  TestTube,
  Users,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface TestUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url: string;
}

// Only show in development
const isDevelopment = process.env.NODE_ENV === 'development';

export function DevBypassPanel() {
  const { data: session, update } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [testUsers, setTestUsers] = useState<TestUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (isDevelopment) {
      checkAvailability();
    }
  }, []);

  const checkAvailability = async () => {
    try {
      const response = await fetch('/api/auth/dev-bypass');
      if (response.ok) {
        const data = await response.json();
        setAvailable(data.available);
        setTestUsers(data.testUsers || []);
      }
    } catch (error) {
      console.error('Dev bypass not available:', error);
    }
  };

  const loginAsUser = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/dev-bypass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Logged in as ${data.user.name}`);
        
        // Force session update
        await update();
        
        // Refresh the page to ensure all components update
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to login');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/dev-bypass', {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Logged out');
        await update();
        window.location.reload();
      } else {
        toast.error('Failed to logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4" />;
      case 'developer':
        return <Code className="w-4 h-4" />;
      case 'tester':
        return <TestTube className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'developer':
        return 'bg-blue-100 text-blue-800';
      case 'tester':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Don't render anything in production or if not available
  if (!isDevelopment || !available) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg border-2 border-yellow-200 bg-yellow-50">
        <CardHeader 
          className="pb-2 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span className="text-yellow-800">Dev Bypass</span>
              <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                DEV ONLY
              </Badge>
            </div>
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-yellow-600" />
            ) : (
              <ChevronUp className="w-4 h-4 text-yellow-600" />
            )}
          </CardTitle>
        </CardHeader>

        {isOpen && (
          <CardContent className="pt-0">
            {/* Current User */}
            {session?.user && (
              <div className="mb-4 p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={session.user.image || ''} />
                    <AvatarFallback>
                      {session.user.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{session.user.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {session.user.email}
                    </div>
                  </div>
                  <Badge className={`text-xs ${getRoleColor((session.user as any).role || 'user')}`}>
                    {getRoleIcon((session.user as any).role || 'user')}
                    <span className="ml-1">{(session.user as any).role || 'user'}</span>
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={logout}
                  disabled={loading}
                  className="w-full"
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  Logout
                </Button>
              </div>
            )}

            {/* Test Users */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-yellow-800 mb-2">
                Quick Login As:
              </div>
              {testUsers.map((user) => (
                <Button
                  key={user.id}
                  variant="outline"
                  size="sm"
                  onClick={() => loginAsUser(user.id)}
                  disabled={loading || session?.user?.email === user.email}
                  className="w-full justify-start h-auto p-2"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="text-xs font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                    <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      <span className="ml-1">{user.role}</span>
                    </Badge>
                  </div>
                </Button>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-yellow-200">
              <div className="text-xs text-yellow-700 text-center">
                ⚠️ Development Mode Only
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
