import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Real-time Logic
  const users = new Map<string, any>(); // socketId -> userData

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('user:join', (userData) => {
      users.set(socket.id, { ...userData, socketId: socket.id, status: 'online' });
      io.emit('users:update', Array.from(users.values()));
    });

    // Chat Events
    socket.on('chat:message', (message) => {
      io.emit('chat:message', {
        ...message,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString()
      });
    });

    socket.on('chat:delete', (messageId) => {
      io.emit('chat:delete', messageId);
    });

    // Specific Challenge Events
    socket.on('challenge:invite', ({ targetUid, subjectId }) => {
      const inviter = users.get(socket.id);
      if (!inviter) return;

      // Find target socketId
      const targetSocketId = Array.from(users.keys()).find(sid => users.get(sid).uid === targetUid);
      
      if (targetSocketId) {
        io.to(targetSocketId).emit('challenge:received', {
          from: inviter,
          subjectId,
          invitationId: `inv_${socket.id}_${Date.now()}`
        });
      }
    });

    socket.on('challenge:accept', ({ fromSocketId, subjectId }) => {
      const accepter = users.get(socket.id);
      const inviter = users.get(fromSocketId);
      
      if (accepter && inviter) {
        const roomId = `duel_${inviter.socketId}_${accepter.socketId}`;
        socket.join(roomId);
        io.sockets.sockets.get(inviter.socketId)?.join(roomId);
        
        io.to(roomId).emit('duel:found', { 
          roomId, 
          opponent: inviter, // Opponent for accepter is inviter
          isInviter: false,
          subjectId
        });
        
        // Notify inviter specifically with acceptor's data
        io.to(inviter.socketId).emit('duel:found', {
          roomId,
          opponent: accepter,
          isInviter: true,
          subjectId
        });

        inviter.inGame = true;
        accepter.inGame = true;
      }
    });

    socket.on('challenge:reject', ({ fromSocketId }) => {
      io.to(fromSocketId).emit('challenge:rejected', { from: users.get(socket.id) });
    });

    socket.on('challenge:cancel', ({ targetSocketId }) => {
      io.to(targetSocketId).emit('challenge:cancelled');
    });

    // Duel/Matchmaking Events
    socket.on('duel:search', (subjectId) => {
      // Basic random matchmaking for demo
      const user = users.get(socket.id);
      if (!user) return;

      // Find another user searching for same subject (naive)
      const opponent = Array.from(users.values()).find(u => 
        u.socketId !== socket.id && u.searching === subjectId
      );

      if (opponent) {
        const roomId = `duel_${socket.id}_${opponent.socketId}`;
        socket.join(roomId);
        
        io.to(opponent.socketId).emit('duel:found', { 
          roomId, 
          opponent: user,
          subjectId 
        });
        
        socket.emit('duel:found', { 
          roomId, 
          opponent,
          subjectId 
        });
        
        // Mark both as in game
        user.inGame = true;
        opponent.inGame = true;
        user.searching = null;
      } else {
        user.searching = subjectId;
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      users.delete(socket.id);
      io.emit('users:update', Array.from(users.values()));
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Explicitly handle SPA fallback in 개발
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const template = await vite.transformIndexHtml(url, `
          <!doctype html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Study Duel</title>
            </head>
            <body>
              <div id="root"></div>
              <script type="module" src="/src/main.tsx"></script>
            </body>
          </html>
        `);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
