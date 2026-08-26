import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useToast } from './ToastContext';

// IMPORTANT: this connects DIRECTLY to notification-service, NOT through the
// API Gateway. Spring Cloud Gateway MVC (the servlet-based flavor this project
// uses) does not support proxying WebSocket connections — that's a real,
// documented limitation of Gateway MVC specifically, not a bug in this app.
// Every other request in this app still goes through the Gateway as normal;
// this is the one deliberate exception. See README-UI-Enhancement-Spec.md
// for the full explanation if this ever needs revisiting.
const WS_DIRECT_URL = import.meta.env.VITE_NOTIFICATION_WS_URL || 'http://localhost:8082';

export function usePushNotifications(userId) {
  const { showToast } = useToast();
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_DIRECT_URL}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/notifications/${userId}`, (message) => {
          const notification = JSON.parse(message.body);
          showToast(notification.message, 'info');
          setUnreadCount((count) => count + 1);
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: (frame) => {
        console.error('WebSocket/STOMP error:', frame.headers['message']);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [userId, showToast]);

  return { connected, unreadCount, resetUnreadCount: () => setUnreadCount(0) };
}
