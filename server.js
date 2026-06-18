const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const initDatabase = require('./src/database/initDatabase');
const registerApiRoutes = require('./src/routes/apiRoutes');
const { errorMiddleware } = require('./src/utils/errorHandler');

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// ─── Startup Environment Validation ─────────────────────────────
if (isProduction) {
  const requiredEnvVars = ['JWT_SECRET', 'PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'];
  const missing = requiredEnvVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error(`❌ FATAL: Environment variables belum diset: ${missing.join(', ')}`);
    console.error('   Tambahkan di file .env sebelum menjalankan production server.');
    process.exit(1);
  }
}

// ─── Security: Trust proxy (jika di belakang Nginx/reverse proxy) ──
if (isProduction) {
  app.set('trust proxy', 1);
}

// ─── Compression middleware (gzip/deflate) ──────────────────────
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Compression level (0-9, 6 is default)
}));

// ─── Security Headers ──────────────────────────────────────────
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions policy — disable unused features
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');

  if (isProduction) {
    // HSTS — force HTTPS for 1 year (hanya jika pakai HTTPS)
    // res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
});

// ─── CORS Configuration ─────────────────────────────────────────
// Dalam arsitektur monolith (Express serve frontend), CORS yang ketat
// diperlukan agar hanya origin yang diizinkan bisa akses API
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:3001', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Dalam LAN, izinkan semua IP lokal (192.168.x.x, 10.x.x.x, etc)
    if (/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|localhost)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true
}));

// ─── Body Parsing with Size Limits ──────────────────────────────
app.use(express.json({ limit: '10mb' })); // Limit JSON body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Rate Limiting (Basic) ──────────────────────────────────────
// Simple in-memory rate limiter untuk login endpoint
const loginAttempts = new Map();
const LOGIN_RATE_LIMIT = { maxAttempts: 10, windowMs: 15 * 60 * 1000 }; // 10 attempts per 15 min

app.use('/api/auth/login', (req, res, next) => {
  if (req.method !== 'POST') return next();

  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record) {
    // Bersihkan window yang sudah expired
    if (now - record.firstAttempt > LOGIN_RATE_LIMIT.windowMs) {
      loginAttempts.set(ip, { count: 1, firstAttempt: now });
      return next();
    }

    if (record.count >= LOGIN_RATE_LIMIT.maxAttempts) {
      const retryAfter = Math.ceil((record.firstAttempt + LOGIN_RATE_LIMIT.windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil(retryAfter / 60)} menit.`
      });
    }

    record.count++;
  } else {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  }

  next();
});

// Bersihkan rate limit map secara berkala (setiap 30 menit)
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttempts.entries()) {
    if (now - record.firstAttempt > LOGIN_RATE_LIMIT.windowMs) {
      loginAttempts.delete(ip);
    }
  }
}, 30 * 60 * 1000);

// ─── Static files: Uploads (foto santri, aset kartu ujian) ──────
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
  maxAge: isProduction ? '7d' : 0,
  etag: true,
}));

// ─── Static files with caching headers ──────────────────────────
app.use(express.static(path.join(__dirname, 'frontend/dist'), {
  maxAge: isProduction ? '1y' : 0,
  etag: true,
  lastModified: true,
}));

// ─── API Routes ─────────────────────────────────────────────────
registerApiRoutes(app);

// ─── Keuangan Module Routes ──────────────────────────────────────
// Diregister setelah compile TypeScript (npm run keuangan:build) - reload compiled routes
try {
  const { registerKeuanganRoutes } = require('./keuangan/dist/routes/index');
  registerKeuanganRoutes(app);
} catch (e) {
  console.warn('⚠️  Modul keuangan belum dikompilasi. Jalankan: npm run keuangan:build');
}


// ─── SPA Fallback ───────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

// ─── Error handling middleware (must be after all routes) ────────
app.use(errorMiddleware);

// ─── Start Server ───────────────────────────────────────────────
const port = process.env.PORT || 3000;

initDatabase()
  .then(() => {
    app.listen(port, '0.0.0.0', () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║   Sistem Informasi Pesantren Al-Hamid        ║');
      console.log('╚══════════════════════════════════════════════╝');
      console.log(`  Mode     : ${isProduction ? '🔒 PRODUCTION' : '🔧 DEVELOPMENT'}`);
      console.log(`  Server   : http://localhost:${port}`);
      if (!isProduction) {
        console.log(`  Frontend : http://localhost:3001 (Vite dev)`);
      }
      console.log(`  Mobile   : http://[IP-ADDRESS]:${port}`);
      console.log(`  IP Cmd   : ipconfig (Windows) | ifconfig (Linux)`);
      console.log('');
      if (!process.env.JWT_SECRET) {
        console.warn('  ⚠️  JWT_SECRET belum diset! Tambahkan di .env');
      }
    });
  })
  .catch((error) => {
    console.error('❌ Gagal inisialisasi database:', error);
    process.exit(1);
  });
