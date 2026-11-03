require('dotenv').config();

const express = require('express');
const db = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const authenticateToken = require('./middleware/auth.middleware');
const channelsRoutes = require('./routes/channels.routes');
const contentsRoutes = require('./routes/contents.routes');
const checklistsRoutes = require('./routes/checklists.routes');
const metricsRoutes = require('./routes/metrics.routes');
const usersRoutes = require('./routes/users.routes');
const cors = require('cors');

const app = express();

app.use(express.json());

app.use(cors())
// app.use(cors({
//   origin: 'http://localhost:5173',
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));


// Health check
app.get('/api/v1/health', async (req, res) => {
  try {
    await db.query('SELECT 1');

    return res.status(200).json({
      success: true,
      message: 'Express.js dan MySQL terhubung',
    });
  } catch (error) {
    console.error('Database error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Gagal terhubung ke database',
    });
  }
});

// Authentication routes: register dan login
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/channels', channelsRoutes);
app.use('/api/v1/contents', contentsRoutes);
app.use('/api/v1', checklistsRoutes);
app.use('/api/v1', metricsRoutes);
app.use('/api/v1/users', usersRoutes);

// Endpoint untuk mengecek token
app.get('/api/v1/auth/me', authenticateToken, (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Token valid',
      data: {
        user_id: req.user.id,
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});