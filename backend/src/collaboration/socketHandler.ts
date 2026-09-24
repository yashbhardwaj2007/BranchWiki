import { Server, Socket } from 'socket.io';
import * as Y from 'yjs';

interface ConnectedUser {
  id: string;
  name: string;
  color: string;
  cursor?: { line: number; ch: number };
}

const documents = new Map<string, Y.Doc>();
const documentUsers = new Map<string, Map<string, ConnectedUser>>();

export function setupCollaboration(io: Server) {
  io.on('connection', (socket: Socket) => {
    let currentDocKey: string | null = null;
    let currentUser: ConnectedUser | null = null;

    socket.on('join-document', ({ wikiId, filePath, user }) => {
      // Leave previous room if any
      if (currentDocKey) {
        socket.leave(currentDocKey);
        documentUsers.get(currentDocKey)?.delete(socket.id);
        io.to(currentDocKey).emit('presence-update',
          Array.from(documentUsers.get(currentDocKey)?.values() || [])
        );
      }

      currentDocKey = `${wikiId}:${filePath}`;
      socket.join(currentDocKey);

      // Create or get Yjs doc
      if (!documents.has(currentDocKey)) {
        documents.set(currentDocKey, new Y.Doc());
      }

      // Track user presence
      if (!documentUsers.has(currentDocKey)) {
        documentUsers.set(currentDocKey, new Map());
      }

      currentUser = {
        id: socket.id,
        name: user?.name || 'Collaborator',
        color: user?.color || '#0D9488',
      };

      documentUsers.get(currentDocKey)!.set(socket.id, currentUser);

      // Send current doc state
      const doc = documents.get(currentDocKey)!;
      const state = Y.encodeStateAsUpdate(doc);
      socket.emit('yjs-sync', Array.from(state));

      // Broadcast updated presence to all clients in this document
      io.to(currentDocKey).emit('presence-update',
        Array.from(documentUsers.get(currentDocKey)!.values())
      );
    });

    // Keystroke / Content synchronization
    socket.on('doc-change', ({ wikiId, filePath, content, cursor }) => {
      if (!currentDocKey) return;
      if (currentUser && cursor) {
        currentUser.cursor = cursor;
        documentUsers.get(currentDocKey)?.set(socket.id, currentUser);
      }
      socket.to(currentDocKey).emit('doc-change-remote', {
        content,
        senderId: socket.id,
        user: currentUser,
        cursor,
      });
    });

    // Real-time typing indicators
    socket.on('typing', ({ isTyping }) => {
      if (!currentDocKey || !currentUser) return;
      socket.to(currentDocKey).emit('user-typing', {
        user: currentUser,
        isTyping,
      });
    });

    // Cursor position updates
    socket.on('cursor-move', ({ line, ch }) => {
      if (!currentDocKey || !currentUser) return;
      currentUser.cursor = { line, ch };
      documentUsers.get(currentDocKey)?.set(socket.id, currentUser);
      socket.to(currentDocKey).emit('cursor-update', {
        userId: socket.id,
        user: currentUser,
        cursor: { line, ch },
      });
    });

    // Yjs binary protocol synchronization
    socket.on('yjs-update', (update: number[]) => {
      if (!currentDocKey) return;
      const doc = documents.get(currentDocKey);
      if (doc) {
        try {
          Y.applyUpdate(doc, new Uint8Array(update));
          socket.to(currentDocKey).emit('yjs-update', update);
        } catch (e) {
          console.error('Failed to apply yjs update:', e);
        }
      }
    });

    socket.on('leave-document', () => {
      if (currentDocKey) {
        documentUsers.get(currentDocKey)?.delete(socket.id);
        io.to(currentDocKey).emit('presence-update',
          Array.from(documentUsers.get(currentDocKey)?.values() || [])
        );
        socket.leave(currentDocKey);
        currentDocKey = null;
        currentUser = null;
      }
    });

    socket.on('disconnect', () => {
      if (currentDocKey) {
        documentUsers.get(currentDocKey)?.delete(socket.id);
        io.to(currentDocKey).emit('presence-update',
          Array.from(documentUsers.get(currentDocKey)?.values() || [])
        );
        socket.leave(currentDocKey);
      }
    });
  });
}
