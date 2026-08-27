import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useToast } from './ToastContext';
import { getUnreadNotifications } from '../api/client';

export function usePushNotifications(userId) {
  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenNotificationIdsRef = useRef(new Set());
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    initialLoadRef.current = true;
    seenNotificationIdsRef.current.clear();

    const fetchUnread = async () => {
      try {
        const unreadList = await getUnreadNotifications(userId);
        if (!isMounted || !Array.isArray(unreadList)) return;

        setUnreadCount(unreadList.length);
        setConnected(true);

        if (initialLoadRef.current) {
          unreadList.forEach((n) => seenNotificationIdsRef.current.add(n.id));
          initialLoadRef.current = false;
        } else {
          unreadList.forEach((n) => {
            if (!seenNotificationIdsRef.current.has(n.id)) {
              seenNotificationIdsRef.current.add(n.id);
              showToastRef.current(n.message, 'info');
            }
          });
        }
      } catch (e) {
        // non-fatal
      }
    };

    // Initial fetch once on user switch/mount
    fetchUnread();

    // Pull polling interval (every 4 seconds for reliable fallback)
    const pollInterval = setInterval(fetchUnread, 4000);

    // WebSocket / STOMP Connection URL
    let wsEndpoint = '/ws';
    const envUrl = import.meta.env.VITE_NOTIFICATION_WS_URL;
    if (envUrl && envUrl.trim()) {
      let url = envUrl.trim();
      if (url.startsWith('ws://')) url = url.replace(/^ws:\/\//, 'http://');
      if (url.startsWith('wss://')) url = url.replace(/^wss:\/\//, 'https://');
      wsEndpoint = url.endsWith('/ws') ? url : `${url}/ws`;
    } else if (typeof window !== 'undefined') {
      wsEndpoint = `${window.location.origin}/ws`;
    }

    try {
      const client = new Client({
        webSocketFactory: () => new SockJS(wsEndpoint),
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: () => {
          if (!isMounted) return;
          setConnected(true);

          // Subscribe to user-specific notifications
          client.subscribe(`/topic/notifications/${userId}`, (message) => {
            try {
              const notification = JSON.parse(message.body);
              if (notification.id && !seenNotificationIdsRef.current.has(notification.id)) {
                seenNotificationIdsRef.current.add(notification.id);
                showToastRef.current(notification.message, 'info');
                setUnreadCount((count) => count + 1);
              } else if (!notification.id) {
                showToastRef.current(notification.message, 'info');
                setUnreadCount((count) => count + 1);
              }
            } catch (e) {
              console.warn('Failed to parse notification payload', e);
            }
          });

          // Subscribe to general activity events
          client.subscribe(`/topic/activity`, (message) => {
            try {
              const event = JSON.parse(message.body);
              // Trigger a background refresh of unread count on any activity
              fetchUnread();
            } catch (e) {
              // ignore
            }
          });
        },
        onDisconnect: () => {},
        onStompError: (frame) => {
          console.warn('STOMP protocol error:', frame);
        },
        onWebSocketClose: () => {},
        onWebSocketError: () => {},
      });

      client.activate();
      clientRef.current = client;
    } catch (err) {
      console.warn('WebSocket push notifications unavailable:', err);
    }

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      try {
        if (clientRef.current) {
          clientRef.current.deactivate();
        }
      } catch (e) {
        // ignore
      }
    };
  }, [userId]);

  return { connected, unreadCount, resetUnreadCount: () => setUnreadCount(0) };
}
