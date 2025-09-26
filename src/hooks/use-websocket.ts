'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { EventTypes } from '@/lib/websocket/server';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastMessage: any;
  analytics: any;
  metrics: any;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { data: session } = useSession();
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    lastMessage: null,
    analytics: null,
    metrics: null,
  });

  const updateState = useCallback((updates: Partial<WebSocketState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const connect = useCallback(async () => {
    if (!session?.accessToken || socketRef.current?.connected) {
      return;
    }

    try {
      updateState({ connecting: true, error: null });

      const socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
        path: '/api/socket',
        auth: {
          token: session.accessToken,
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
      });

      socketRef.current = socket;

      // Connection events
      socket.on('connect', () => {
        console.log('WebSocket connected');
        reconnectCountRef.current = 0;
        updateState({ 
          connected: true, 
          connecting: false, 
          error: null 
        });

        // Subscribe to analytics if user has appropriate role
        if (session.user?.role === 'admin' || session.user?.role === 'developer') {
          socket.emit('subscribe:analytics');
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        updateState({ 
          connected: false, 
          connecting: false 
        });

        // Attempt reconnection if not manually disconnected
        if (reason !== 'io client disconnect' && reconnectCountRef.current < reconnectAttempts) {
          scheduleReconnect();
        }
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        updateState({ 
          connected: false, 
          connecting: false, 
          error: error.message 
        });

        if (reconnectCountRef.current < reconnectAttempts) {
          scheduleReconnect();
        }
      });

      // Analytics events
      socket.on(EventTypes.ANALYTICS_UPDATE, (data) => {
        updateState({ analytics: data });
      });

      socket.on(EventTypes.METRICS_UPDATE, (data) => {
        updateState({ metrics: data });
      });

      // App events
      socket.on(EventTypes.APP_SUBMITTED, (data) => {
        updateState({ lastMessage: { type: 'app_submitted', data } });
      });

      socket.on(EventTypes.APP_APPROVED, (data) => {
        updateState({ lastMessage: { type: 'app_approved', data } });
      });

      socket.on(EventTypes.APP_REJECTED, (data) => {
        updateState({ lastMessage: { type: 'app_rejected', data } });
      });

      // Purchase events
      socket.on(EventTypes.PURCHASE_COMPLETED, (data) => {
        updateState({ lastMessage: { type: 'purchase_completed', data } });
      });

      // Review events
      socket.on(EventTypes.REVIEW_SUBMITTED, (data) => {
        updateState({ lastMessage: { type: 'review_submitted', data } });
      });

      // User events
      socket.on(EventTypes.USER_REGISTERED, (data) => {
        updateState({ lastMessage: { type: 'user_registered', data } });
      });

      // System events
      socket.on(EventTypes.SYSTEM_ALERT, (data) => {
        updateState({ lastMessage: { type: 'system_alert', data } });
      });

      // Generic message handler
      socket.onAny((event, data) => {
        console.log('WebSocket event:', event, data);
      });

    } catch (error: any) {
      console.error('Failed to connect WebSocket:', error);
      updateState({ 
        connected: false, 
        connecting: false, 
        error: error.message 
      });
    }
  }, [session, reconnectAttempts, updateState]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    updateState({ 
      connected: false, 
      connecting: false, 
      error: null 
    });
  }, [updateState]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectCountRef.current += 1;
    const delay = reconnectDelay * Math.pow(2, reconnectCountRef.current - 1); // Exponential backoff

    console.log(`Scheduling reconnect attempt ${reconnectCountRef.current} in ${delay}ms`);

    reconnectTimeoutRef.current = setTimeout(() => {
      if (reconnectCountRef.current <= reconnectAttempts) {
        connect();
      }
    }, delay);
  }, [connect, reconnectDelay, reconnectAttempts]);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Cannot emit event: WebSocket not connected');
    }
  }, []);

  const requestAnalytics = useCallback((params?: any) => {
    emit('request:analytics', params);
  }, [emit]);

  // Auto-connect when session is available
  useEffect(() => {
    if (autoConnect && session?.accessToken && !socketRef.current) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [session, autoConnect, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    emit,
    requestAnalytics,
    socket: socketRef.current,
  };
}

// Hook for specific event listening
export function useWebSocketEvent(event: EventTypes | string, handler: (data: any) => void) {
  const { socket } = useWebSocket({ autoConnect: false });

  useEffect(() => {
    if (socket) {
      socket.on(event, handler);

      return () => {
        socket.off(event, handler);
      };
    }
  }, [socket, event, handler]);
}

// Hook for analytics data
export function useRealtimeAnalytics(timeframe = '24h') {
  const { analytics, metrics, requestAnalytics, connected } = useWebSocket();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (connected) {
      requestAnalytics({ timeframe });
      setLoading(false);
    }
  }, [connected, timeframe, requestAnalytics]);

  // Request fresh data every minute
  useEffect(() => {
    if (!connected) return;

    const interval = setInterval(() => {
      requestAnalytics({ timeframe });
    }, 60000);

    return () => clearInterval(interval);
  }, [connected, timeframe, requestAnalytics]);

  return {
    analytics,
    metrics,
    loading: loading && !analytics,
    connected,
    refresh: () => requestAnalytics({ timeframe }),
  };
}

// Hook for real-time notifications
export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage) {
      setNotifications(prev => [lastMessage, ...prev.slice(0, 49)]); // Keep last 50 notifications
    }
  }, [lastMessage]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    notifications,
    clearNotifications,
    removeNotification,
    hasUnread: notifications.length > 0,
  };
}
