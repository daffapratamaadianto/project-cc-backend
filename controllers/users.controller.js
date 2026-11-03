
const db = require('../config/db');

async function getAllUsers(req, res) {
  try {
    const [users] = await db.query(`
      SELECT id, name, email, role, created_at
      FROM users
      ORDER BY created_at DESC, id DESC
    `);

    return res.status(200).json({
      success: true,
      message: 'Daftar pengguna berhasil diambil.',
      data: users,
    });
  } catch (error) {
    console.error('Get all users error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar pengguna.',
    });
  }
}

async function getUserById(req, res) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID user tidak valid.',
      });
    }

    const [users] = await db.query(
      `SELECT id, name, email, role, created_at
       FROM users
       WHERE id = ?`,
      [userId]
    );

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Detail user berhasil diambil.',
      data: users[0],
    });
  } catch (error) {
    console.error('Get user by ID error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail user.',
    });
  }
}

// Tambahkan di controllers/users.controller.js
async function getEditors(req, res) {
  try {
    const [editors] = await db.query(
      "SELECT id, name, email FROM users WHERE role = 'editor'"
    );
    return res.status(200).json({
      success: true,
      message: 'Daftar editor berhasil diambil.',
      data: editors,
    });
  } catch (error) {
    console.error('Get editors error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar editor.',
    });
  }
}

async function updateUserRole(req, res) {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body;

    const ALLOWED_ROLES = ['admin', 'creator', 'editor'];
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role tidak valid.',
      });
    }

    const [result] = await db.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Role user berhasil diperbarui.',
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui role user.',
    });
  }
}

module.exports = {
  // ... fungsi controller user lainnya
  getEditors,
  getAllUsers,
  getUserById,
  updateUserRole
};


