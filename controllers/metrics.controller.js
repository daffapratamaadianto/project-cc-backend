const db = require('../config/db');

function getValidId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function canAccessContent(req, contentId) {
  const [contents] = await db.execute(
    'SELECT id, user_id, editor_id FROM contents WHERE id = ?',
    [contentId]
  );

  if (!contents.length) return false;

  // Admin & Creator selalu diizinkan mengakses metrics konten
  if (['admin', 'creator'].includes(req.user.role)) {
    return true;
  }

  // Jika Editor, izinkan jika konten tersebut di-assign ke ID editor-nya
  if (req.user.role === 'editor') {
    return Number(contents[0].editor_id) === Number(req.user.id);
  }

  return false;
}

async function getMetrics(req, res) {
  try {
    const contentId = getValidId(req.params.id);

    if (!contentId) {
      return res.status(400).json({
        success: false,
        message: 'ID content tidak valid.',
      });
    }

    if (!(await canAccessContent(req, contentId))) {
      return res.status(404).json({
        success: false,
        message: 'Content tidak ditemukan.',
      });
    }

    const [metrics] = await db.execute(
      `SELECT id, content_id, recorded_at,
              views_count, likes_count, comments_count, shares_count,
              created_at
       FROM content_metrics
       WHERE content_id = ?
       ORDER BY recorded_at DESC, id DESC`,
      [contentId]
    );

    return res.status(200).json({
      success: true,
      message: 'Riwayat metrics berhasil diambil.',
      data: metrics,
    });
  } catch (error) {
    console.error('Get metrics error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil riwayat metrics.',
    });
  }
}

async function createMetrics(req, res) {
  try {
    const contentId = getValidId(req.params.id);

    if (!contentId) {
      return res.status(400).json({
        success: false,
        message: 'ID content tidak valid.',
      });
    }

    if (!['admin', 'creator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Kamu tidak memiliki izin menambahkan metrics.',
      });
    }

    if (!(await canAccessContent(req, contentId))) {
      return res.status(404).json({
        success: false,
        message: 'Content tidak ditemukan.',
      });
    }

    // Parsing ke Number untuk menghindari kegagalan tipe data String
    const views_count = Number(req.body.views_count || 0);
    const likes_count = Number(req.body.likes_count || 0);
    const comments_count = Number(req.body.comments_count || 0);
    const shares_count = Number(req.body.shares_count || 0);

    const counts = {
      views_count,
      likes_count,
      comments_count,
      shares_count,
    };

    for (const [field, value] of Object.entries(counts)) {
      if (
        !Number.isInteger(value) ||
        value < 0 ||
        value > 2147483647
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} harus berupa bilangan bulat non-negatif.`,
        });
      }
    }

    const [result] = await db.execute(
      `INSERT INTO content_metrics (
        content_id,
        recorded_at,
        views_count,
        likes_count,
        comments_count,
        shares_count
      ) VALUES (?, CURDATE(), ?, ?, ?, ?)`,
      [
        contentId,
        views_count,
        likes_count,
        comments_count,
        shares_count,
      ]
    );

    const [rows] = await db.execute(
      `SELECT id, content_id, recorded_at,
              views_count, likes_count, comments_count, shares_count,
              created_at
       FROM content_metrics
       WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Metrics berhasil disimpan.',
      data: rows[0],
    });
  } catch (error) {
    console.error('Create metrics error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan metrics.',
    });
  }
}

module.exports = {
  getMetrics,
  createMetrics,
};