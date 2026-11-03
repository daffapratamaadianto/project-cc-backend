const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// POST /api/v1/auth/register
const register = async (req, res) => {
  try {
    // 1. Tangkap role dari req.body (default 'creator')
    const { name, email, password, role = 'creator' } = req.body;

    // Daftar role yang diizinkan
    const allowedRoles = ['creator', 'editor', 'admin'];
    const selectedRole = allowedRoles.includes(role) ? role : 'creator';

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      name.trim().length > 100 ||
      typeof email !== 'string' ||
      !email.trim() ||
      email.trim().length > 191 ||
      typeof password !== 'string' ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan email wajib diisi, nama maksimal 100 karakter, email maksimal 191 karakter, dan password minimal 8 karakter.',
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email sudah terdaftar',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // 2. Gunakan selectedRole pada query INSERT
    const [result] = await db.execute(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, ?)`,
      [cleanName, cleanEmail, passwordHash, selectedRole]
    );

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        id: result.insertId,
        name: cleanName,
        email: cleanEmail,
        role: selectedRole, // 3. Kembalikan role dinamis pada response
      },
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Email sudah terdaftar',
      });
    }

    console.error('Register error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
    });
  }
};

// POST /api/v1/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const [users] = await db.execute(
      `SELECT id, name, email, password_hash, role
       FROM users
       WHERE email = ?`,
      [cleanEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
      });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET belum dikonfigurasi');
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
    });
  }
};

// GET /api/v1/auth/me
const getMe = async (req, res) => {
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
      message: 'Terjadi kesalahan pada server',
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
};