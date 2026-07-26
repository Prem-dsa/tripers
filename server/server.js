require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const { initSocket } = require('./socket/socketHandler');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const tripRoutes = require('./routes/trips');
const expenseRoutes = require('./routes/expenses');
const settlementRoutes = require('./routes/settlements');
const notificationRoutes = require('./routes/notifications');
const galleryRoutes = require('./routes/gallery');
const chatRoutes = require('./routes/chat');
const reportRoutes = require('./routes/reports');

// ─── Track DB state ────────────────────────────────────────────
let dbConnected = false;

const app = express();
const server = http.createServer(app);

// ─── CORS configuration ───────────────────────────────────────
// Static allow-list: covers every port Vite might pick locally
// (5173/5174 are the two most common when one is already in use)
// plus 127.0.0.1 equivalents, plus the deployed frontend from ENV.
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, health checks)
    if (!origin) return callback(null, true);
    // Exact match against the allow-list ...
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // ... or any localhost/127.0.0.1 port during development, so a
    // Vite dev server restart on a different free port never breaks CORS.
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      return callback(null, true);
    }
    // ... or any Vercel preview URL for this project (e.g. the auto-generated
    // "tripers-729d-git-main-....vercel.app" branch URL, or PR previews),
    // so clicking a preview link from GitHub/Vercel's UI never breaks CORS.
    if (/^https:\/\/tripers-729d[a-z0-9-]*\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    console.warn(`⚠️  CORS blocked request from origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

// ─── Socket.io ─────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: corsOptions.origin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
initSocket(io);

// Make io accessible to routes
app.set('io', io);

// ─── Middleware ─────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Health & Root routes (BEFORE auth-protected routes) ───────
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'Tripers API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  const mongoState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const isHealthy = mongoState === 1;

  if (isHealthy) {
    return res.status(200).json({
      status: 'ok',
      database: 'connected'
    });
  } else {
    return res.status(503).json({
      status: 'error',
      database: 'disconnected'
    });
  }
});

// Keep the existing /api/health too for backward compatibility
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ─── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reports', reportRoutes);

// ─── Error handler ─────────────────────────────────────────────
app.use(errorHandler);

// ─── Process-level error handlers ──────────────────────────────
// These prevent the server from crashing on unhandled errors,
// which would cause Render to report "Application exited early".
process.on('uncaughtException', (err) => {
  console.error('🔴 Uncaught Exception:', err.message);
  console.error(err.stack);
  // Don't exit — keep the server alive
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔴 Unhandled Rejection at:', promise);
  console.error('   Reason:', reason);
  // Don't exit — keep the server alive
});

// ─── Startup ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function startServer() {
  // 1. Validate critical env vars
  const requiredVars = ['MONGO_URI', 'JWT_SECRET'];
  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
    console.warn('   The server will start but some features may not work.');
  }

  // 2. Connect to MongoDB (non-fatal — server stays alive either way)
  console.log('🔄 Connecting to MongoDB...');
  dbConnected = await connectDB();

  // 3. Start listening — this MUST happen regardless of DB state
  //    so Render can detect the open port.
  server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🚀 Tripers Server running on port ${PORT}`);
    console.log(`📱 Client URL: ${process.env.CLIENT_URL || '(not set)'}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  MongoDB: ${dbConnected ? 'connected' : 'NOT connected'}`);
    console.log(`⏱️  Started at: ${new Date().toISOString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  });

  // 4. Handle server-level errors
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use.`);
    } else {
      console.error('❌ Server error:', err.message);
    }
  });
}

startServer();

module.exports = { app, server };
