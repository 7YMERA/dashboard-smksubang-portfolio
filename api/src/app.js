import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { supabase, missingEnv } from './supabase.js';
import { fail } from './auth.js';
import dashboard from './modules/dashboard.js';
import auth from './modules/auth.js';
import links from './modules/links.js';
import announcements from './modules/announcements.js';
import sync from './modules/sync.js';
import admin from './modules/admin.js';
import accounts from './modules/accounts.js';
import views from './modules/views.js';

const app = express();
const origins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);

app.use(helmet());
app.use(cors({ origin: origins.length ? origins : false }));
app.use(express.json({ limit: '8mb' })); // the timetable sync can be large

app.get('/api/health', (_req, res) => res.json({
  ok: missingEnv.length === 0,
  time: new Date().toISOString(),
  missingEnv,
  adminTokenSet: Boolean(process.env.ADMIN_TOKEN),
}));

app.use('/api', (_req, res, next) => {
  if (!supabase) return res.status(503).json({ error: `Missing environment variables: ${missingEnv.join(', ')}` });
  next();
});

// One router per module (see README → Modules).
app.use(dashboard);     // Public home page data
app.use(auth);          // Admin login
app.use(links);         // Pautan
app.use(announcements); // Pengumuman
app.use(sync);          // Data in: Apps Script sync (Penghantaran, Tugasan, Analisis), imports
app.use(admin);         // Admin overview (pending names, admin charts, Status Sync)
app.use(accounts);      // Akaun: add/remove Panel Admin accounts (admin only)
app.use(views);         // Jadual Makmal (public, no names) and Penyata Cuti (login only)

app.use((err, _req, res, _next) => fail(res, err));

export default app;
