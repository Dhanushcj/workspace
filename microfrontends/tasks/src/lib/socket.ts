import { io, Socket } from 'socket.io-client';
import { getApiUrl } from './api';
import { useAuthStore } from '../store/authStore';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    const token = useAuthStore.getState().accessToken;

    if (!this.socket && token) {
      // Always resolve URL fresh from env to avoid stale closures
      const rawUrl = getApiUrl();
      let baseUrl = rawUrl;
      try {
        const url = new URL(rawUrl);
        baseUrl = url.origin;
      } catch (e) {
        // Fallback: strip any path segments
        baseUrl = rawUrl.replace(/\/api.*$/, '');
      }

      console.log('[SOCKET] Connecting to:', baseUrl);

      this.socket = io(baseUrl, {
        // WebSocket first — avoids the XHR polling error in dev/proxy environments
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        timeout: 20000,
        path: '/socket.io',
        auth: { token },
      });

      this.socket.on('connect', () => {
        console.log('[SOCKET] Connected to Neural Pulse ✓', this.socket?.id);
      });

      this.socket.on('connect_error', (error) => {
        console.warn('[SOCKET] Connection error (will retry):', error.message);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[SOCKET] Disconnected:', reason);
      });
    }
    return this.socket;
  }

  getSocket() {
    return this.socket;
  }

  joinProject(projectId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join-project', projectId);
      console.log('[SOCKET] Joined project room:', projectId);
    }
  }

  leaveProject(projectId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave:project', { projectId });
    }
  }

  onTaskUpdated(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('task-updated', callback);
    }
  }

  onCommentAdded(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('comment-added', callback);
    }
  }

  sendMessage(toUserId: string, text: string) {
    if (this.socket?.connected) {
      this.socket.emit('send-message', { toUserId, text });
    }
  }

  onMessageReceived(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('new-message', callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();

