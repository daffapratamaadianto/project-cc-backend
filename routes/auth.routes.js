
const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
} = require('../controllers/auth.controller');

const authenticateToken = require('../middleware/auth.middleware');

// POST /api/v1/auth/register
router.post('/register', register);

// POST /api/v1/auth/login
router.post('/login', login);

// GET /api/v1/auth/me
router.get('/me', authenticateToken, getMe);

module.exports = router;
