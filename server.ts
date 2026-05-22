import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { connectDB, DB } from './server/db.js';
import { authRouter } from './server/auth.js';
import { itemsRouter } from './server/items.js';
import { claimsRouter } from './server/claims.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Crucial: Increase payload limits specifically to support Base64 photo uploads securely
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // 1. Establish Database Connection (Mongoose + JSON Fallback)
  await connectDB();

  // 2. Register API Routes
  app.use('/api/auth', authRouter);
  app.use('/api', itemsRouter);
  app.use('/api', claimsRouter);

  // App metrics & diagnostics readout for debugging/status indicators
  app.get('/api/diagnostics', async (req, res) => {
    try {
      const stats = await DB.getStats();
      res.json({
        status: "online",
        timestamp: new Date().toISOString(),
        dbStats: stats,
        env: {
          hasGeminiKey: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY",
          nodeEnv: process.env.NODE_ENV || 'development'
        }
      });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  });

  // 3. Mount Frontend Content (Vite Middleware in Dev, Static Files in Production)
  if (process.env.NODE_ENV !== 'production') {
    console.log('Running server in Development mode with Vite router middleware connection.');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Running server in Production mode. Serving static assets compiled inside /dist.');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 4. Start the Application Ingress Listening Interface
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(` Campus Lost & Found System Server Initialized `);
    console.log(` Access link: http://localhost:${PORT}        `);
    console.log(`===============================================`);
  });
}

startServer().catch(err => {
  console.error('Fatal crash on server lifecycle startup:', err);
  process.exit(1);
});
