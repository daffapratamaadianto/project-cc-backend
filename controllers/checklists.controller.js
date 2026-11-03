const db = require('../config/db');

function getValidId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Helper Otorisasi Akses Konten
async function canAccessContent(req, contentId) {
  const [contents] = await db.query(
    'SELECT id, user_id, editor_id FROM contents WHERE id = ?',
    [contentId]
  );

  if (!contents.length) return false;

  // Admin dan Creator selalu diizinkan mengakses checklist konten
  if (['admin', 'creator'].includes(req.user.role)) {
    return true;
  }

  // Jika Editor, izinkan jika konten ditugaskan (assigned) ke ID editor tersebut
  if (req.user.role === 'editor') {
    return Number(contents[0].editor_id) === Number(req.user.id);
  }

  return false;
}

async function getChecklists(req, res) {
  try {
    const contentId = getValidId(req.params.id);

    if (!contentId) {
      return res.status(400).json({
        success: false,
        message: 'ID konten tidak valid.',
      });
    }

    if (!(await canAccessContent(req, contentId))) {
      return res.status(404).json({
        success: false,
        message: 'Konten tidak ditemukan.',
      });
    }

    const [checklists] = await db.query(
      `SELECT id, content_id, task_name, is_completed, created_at
       FROM content_checklists
       WHERE content_id = ?
       ORDER BY id ASC`,
      [contentId]
    );

    return res.status(200).json({
      success: true,
      message: 'Checklist berhasil diambil.',
      data: checklists,
    });
  } catch (error) {
    console.error('Get checklists error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil checklist.',
    });
  }
}

async function createChecklist(req, res) {
  try {
    const contentId = getValidId(req.params.id);
    const { task_name } = req.body;

    if (!contentId) {
      return res.status(400).json({
        success: false,
        message: 'ID konten tidak valid.',
      });
    }

    if (
      typeof task_name !== 'string' ||
      !task_name.trim() ||
      task_name.trim().length > 255
    ) {
      return res.status(400).json({
        success: false,
        message: 'task_name wajib diisi dan maksimal 255 karakter.',
      });
    }

    if (!['admin', 'creator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Kamu tidak memiliki izin menambah checklist.',
      });
    }

    if (!(await canAccessContent(req, contentId))) {
      return res.status(404).json({
        success: false,
        message: 'Konten tidak ditemukan.',
      });
    }

    const [result] = await db.query(
      `INSERT INTO content_checklists (content_id, task_name)
       VALUES (?, ?)`,
      [contentId, task_name.trim()]
    );

    const [rows] = await db.query(
      `SELECT id, content_id, task_name, is_completed, created_at
       FROM content_checklists
       WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Tugas checklist berhasil ditambahkan.',
      data: rows[0],
    });
  } catch (error) {
    console.error('Create checklist error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan tugas checklist.',
    });
  }
}

async function deleteChecklist(req, res) {
  try {
    const checklistId = getValidId(req.params.id);

    if (!checklistId) {
      return res.status(400).json({
        success: false,
        message: 'ID checklist tidak valid.',
      });
    }

    if (!['admin', 'creator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Kamu tidak memiliki izin menghapus checklist.',
      });
    }

    const [checklists] = await db.query(
      `SELECT cc.id, cc.content_id, c.user_id
       FROM content_checklists cc
       INNER JOIN contents c ON c.id = cc.content_id
       WHERE cc.id = ?`,
      [checklistId]
    );

    if (!checklists.length) {
      return res.status(404).json({
        success: false,
        message: 'Checklist tidak ditemukan.',
      });
    }

    // Cek akses ke konten terkait
    if (!(await canAccessContent(req, checklists[0].content_id))) {
      return res.status(404).json({
        success: false,
        message: 'Konten tidak ditemukan.',
      });
    }

    await db.query('DELETE FROM content_checklists WHERE id = ?', [checklistId]);

    return res.status(200).json({
      success: true,
      message: 'Checklist berhasil dihapus.',
    });
  } catch (error) {
    console.error('Delete checklist error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus checklist.',
    });
  }
}

async function toggleChecklist(req, res) {
  try {
    const checklistId = getValidId(req.params.id);

    if (!checklistId) {
      return res.status(400).json({
        success: false,
        message: 'ID checklist tidak valid.',
      });
    }

    // Izinkan Admin, Creator, DAN Editor untuk mengubah (centang) status checklist
    if (!['admin', 'creator', 'editor'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Kamu tidak memiliki izin mengubah checklist.',
      });
    }

    const [checklists] = await db.query(
      `SELECT cc.id, cc.content_id, cc.is_completed, c.user_id, c.editor_id
       FROM content_checklists cc
       INNER JOIN contents c ON c.id = cc.content_id
       WHERE cc.id = ?`,
      [checklistId]
    );

    if (!checklists.length) {
      return res.status(404).json({
        success: false,
        message: 'Checklist tidak ditemukan.',
      });
    }

    // Cek akses konten terkait
    if (!(await canAccessContent(req, checklists[0].content_id))) {
      return res.status(404).json({
        success: false,
        message: 'Konten tidak ditemukan.',
      });
    }

    const currentStatus = Number(checklists[0].is_completed);
    const newStatus = currentStatus === 1 ? 0 : 1;

    await db.query(
      `UPDATE content_checklists
       SET is_completed = ?
       WHERE id = ?`,
      [newStatus, checklistId]
    );

    const [updated] = await db.query(
      `SELECT id, content_id, task_name, is_completed, created_at
       FROM content_checklists
       WHERE id = ?`,
      [checklistId]
    );

    return res.status(200).json({
      success: true,
      message: 'Status checklist berhasil diubah.',
      data: updated[0],
    });
  } catch (error) {
    console.error('Toggle checklist error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Gagal mengubah status checklist.',
    });
  }
}

module.exports = {
  getChecklists,
  createChecklist,
  toggleChecklist,
  deleteChecklist,
};